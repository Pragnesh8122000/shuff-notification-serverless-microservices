import { Schema, model } from 'mongoose';
import { STATUSES } from '../common/enumConstants.js';
import { INotificationTemplate } from '../interfaces/notificationTemplateInterface.js';

const NotificationTemplateSchema = new Schema<INotificationTemplate>({
    templateName: { type: String, required: true, trim: true },
    headerContent: { type: String, required: true, trim: true },
    headerImage: { type: String, required: false },
    bodyContent: { type: String, required: true, trim: true },
    bodyImage: { type: String, required: false },
    redirectTo: { type: String, required: false, trim: true },
    status: { type: Number, enum: Object.values(STATUSES), default: STATUSES.ACTIVE, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'Admin', required: false },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'Admin', required: false },
    deletedAt: { type: Date, default: null, required: false },
}, { timestamps: true });

NotificationTemplateSchema.index({ templateName: 1 }, { background: true });
NotificationTemplateSchema.index({ status: 1 }, { background: true });

const NotificationTemplateModel = model<INotificationTemplate>('NotificationTemplate', NotificationTemplateSchema);

export default NotificationTemplateModel;