import mongoose, { Schema, Document } from 'mongoose';

export interface IShareLink extends Document {
    token: string;
    expiresAt: Date | null; // null means forever
    createdAt: Date;
}

const ShareLinkSchema: Schema = new Schema({
    token: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: false }, // If null, never expires
}, { timestamps: true });

export const ShareLink = mongoose.model<IShareLink>('ShareLink', ShareLinkSchema);
