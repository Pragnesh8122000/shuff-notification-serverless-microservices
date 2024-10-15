import NotificationTemplate from "../../models/notificationTemplateModel.js";
import NotificationHistory from "../..//models/notificationHistoryModel.js";
import { APIGatewayProxyEventV2 } from "aws-lambda";
import middy from "@middy/core";
import bodyParser from '@middy/http-json-body-parser';
// import { authenticateBasicAuth, authenticateToken } from "../middlewares/authAdmin.js";
import { addNotification, editNotification, getAllNotificationList, viewNotificationById } from "../service/notificationService.js";
console.log({ NotificationTemplate, NotificationHistory });

export const AddNotification = middy(async (event: APIGatewayProxyEventV2) => {
    return addNotification(event);
}).use(bodyParser());

export const GetAllNotificationList = middy(async (event: APIGatewayProxyEventV2) => {
    return getAllNotificationList(event);
}).use(bodyParser());

export const ViewNotificationById = middy(async (event: APIGatewayProxyEventV2) => {
    return viewNotificationById(event);
}).use(bodyParser());

export const EditNotification = middy(async (event: APIGatewayProxyEventV2) => {
    return editNotification(event);
}).use(bodyParser());