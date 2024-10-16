import { APIGatewayProxyEventV2 } from "aws-lambda";
import { formatResponse } from "../utility/response.js";
import { RESPONSE_STATUS } from "../../common/enumConstants.js";
import HTTP_CODE from "../../common/codeConstants.js";
import { performModelQuery } from "../utility/commonUtils.js";
import moment from "moment";
import OtpModel from "src/models/otpModel.js";
import { sendMessage } from "../utility/messageUtils.js";
const OTP_EXPIRY_MINUTES = 2;

export const sendOtpMessage = async (event: APIGatewayProxyEventV2) => {
    try {
        if (!event.body) return formatResponse(RESPONSE_STATUS.ERROR, HTTP_CODE.OK, "ALL_VALUES_REQUIRED", []);
        const input: any = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
        const { phone, otp } = input;

        const otpResult = await performModelQuery("Otp", "findOne", { query: { phone } });

        if (otpResult) {
            otpResult.otp = otp;
            otpResult.expiresAt = moment().add(OTP_EXPIRY_MINUTES, "minutes").toDate();
            otpResult.verificationCount = 0;
            otpResult.isVerified = 0;
            await otpResult.save();
        } else {
            const otpData = {
                phone,
                otp: otp,
                isVerified: 0,
                expiresAt: moment().add(OTP_EXPIRY_MINUTES, "minutes").toDate(),
                verificationCount: 0,
            };
            await OtpModel.create(otpData);
        }

        const isSend = await sendMessage(phone, otp);
        if (isSend) {
            return formatResponse(RESPONSE_STATUS.SUCCESS, HTTP_CODE.OK, "OTP_SENT", []);
        }
        return formatResponse(RESPONSE_STATUS.ERROR, HTTP_CODE.OK, "SOMETHING_WENT_WRONG", []);
    } catch (error) {
        console.log(error);
        return formatResponse(RESPONSE_STATUS.ERROR, HTTP_CODE.OK, "SOMETHING_WENT_WRONG", []);
    }
}