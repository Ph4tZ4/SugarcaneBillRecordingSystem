import mongoose, { Schema, Document } from 'mongoose';

export interface IActivityLog extends Document {
    userId: mongoose.Types.ObjectId;
    username: string;
    role: string;
    action: string;
    details?: string;
    timestamp: Date;
}

const ActivityLogSchema: Schema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    username: { type: String, required: true },
    role: { type: String, required: true },
    action: { type: String, required: true },
    details: { type: String },
    timestamp: { type: Date, default: Date.now },
});

export const ActivityLog = mongoose.model<IActivityLog>('ActivityLog', ActivityLogSchema);
