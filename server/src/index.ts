import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import bodyParser from 'body-parser';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import ExcelJS from 'exceljs';
import crypto from 'crypto';

import { Bill } from './models/Bill';
import { Farmer } from './models/Farmer';
import { Setting } from './models/Setting';
import { PriceConfig } from './models/PriceConfig';
import { User } from './models/User';
import { ActivityLog } from './models/ActivityLog';
import { ShareLink } from './models/ShareLink';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;
const JWT_SECRET = process.env.JWT_SECRET || 'sugarcane-secret-key-change-in-prod';

const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));
app.use(bodyParser.json()); // Replaced express.json() with bodyParser.json() as per instruction

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sugarcane-db';

mongoose.connect(MONGODB_URI)
    .then(() => console.log('MongoDB Connected')) // Changed log message
    .catch(err => console.log(err)); // Changed error handling

// --- Excel Sync Helper ---
const EXCEL_FILE_PATH = path.join(__dirname, '../sugarcane_bills.xlsx');

const syncToExcel = async (billData: any) => {
    try {
        const workbook = new ExcelJS.Workbook();
        let worksheet;

        if (fs.existsSync(EXCEL_FILE_PATH)) {
            await workbook.xlsx.readFile(EXCEL_FILE_PATH);
            worksheet = workbook.getWorksheet('รวมทั้งปี');
        }

        if (!worksheet) {
            worksheet = workbook.addWorksheet('รวมทั้งปี');
            worksheet.columns = [
                { header: 'เลขที่บิล', key: 'billNumber', width: 15 },
                { header: 'เลขโควตา', key: 'quotaNumber', width: 15 },
                { header: 'ชื่อเจ้าของบิล', key: 'ownerName', width: 25 },
                { header: 'วันที่', key: 'date', width: 15 },
                { header: 'ประเภทอ้อย', key: 'sugarcaneType', width: 15 },
                { header: 'น้ำหนัก (ตัน)', key: 'weight', width: 15 },
                { header: 'ราคาต่อตัน', key: 'pricePerUnit', width: 15 },
                { header: 'ค่าน้ำมัน', key: 'fuelCost', width: 15 },
                { header: 'ยอดสุทธิ', key: 'netAmount', width: 15 },
            ];
        }

        const typeMap: { [key: number]: string } = { 1: 'อ้อยสด', 2: 'อ้อยไฟไหม้', 3: 'อ้อยยอดยาว' };

        worksheet.addRow({
            billNumber: billData.billNumber,
            quotaNumber: billData.quotaNumber || '-',
            ownerName: billData.ownerName,
            date: new Date(billData.date).toLocaleDateString('th-TH'),
            sugarcaneType: typeMap[billData.sugarcaneType] || billData.sugarcaneType,
            weight: billData.weight,
            pricePerUnit: billData.pricePerUnit,
            fuelCost: billData.fuelCost,
            netAmount: billData.netAmount
        });

        await workbook.xlsx.writeFile(EXCEL_FILE_PATH);
        console.log('Synced to Excel:', EXCEL_FILE_PATH);
    } catch (error) {
        console.error('Error syncing to Excel:', error);
    }
};

// --- Middleware ---

// Extend Express Request to include user
declare global {
    namespace Express {
        interface Request {
            user?: any;
        }
    }
}

const authenticateToken = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

const authorizeRole = (roles: string[]) => {
    return (req: express.Request, res: express.Response, next: express.NextFunction) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.sendStatus(403);
        }
        next();
    };
};

const logActivity = async (req: express.Request, action: string, details?: string) => {
    if (!req.user) return;
    try {
        await ActivityLog.create({
            userId: req.user.id,
            username: req.user.username,
            role: req.user.role,
            action,
            details
        });
    } catch (error) {
        console.error('Error logging activity:', error);
    }
};

// --- Auth Routes ---

