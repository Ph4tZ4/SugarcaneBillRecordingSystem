import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Bill } from './models/Bill';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sugarcane-bills';

async function fixDB() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // 1. Find Duplicates
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

        console.log(`Found ${duplicates.length} duplicate groups.`);

        // 2. Remove Duplicates (Keep the last one)
        for (const group of duplicates) {
            console.log(`Processing duplicate billNumber: ${group._id}`);
            // Sort IDs to keep the latest one (assuming ObjectId is roughly chronological, or we could fetch dates)
            // We'll just keep the last one in the array which usually corresponds to insertion order in aggregation
            const idsToRemove = group.ids.slice(0, group.ids.length - 1);

            console.log(`Removing ${idsToRemove.length} duplicate entries...`);
            await Bill.deleteMany({ _id: { $in: idsToRemove } });
        }

        console.log('Duplicates removed.');

        // 3. Force Index Creation
        console.log('Syncing indexes...');
        await Bill.syncIndexes();
        console.log('Indexes synced successfully.');

        // 4. Verify
        const collection = mongoose.connection.collection('bills');
        const indexes = await collection.indexes();
        console.log('\n--- Updated Indexes ---');
        console.log(JSON.stringify(indexes, null, 2));

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\nDisconnected');
    }
}

fixDB();
