import { Types, Document } from "mongoose";
import { SEND_STATUS, STATUSES } from "../common/enumConstants.js";

export interface INotificationHistory extends Document {
    templateId?: Types.ObjectId | string;
    userId?: Types.ObjectId | string;
    fcmToken: string;
    pageName?: string;
    title: string;
    message: string;
    deviceId: string;
    platform: string;
    image?: string;
    batchKey?: string;
    triggerDateTime: Date | null;
    isAutomatic: typeof STATUSES[keyof typeof STATUSES];
    isSend: typeof SEND_STATUS[keyof typeof SEND_STATUS];
    createdBy?: Types.ObjectId;
    updatedBy?: Types.ObjectId;
    deletedAt?: Date | null;
}