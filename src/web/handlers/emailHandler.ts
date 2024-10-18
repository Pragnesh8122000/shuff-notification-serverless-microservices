import EmailTemplateModel from "../../models/emailTemplateModel.js";
import { APIGatewayProxyEventV2 } from "aws-lambda";
import middy from "@middy/core";
import bodyParser from '@middy/http-json-body-parser';
import { createEmailTemplate, updateEmailTemplate, getAllEmailTemplates, getEmailTemplateByMailKey, getEmailTemplateById, updateEmailTemplateStatus } from "../service/emailService.js";
console.log(EmailTemplateModel)
export const CreateEmailTemplate = middy(async (event: APIGatewayProxyEventV2) => {
    return createEmailTemplate(event);
}).use(bodyParser());

export const UpdateEmailTemplate = middy(async (event: APIGatewayProxyEventV2) => {
    return updateEmailTemplate(event);
}).use(bodyParser());

export const GetAllEmailTemplates = middy(async (event: APIGatewayProxyEventV2) => {
    return getAllEmailTemplates(event);
}).use(bodyParser());

export const GetEmailTemplateByMailKey = middy(async (event: APIGatewayProxyEventV2) => {
    return getEmailTemplateByMailKey(event);
}).use(bodyParser());

export const GetEmailTemplateById = middy(async (event: APIGatewayProxyEventV2) => {
    return getEmailTemplateById(event);
}).use(bodyParser());

export const UpdateEmailTemplateStatus = middy(async (event: APIGatewayProxyEventV2) => {
    return updateEmailTemplateStatus(event);
}).use(bodyParser());