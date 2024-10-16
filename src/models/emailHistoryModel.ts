import { SEND_STATUS } from '../common/enumConstants.js';
import { Schema, model } from 'mongoose';
import { IEmailHistory } from '../interfaces/emailHistoryInterface.js';

const emailHistorySchema = new Schema<IEmailHistory>({
    templateId: { type: Schema.Types.ObjectId, ref: 'EmailTemplate', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    email: { type: String, required: true },
    message: { type: String, required: true },
    triggerDateTime: { type: Date, required: true, default: null },
    isSend: { type: String, enum: Object.values(SEND_STATUS), default: "pending", required: true },
    batchKey: { type: String, required: false, default: "" },
    mailKey: { type: String, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'Admin', required: false },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'Admin', required: false },
    deletedAt: { type: Date, default: null, required: false },
}, { timestamps: true },
);

//adding indexes on model
emailHistorySchema.index({ templateId: 1 }, { background: true });
emailHistorySchema.index({ userId: 1 }, { background: true });

const emailHistoryModel = model<IEmailHistory>('EmailHistory', emailHistorySchema);
export default emailHistoryModel;