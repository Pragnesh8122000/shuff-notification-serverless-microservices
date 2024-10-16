import { Schema, model } from 'mongoose';
import { STATUSES } from '../common/enumConstants.js';
import { IEmailTemplate } from '../interfaces/emailTemplateInterface.js';

const EmailTemplateSchema = new Schema<IEmailTemplate>({
    mailKey: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    isAutomatic: { type: Number, enum: Object.values(STATUSES), default: 0, required: true },
    subject: { type: String, required: true, trim: true },
    bodyContent: { type: String, required: true, trim: true },
    status: { type: Number, enum: Object.values(STATUSES), default: 1, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'Admin', required: false },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'Admin', required: false },
    deletedAt: { type: Date, default: null, required: false },
}, { timestamps: true },
);

EmailTemplateSchema.index({ mailKey: 1 }, { background: true });
EmailTemplateSchema.index({ status: 1 }, { background: true });

const EmailTemplateModel = model<IEmailTemplate>('EmailTemplate', EmailTemplateSchema);

export default EmailTemplateModel;