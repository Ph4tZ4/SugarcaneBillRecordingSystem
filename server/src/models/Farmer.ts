import mongoose, { Schema, Document } from 'mongoose';

export interface IFarmer extends Document {
    name: string;
    licensePlates: string[];
}

const FarmerSchema: Schema = new Schema({
    name: { type: String, required: true },
    licensePlates: { type: [String], default: [] },
}, { timestamps: true });

export const Farmer = mongoose.model<IFarmer>('Farmer', FarmerSchema);
