import { Document, Types } from 'mongoose';
import { STATUSES } from '../common/enumConstants.js';

export interface INotificationTemplate extends Document {
    templateName: string;
    headerContent: string;
    headerImage?: string;
    bodyContent: string;
    bodyImage?: string;
    redirectTo?: string;
    status: typeof STATUSES[keyof typeof STATUSES];
    createdBy?: Types.ObjectId;
    updatedBy?: Types.ObjectId;
    deletedAt?: Date | null;
}