app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;

    // Emergency Root User (Hardcoded)
    if (username === 'Phat' && password === 'P@ssw0rd') {
        const token = jwt.sign({ id: 'emergency_root_id', username: 'Phat', role: 'root' }, JWT_SECRET, { expiresIn: '1d' });
        return res.json({ token, user: { username: 'Phat', role: 'root' } });
    }

    try {
        const user = await User.findOne({ username });
        if (!user) return res.status(400).json({ message: 'User not found' });

        const isMatch = await bcrypt.compare(password, user.password!);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        const token = jwt.sign({ id: user._id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '1d' });

        // Log login activity
        await ActivityLog.create({
            userId: user._id,
            username: user.username,
            role: user.role,
            action: 'LOGIN',
            details: 'User logged in'
        });

        res.json({ token, user: { username: user.username, role: user.role } });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

app.post('/api/auth/logout', authenticateToken, async (req, res) => {
    try {
        await logActivity(req, 'LOGOUT', 'User logged out');
        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error logging out', error });
    }
});

app.post('/api/auth/seed', async (req, res) => {
    try {
        const adminExists = await User.findOne({ username: 'admin' });
        const rootExists = await User.findOne({ username: 'root' });

        if (adminExists && rootExists) {
            return res.json({ message: 'Users already seeded' });
        }

        const salt = await bcrypt.genSalt(10);

        if (!adminExists) {
            const adminPassword = await bcrypt.hash('admin123', salt);
            await User.create({ username: 'admin', password: adminPassword, role: 'admin' });
        }

        if (!rootExists) {
            const rootPassword = await bcrypt.hash('root123', salt);
            await User.create({ username: 'root', password: rootPassword, role: 'root' });
        }

        res.json({ message: 'Users seeded successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error seeding users', error });
    }
});

// --- User Management Routes (Root Only) ---

app.get('/api/users', authenticateToken, authorizeRole(['root']), async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ username: 1 });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching users', error });
    }
});

app.post('/api/users', authenticateToken, authorizeRole(['root']), async (req, res) => {
    try {
        const { username, password, role } = req.body;

        // Check if user exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: 'Username already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await User.create({
            username,
            password: hashedPassword,
            role
        });

        await logActivity(req, 'CREATE_USER', `Created user ${username} with role ${role}`);

        res.status(201).json({ message: 'User created successfully', user: { username, role } });
    } catch (error) {
        res.status(500).json({ message: 'Error creating user', error });
    }
});

// Update user (Root only - with Super Root check)
app.put('/api/users/:id', authenticateToken, authorizeRole(['root']), async (req, res) => {
    try {
        const { username, password, role } = req.body;
        const targetUser = await User.findById(req.params.id);

        if (!targetUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Super Root Protection: Only 'Phat' can edit other 'root' users
        if (targetUser.role === 'root' && req.user.username !== 'Phat') {
            return res.status(403).json({ message: 'Only Super Root can edit other root users' });
        }

        // prevent changing Phat's username or role
        if (targetUser.username === 'Phat') {
            // If trying to change Phat's critical info
            if (username !== 'Phat' || role !== 'root') {
                return res.status(403).json({ message: 'Cannot modify Super Root core attributes' });
            }
        }

        // Update fields
        targetUser.username = username || targetUser.username;
        targetUser.role = role || targetUser.role;

        if (password) {
            const salt = await bcrypt.genSalt(10);
            targetUser.password = await bcrypt.hash(password, salt);
        }

        await targetUser.save();
        await logActivity(req, 'UPDATE_USER', `Updated user ${targetUser.username}`);

        res.json({ message: 'User updated successfully', user: { username: targetUser.username, role: targetUser.role } });
    } catch (error: any) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Username already exists' });
        }
        res.status(500).json({ message: 'Error updating user', error });
    }
});


app.delete('/api/users/:id', authenticateToken, authorizeRole(['root']), async (req, res) => {
    try {
        const userToDelete = await User.findById(req.params.id);
        if (!userToDelete) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Super Root Protection: Only 'Phat' can delete other 'root' users
        if (userToDelete.role === 'root' && req.user.username !== 'Phat') {
            return res.status(403).json({ message: 'Only Super Root can delete other root users' });
        }

        // Prevent deleting Phat or Self
        if (userToDelete.username === 'Phat') {
            return res.status(400).json({ message: 'Cannot delete Super Root' });
        }
        if (userToDelete._id.toString() === req.user.id) {
            return res.status(400).json({ message: 'Cannot delete yourself' });
        }

        await User.findByIdAndDelete(req.params.id);
        await logActivity(req, 'DELETE_USER', `Deleted user ${userToDelete.username}`);

        res.json({ message: 'User deleted successfully' });

    } catch (error) {
        res.status(500).json({ message: 'Error deleting user', error });
    }
});

