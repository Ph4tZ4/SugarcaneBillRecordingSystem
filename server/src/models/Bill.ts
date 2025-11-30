import mongoose, { Schema, Document } from 'mongoose';

export interface IBill extends Document {
    billNumber: string;
    ownerName: string;
    date: Date;
    sugarcaneType: number; // 1 = Fresh, 2 = Burnt
    weight: number;
    fuelCost?: number;
    pricePerUnit: number;
    totalAmount: number;
    netAmount: number;
    quotaNumber?: string;
    licensePlate?: string;
}

const BillSchema: Schema = new Schema({
    billNumber: { type: String, required: true, unique: true },
    quotaNumber: { type: String, required: false },
    ownerName: { type: String, required: true },
    licensePlate: { type: String, required: false },
    date: { type: Date, required: true },
    sugarcaneType: { type: Number, required: true, enum: [1, 2, 3] },
    weight: { type: Number, required: true },
    fuelCost: { type: Number, required: false, default: 0 },
    pricePerUnit: { type: Number, required: true },
    totalAmount: { type: Number, required: true },
    netAmount: { type: Number, required: true },
}, { timestamps: true });

export const Bill = mongoose.model<IBill>('Bill', BillSchema);
