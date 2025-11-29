import mongoose, { Schema, Document } from 'mongoose';

export interface ISetting extends Document {
    freshPrice: number;
    burntPrice: number;
    longTopPrice: number;
    quotas: string[];
}

const SettingSchema: Schema = new Schema({
    freshPrice: { type: Number, required: true, default: 1200 },
    burntPrice: { type: Number, required: true, default: 1000 },
    longTopPrice: { type: Number, required: true, default: 1100 },
    quotas: { type: [String], default: [] },
});

export const Setting = mongoose.model<ISetting>('Setting', SettingSchema);