// --- Activity Log Routes ---

app.get('/api/activity-logs', authenticateToken, authorizeRole(['root']), async (req, res) => {
    try {
        const logs = await ActivityLog.find().sort({ timestamp: -1 });
        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching logs', error });
    }
});

// Delete old logs (Root only) - older than 3 days
app.delete('/api/activity-logs/prune', authenticateToken, authorizeRole(['root']), async (req, res) => {
    try {
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

        const result = await ActivityLog.deleteMany({
            timestamp: { $lt: threeDaysAgo }
        });

        await logActivity(req, 'PRUNE_LOGS', `Cleared ${result.deletedCount} logs older than ${threeDaysAgo.toLocaleDateString()}`);

        res.json({ message: `Logs pruned successfully`, deletedCount: result.deletedCount });
    } catch (error) {
        res.status(500).json({ message: 'Error pruning logs', error });
    }
});

// --- Farmer Routes ---

// Get all farmers (Root only)
app.get('/api/farmers', authenticateToken, authorizeRole(['root', 'admin']), async (req, res) => {
    try {
        const farmers = await Farmer.find().sort({ name: 1 });
        res.json(farmers);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching farmers', error });
    }
});

// Create new farmer (Root only - direct creation)
app.post('/api/farmers', authenticateToken, authorizeRole(['root']), async (req, res) => {
    try {
        const newFarmer = new Farmer(req.body);
        const savedFarmer = await newFarmer.save();
        await logActivity(req, 'ADD_FARMER', `Added farmer ${savedFarmer.name}`);
        res.status(201).json(savedFarmer);
    } catch (error) {
        res.status(500).json({ message: 'Error creating farmer', error });
    }
});

// Update farmer (Root only)
app.put('/api/farmers/:id', authenticateToken, authorizeRole(['root']), async (req, res) => {
    try {
        const updatedFarmer = await Farmer.findByIdAndUpdate(req.params.id, req.body, { new: true });
        await logActivity(req, 'UPDATE_FARMER', `Updated farmer ${updatedFarmer?.name}`);
        res.json(updatedFarmer);
    } catch (error) {
        res.status(500).json({ message: 'Error updating farmer', error });
    }
});

// Delete farmer (Root only)
app.delete('/api/farmers/:id', authenticateToken, authorizeRole(['root']), async (req, res) => {
    try {
        const deletedFarmer = await Farmer.findByIdAndDelete(req.params.id);
        if (deletedFarmer) {
            await logActivity(req, 'DELETE_FARMER', `Deleted farmer ${deletedFarmer.name}`);
        }
        res.json({ message: 'Farmer deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting farmer', error });
    }
});

// Settings API
// Get settings (Admin & Root)
app.get('/api/settings', authenticateToken, authorizeRole(['admin', 'root']), async (req, res) => {
    try {
        const settings = await Setting.findOne();
        res.json(settings || { quotas: [] });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching settings', error });
    }
});

// Update settings (Admin & Root)
app.put('/api/settings', authenticateToken, authorizeRole(['admin', 'root']), async (req, res) => {
    try {
        const { quotas, freshPrice, burntPrice, longTopPrice } = req.body;

        // Update Setting model (for quotas)
        let settings = await Setting.findOne();
        if (!settings) {
            settings = new Setting({ quotas: [] });
        }
        if (quotas) settings.quotas = quotas;
        await settings.save();

        // Update PriceConfig (if prices provided) - Create new effective entry
        if (freshPrice !== undefined || burntPrice !== undefined || longTopPrice !== undefined) {
            // Fetch current latest price to fill in missing values if partial update
            const currentPrice = await PriceConfig.findOne().sort({ effectiveDate: -1 });

            const newPriceConfig = new PriceConfig({
                effectiveDate: new Date(), // Effective now
                freshPrice: freshPrice !== undefined ? freshPrice : currentPrice?.freshPrice || 0,
                burntPrice: burntPrice !== undefined ? burntPrice : currentPrice?.burntPrice || 0,
                longTopPrice: longTopPrice !== undefined ? longTopPrice : currentPrice?.longTopPrice || 0,
            });
            await newPriceConfig.save();
        }

        await logActivity(req, 'UPDATE_SETTINGS', 'Updated system settings');

        res.json({ message: 'Settings updated successfully', settings });
    } catch (error) {
        res.status(500).json({ message: 'Error updating settings', error });
    }
});

