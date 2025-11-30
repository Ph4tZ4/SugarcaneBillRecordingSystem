import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
    username: string;
    password?: string;
    role: 'admin' | 'root';
}

const UserSchema: Schema = new Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'root'], required: true },
}, { timestamps: true });

export const User = mongoose.model<IUser>('User', UserSchema);
