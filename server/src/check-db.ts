import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Bill } from './models/Bill';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sugarcane-bills';

async function checkDB() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        const collection = mongoose.connection.collection('bills');

        // 1. List Indexes
        const indexes = await collection.indexes();
        console.log('\n--- Current Indexes ---');
        console.log(JSON.stringify(indexes, null, 2));

        // 2. Check for Duplicates
        const duplicates = await Bill.aggregate([
            {
                $group: {
                    _id: "$billNumber",
                    count: { $sum: 1 },
                    ids: { $push: "$_id" }
                }
            },
            {
                $match: {
                    count: { $gt: 1 }
                }
            }
        ]);

        console.log('\n--- Duplicate Bill Numbers ---');
        if (duplicates.length > 0) {
            console.log(`Found ${duplicates.length} duplicate bill numbers.`);
            console.log(JSON.stringify(duplicates, null, 2));
        } else {
            console.log('No duplicates found.');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\nDisconnected');
    }
}

checkDB();
