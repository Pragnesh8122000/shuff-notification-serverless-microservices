import { Schema, model } from "mongoose";
import { IOtp } from "../interfaces/otpInterface.js";
import { YES_NO_TYPE } from "../common/enumConstants.js";

const otpSchema = new Schema<IOtp>({
    phone: { type: String, required: false, trim: true },
    email: { type: String, required: false, trim: true },
    otp: { type: String, required: true, trim: true },
    expiresAt: { type: Date, required: true },
    isVerified: { type: Number, default:YES_NO_TYPE.NO, required: true, trim: true },
    verificationCount: { type: Number, default: 0, required: true, trim: true }
}, { timestamps: true });

otpSchema.index({ phone: 1 }, { background: true });
otpSchema.index({ email: 1 }, { background: true });
otpSchema.index({ otp: 1 }, { background: true });

const OtpModel = model<IOtp>("Otp", otpSchema);
export default OtpModel;