// Price Config API (Original routes, protected)
app.get('/api/prices', authenticateToken, authorizeRole(['admin', 'root']), async (req, res) => {
    try {
        const prices = await PriceConfig.find().sort({ effectiveDate: -1 });
        res.json(prices);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching prices', error });
    }
});

app.post('/api/prices', authenticateToken, authorizeRole(['admin', 'root']), async (req, res) => {
    try {
        const { effectiveDate, freshPrice, burntPrice, longTopPrice } = req.body;

        // Check if a config already exists for this date
        const existingConfig = await PriceConfig.findOne({ effectiveDate: new Date(effectiveDate) });
        if (existingConfig) {
            existingConfig.freshPrice = freshPrice;
            existingConfig.burntPrice = burntPrice;
            existingConfig.longTopPrice = longTopPrice;
            await existingConfig.save();
            await logActivity(req, 'UPDATE_PRICE_CONFIG', `Updated price config for ${effectiveDate}`);
            return res.json(existingConfig);
        }

        const newPriceConfig = await PriceConfig.create({
            effectiveDate: new Date(effectiveDate),
            freshPrice,
            burntPrice,
            longTopPrice
        });
        await logActivity(req, 'ADD_PRICE_CONFIG', `Added new price config for ${effectiveDate}`);
        res.status(201).json(newPriceConfig);
    } catch (error) {
        res.status(500).json({ message: 'Error creating price config', error });
    }
});

app.delete('/api/prices/:id', authenticateToken, authorizeRole(['root']), async (req, res) => {
    try {
        const deletedPriceConfig = await PriceConfig.findByIdAndDelete(req.params.id);
        if (deletedPriceConfig) {
            await logActivity(req, 'DELETE_PRICE_CONFIG', `Deleted price config with ID ${req.params.id}`);
        }
        res.json({ message: 'Price config deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting price config', error });
    }
});


// Price Check API (Get active price for a specific date)
// Get Price Check (Admin & Root)
app.get('/api/price-check', authenticateToken, authorizeRole(['admin', 'root']), async (req, res) => {
    try {
        const { date } = req.query;
        const queryDate = date ? new Date(date as string) : new Date();

        // Find the latest price config that is effective on or before the query date
        const priceConfig = await PriceConfig.findOne({
            effectiveDate: { $lte: queryDate }
        }).sort({ effectiveDate: -1 });

        if (!priceConfig) {
            // Fallback to defaults if no config found
            return res.json({ freshPrice: 0, burntPrice: 0, longTopPrice: 0 });
        }

        res.json(priceConfig);
    } catch (error) {
        res.status(500).json({ message: 'Error checking price', error });
    }
});

// Routes
// Get all bills (Admin & Root)
app.get('/api/bills', authenticateToken, authorizeRole(['admin', 'root']), async (req, res) => {
    try {
        const bills = await Bill.find().sort({ date: -1, createdAt: -1 }); // Changed sort order
        res.json(bills);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching bills', error });
    }
});

