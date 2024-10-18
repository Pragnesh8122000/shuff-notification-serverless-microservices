import { Types, Document } from "mongoose";
import { STATUSES } from "../common/enumConstants.js";

export interface IEmailTemplate extends Document {
    mailKey: string;
    title: string;
    isAutomatic:typeof STATUSES[keyof typeof STATUSES];
    subject: string;
    bodyContent: string;
    status: number;
    createdBy?: Types.ObjectId;
    updatedBy?: Types.ObjectId;
    deletedAt?: Date | null;
}