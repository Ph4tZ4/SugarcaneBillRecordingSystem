import mongoose, { Schema, Document } from 'mongoose';

export interface IPriceConfig extends Document {
    effectiveDate: Date;
    freshPrice: number;
    burntPrice: number;
    longTopPrice: number;
    createdAt: Date;
}

const PriceConfigSchema: Schema = new Schema({
    effectiveDate: { type: Date, required: true, unique: true },
    freshPrice: { type: Number, required: true },
    burntPrice: { type: Number, required: true },
    longTopPrice: { type: Number, required: true },
}, { timestamps: true });

export const PriceConfig = mongoose.model<IPriceConfig>('PriceConfig', PriceConfigSchema);
