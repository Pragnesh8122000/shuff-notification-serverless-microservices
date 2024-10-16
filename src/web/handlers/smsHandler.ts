import { APIGatewayProxyEventV2 } from "aws-lambda";
import middy from "@middy/core";
import bodyParser from '@middy/http-json-body-parser';
import { sendOtpMessage } from "../service/smsService.js";
import OtpModel from "src/models/otpModel.js";
console.log(OtpModel)

export const SendOtpMessage = middy(async (event: APIGatewayProxyEventV2) => {
    return sendOtpMessage(event);
}).use(bodyParser());