// Add new bill (Admin & Root)
app.post('/api/bills', authenticateToken, authorizeRole(['admin', 'root']), async (req, res) => {
    try {
        const { billNumber, ownerName, quotaNumber, sugarcaneType, weight, fuelCost = 0, date, manualPrice, licensePlate } = req.body; // Added licensePlate to destructuring
        const billDate = new Date(date);

        // 1. Check for duplicate bill number
        const existingBill = await Bill.findOne({ billNumber });
        if (existingBill) {
            return res.status(400).json({ message: 'เลขที่บิลนี้มีอยู่ในระบบแล้ว' });
        }

        let pricePerUnit = 0;

        if (manualPrice !== undefined && manualPrice !== null) {
            // Use manual price if provided
            pricePerUnit = Number(manualPrice);
        } else {
            // 1. Find applicable price config
            // Find the latest price config that has an effective date <= bill date
            let priceConfig = await PriceConfig.findOne({ effectiveDate: { $lte: billDate } }).sort({ effectiveDate: -1 });

            // Fallback: if no price config found (e.g. bill date is before any config), use the oldest config or default
            if (!priceConfig) {
                const legacySetting = await Setting.findOne();
                priceConfig = {
                    freshPrice: legacySetting?.freshPrice || 1200,
                    burntPrice: legacySetting?.burntPrice || 1000,
                    longTopPrice: legacySetting?.longTopPrice || 1100
                } as any;
            }

            // 2. Determine price per unit
            if (sugarcaneType === 1) pricePerUnit = priceConfig!.freshPrice;
            else if (sugarcaneType === 2) pricePerUnit = priceConfig!.burntPrice;
            else if (sugarcaneType === 3) pricePerUnit = priceConfig!.longTopPrice;
        }

        // 3. Calculate amounts
        // Weight is in tons, price is per ton
        // Formula: Total = Weight (tons) * Price (per ton)

        const totalAmount = weight * pricePerUnit;
        const netAmount = totalAmount - fuelCost;

        // Create new bill
        const newBill = new Bill({
            billNumber,
            ownerName,
            quotaNumber,
            licensePlate: req.body.licensePlate,
            date: new Date(date),
            sugarcaneType,
            weight,
            fuelCost: fuelCost || 0,
            pricePerUnit,
            totalAmount,
            netAmount
        });

        await newBill.save();

        // Update Farmer's license plates if provided
        if (req.body.licensePlate) {
            const farmer = await Farmer.findOne({ name: ownerName });
            if (farmer) {
                if (!farmer.licensePlates.includes(req.body.licensePlate)) {
                    farmer.licensePlates.push(req.body.licensePlate);
                    await farmer.save();
                }
            } else {
                // Optional: Create farmer if not exists (though frontend usually handles selection)
                await new Farmer({
                    name: ownerName,
                    licensePlates: [req.body.licensePlate]
                }).save();
            }
        }

        // Sync to Excel
        await syncToExcel(newBill);

        // Log Activity
        await logActivity(req, 'ADD_BILL', `Added bill ${billNumber} for ${ownerName}`);

        res.status(201).json(newBill);
    } catch (error: any) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'เลขที่บิลนี้มีอยู่ในระบบแล้ว กรุณาใช้เลขที่อื่น' });
        }
        res.status(400).json({ message: 'Error creating bill', error });
    }
});


app.get('/api/bills/check-duplicate/:billNumber', authenticateToken, authorizeRole(['admin', 'root']), async (req, res) => {
    try {
        const { billNumber } = req.params;
        const bill = await Bill.findOne({ billNumber });
        res.json({ exists: !!bill });
    } catch (error) {
        res.status(500).json({ message: 'Error checking duplicate bill', error });
    }
});

app.put('/api/bills/:id', authenticateToken, authorizeRole(['root']), async (req, res) => {
    try {
        const { id } = req.params;
        const { ownerName, quotaNumber, sugarcaneType, weight, fuelCost, date, manualPrice, licensePlate } = req.body;
        const billDate = new Date(date);

        const bill = await Bill.findById(id);
        if (!bill) {
            return res.status(404).json({ message: 'Bill not found' });
        }

        let pricePerUnit = bill.pricePerUnit;

        // Recalculate price if type or date changed, OR if manual price is provided
        if (manualPrice !== undefined && manualPrice !== null) {
            pricePerUnit = Number(manualPrice);
        } else if (
            sugarcaneType !== bill.sugarcaneType ||
            billDate.getTime() !== new Date(bill.date).getTime()
        ) {
            // Find applicable price config
            let priceConfig = await PriceConfig.findOne({ effectiveDate: { $lte: billDate } }).sort({ effectiveDate: -1 });

            // Fallback
            if (!priceConfig) {
                const legacySetting = await Setting.findOne();
                priceConfig = {
                    freshPrice: legacySetting?.freshPrice || 1200,
                    burntPrice: legacySetting?.burntPrice || 1000,
                    longTopPrice: legacySetting?.longTopPrice || 1100
                } as any;
            }

            if (sugarcaneType === 1) pricePerUnit = priceConfig!.freshPrice;
            else if (sugarcaneType === 2) pricePerUnit = priceConfig!.burntPrice;
            else if (sugarcaneType === 3) pricePerUnit = priceConfig!.longTopPrice;
        }

        // Recalculate amounts
        const totalAmount = weight * pricePerUnit;
        const netAmount = totalAmount - (fuelCost || 0);

        // Update bill
        bill.ownerName = ownerName;
        bill.quotaNumber = quotaNumber;
        bill.licensePlate = licensePlate;
        bill.date = new Date(date);
        bill.sugarcaneType = sugarcaneType;
        bill.weight = weight;
        bill.fuelCost = fuelCost || 0;
        bill.pricePerUnit = pricePerUnit;
        bill.totalAmount = totalAmount;
        bill.netAmount = netAmount;

        const updatedBill = await bill.save();

        // Sync to Excel (Optional: Updating Excel is complex, for now we might skip or append correction. 
        // Instructions didn't specify Excel update strictly, but let's re-sync logic if needed. 
        // For simplicity and safety against corrupting excel, we'll log it.)
        // await syncToExcel(updatedBill); // Be careful with overwriting rows in Excel without ID mapping

        await logActivity(req, 'UPDATE_BILL', `Updated bill ${bill.billNumber}`);

        res.json(updatedBill);
    } catch (error) {
        res.status(500).json({ message: 'Error updating bill', error });
    }
});


