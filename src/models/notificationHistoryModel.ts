import { SEND_STATUS, STATUSES } from '../common/enumConstants.js';
import { Schema, model } from 'mongoose';
import { INotificationHistory } from '../interfaces/notificationHistoryInterface.js';

const NotificationHistorySchema = new Schema<INotificationHistory>({
    templateId: { type: Schema.Types.Mixed, ref: 'NotificationTemplate', required: false, default: "" },
    userId: { type: Schema.Types.Mixed, ref: 'User', required: false, default: "" },
    fcmToken: { type: String, required: true },
    pageName: { type: String, required: false, default: "" },
    title: { type: String, required: true },
    message: { type: String, required: true },
    deviceId: { type: String, required: true },
    platform: { type: String, required: true },
    image: { type: String, required: false },
    batchKey: { type: String, required: true, default: "" },
    triggerDateTime: { type: Date, required: true, default: null },
    isAutomatic: { type: Number, enum: Object.values(STATUSES), default: 0, required: true },
    isSend: { type: String, enum: Object.values(SEND_STATUS), default: "pending", required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'Admin', required: false },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'Admin', required: false },
    deletedAt: { type: Date, default: null, required: false },
}, { timestamps: true },
);

//adding indexes on model
NotificationHistorySchema.index({ templateId: 1 }, { background: true });
NotificationHistorySchema.index({ userId: 1 }, { background: true });
NotificationHistorySchema.index({ fcmToken: 1 }, { background: true });

const NotificationHistoryModel = model<INotificationHistory>('NotificationHistory', NotificationHistorySchema);
export default NotificationHistoryModel;