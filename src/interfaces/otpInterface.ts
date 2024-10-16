import { Document, Types } from "mongoose";
import { YES_NO_TYPE } from "../common/enumConstants.js";

export interface IOtp extends Document {
    phone?: string;
    email?: string;
    otp: string | null;
    expiresAt: Date | null;
    verificationCount: number;
    isVerified:typeof YES_NO_TYPE [keyof typeof YES_NO_TYPE];
}