// Delete bill (Root only)
app.delete('/api/bills/:id', authenticateToken, authorizeRole(['root']), async (req, res) => {
    try {
        const deletedBill = await Bill.findByIdAndDelete(req.params.id);
        if (!deletedBill) {
            return res.status(404).json({ message: 'Bill not found' });
        }
        await logActivity(req, 'DELETE_BILL', `Deleted bill ${deletedBill.billNumber}`);
        res.json({ message: 'Bill deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting bill', error });
    }
});

// Migration Helper (Run on startup or lazily)
const migrateSettingsToPriceConfig = async () => {
    try {
        const count = await PriceConfig.countDocuments();
        if (count === 0) {
            const setting = await Setting.findOne();
            if (setting) {
                // Create a base price config effective from a long time ago
                await PriceConfig.create({
                    effectiveDate: new Date('2020-01-01'), // Arbitrary past date
                    freshPrice: setting.freshPrice,
                    burntPrice: setting.burntPrice,
                    longTopPrice: setting.longTopPrice
                });
                console.log('Migrated legacy settings to PriceConfig');
            }
        }
    } catch (error) {
        console.error('Migration error:', error);
    }
};

migrateSettingsToPriceConfig();

// Share API
app.post('/api/share', async (req, res) => {
    try {
        const { duration } = req.body; // duration in hours, or 'forever'
        const token = crypto.randomBytes(16).toString('hex');

        let expiresAt: Date | null = null;
        if (duration !== 'forever') {
            expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + Number(duration));
        }

        await ShareLink.create({ token, expiresAt });

        // Return the full URL for the frontend to display
        // Assuming frontend is on port 5173 (dev) or same host in prod
        // We'll just return the token and let frontend construct the URL
        res.json({ token });
    } catch (error) {
        res.status(500).json({ message: 'Error generating share link', error });
    }
});

app.get('/api/share/:token', async (req, res) => {
    try {
        const { token } = req.params;
        const shareLink = await ShareLink.findOne({ token });

        if (!shareLink) {
            return res.status(404).json({ valid: false, message: 'Link not found' });
        }

        if (shareLink.expiresAt && new Date() > shareLink.expiresAt) {
            return res.status(400).json({ valid: false, message: 'Link expired' });
        }

        res.json({ valid: true });
    } catch (error) {
        res.status(500).json({ message: 'Error validating link', error });
    }
});



// --- Serve Static Files (Frontend) ---
const clientBuildPath = path.join(__dirname, '../../client/dist');
if (fs.existsSync(clientBuildPath)) {
    app.use(express.static(clientBuildPath));
    app.get(/(.*)/, (req, res) => {
        // Don't intercept API routes
        if (req.path.startsWith('/api')) {
            // If it's an API route that wasn't caught by previous handlers, it's a 404
            return res.status(404).json({ message: 'API endpoint not found' });
        }
        res.sendFile(path.join(clientBuildPath, 'index.html'));
    });
    console.log(`Serving static files from ${clientBuildPath}`);
}

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
