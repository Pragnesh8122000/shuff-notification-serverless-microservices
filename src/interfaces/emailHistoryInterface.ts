import { Types, Document } from "mongoose";
import { SEND_STATUS } from "../common/enumConstants.js";

export interface IEmailHistory extends Document {
    templateId: Types.ObjectId;
    userId: Types.ObjectId;
    email: string;
    message: string;
    triggerDateTime: Date | null;
    isSend: typeof SEND_STATUS[keyof typeof SEND_STATUS];
    batchKey?: string;
    mailKey: string;
    createdBy?: Types.ObjectId;
    updatedBy?: Types.ObjectId;
    deletedAt?: Date | null;
}