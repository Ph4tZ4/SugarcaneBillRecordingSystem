import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { Bill } from './models/Bill';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sugarcane-bills';

mongoose.connect(MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('MongoDB connection error:', err));

import { Setting } from './models/Setting';

import { PriceConfig } from './models/PriceConfig';

// Settings API
app.get('/api/settings', async (req, res) => {
    try {
        let setting = await Setting.findOne();
        if (!setting) {
            setting = await Setting.create({ freshPrice: 1200, burntPrice: 1000, longTopPrice: 1100 });
        }
        res.json(setting);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching settings', error });
    }
});

app.put('/api/settings', async (req, res) => {
    try {
        const { quotas } = req.body;
        let setting = await Setting.findOne();
        if (setting) {
            if (quotas) setting.quotas = quotas;
            await setting.save();
        } else {
            setting = await Setting.create({ freshPrice: 1200, burntPrice: 1000, longTopPrice: 1100, quotas: quotas || [] });
        }
        res.json(setting);
    } catch (error) {
        res.status(500).json({ message: 'Error updating settings', error });
    }
});

// Price Config API
app.get('/api/prices', async (req, res) => {
    try {
        const prices = await PriceConfig.find().sort({ effectiveDate: -1 });
        res.json(prices);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching prices', error });
    }
});

app.post('/api/prices', async (req, res) => {
    try {
        const { effectiveDate, freshPrice, burntPrice, longTopPrice } = req.body;

        // Check if a config already exists for this date
        const existingConfig = await PriceConfig.findOne({ effectiveDate: new Date(effectiveDate) });
        if (existingConfig) {
            existingConfig.freshPrice = freshPrice;
            existingConfig.burntPrice = burntPrice;
            existingConfig.longTopPrice = longTopPrice;
            await existingConfig.save();
            return res.json(existingConfig);
        }

        const newPriceConfig = await PriceConfig.create({
            effectiveDate: new Date(effectiveDate),
            freshPrice,
            burntPrice,
            longTopPrice
        });
        res.status(201).json(newPriceConfig);
    } catch (error) {
        res.status(500).json({ message: 'Error creating price config', error });
    }
});

app.delete('/api/prices/:id', async (req, res) => {
    try {
        await PriceConfig.findByIdAndDelete(req.params.id);
        res.json({ message: 'Price config deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting price config', error });
    }
});


// Routes
app.get('/api/bills', async (req, res) => {
    try {
        const bills = await Bill.find().sort({ _id: -1 });
        res.json(bills);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching bills', error });
    }
});

app.post('/api/bills', async (req, res) => {
    try {
        const { sugarcaneType, weight, fuelCost = 0, date } = req.body;
        const billDate = new Date(date);

        // 1. Find applicable price config
        // Find the latest price config that has an effective date <= bill date
        let priceConfig = await PriceConfig.findOne({ effectiveDate: { $lte: billDate } }).sort({ effectiveDate: -1 });

        // Fallback: if no price config found (e.g. bill date is before any config), use the oldest config or default
        if (!priceConfig) {
            // Try to find ANY config (maybe future ones exist, but we need something)
            // Ideally we should have a base config from migration.
            // If really nothing, fallback to current Setting (legacy) or defaults
            const legacySetting = await Setting.findOne();
            priceConfig = {
                freshPrice: legacySetting?.freshPrice || 1200,
                burntPrice: legacySetting?.burntPrice || 1000,
                longTopPrice: legacySetting?.longTopPrice || 1100
            } as any;
        }

        // 2. Determine price per unit
        let pricePerUnit = 0;
        if (sugarcaneType === 1) pricePerUnit = priceConfig!.freshPrice;
        else if (sugarcaneType === 2) pricePerUnit = priceConfig!.burntPrice;
        else if (sugarcaneType === 3) pricePerUnit = priceConfig!.longTopPrice;

        // 3. Calculate amounts
        // Weight is in tons, price is per ton
        // Formula: Total = Weight (tons) * Price (per ton)

        const totalAmount = weight * pricePerUnit;
        const netAmount = totalAmount - fuelCost;

        const newBill = new Bill({
            ...req.body,
            pricePerUnit,
            totalAmount,
            netAmount
        });

        const savedBill = await newBill.save();
        res.status(201).json(savedBill);
    } catch (error: any) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'เลขที่บิลนี้มีอยู่ในระบบแล้ว กรุณาใช้เลขที่อื่น' });
        }
        res.status(400).json({ message: 'Error creating bill', error });
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

import { ShareLink } from './models/ShareLink';
import crypto from 'crypto';

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

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
