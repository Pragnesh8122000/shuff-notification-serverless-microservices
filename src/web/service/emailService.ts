import { APIGatewayProxyEventV2 } from "aws-lambda";
import { formatResponse } from "../utility/response.js";
import { RESPONSE_STATUS, STATUSES } from "src/common/enumConstants.js";
import HTTP_CODE from "src/common/codeConstants.js";
import { isEmail, isMongoObjectId, isPositiveNumber, isValidEnum, newRequiredFieldsValidation } from "src/common/validation.js";
import { checKFieldValueExist, getSearchFilterCondition, performAggregationQuery, performModelQuery } from "../utility/commonUtils.js";
import { generateUniqueBatchKey } from "src/common/helper.js";
import { emailTemplateInterface } from "../interfaces/emailInterface.js";
import { SortConfig } from "../interfaces/commonUtilsInterfaces.js";
const modelName = 'EmailTemplate';
const TIME_ZONE = process.env.TIME_ZONE || "Asia/Kolkata";

export const createEmailTemplate = async (event: APIGatewayProxyEventV2) => {
    try {
        if (!event.body) return formatResponse(RESPONSE_STATUS.ERROR, HTTP_CODE.OK, "ALL_VALUES_REQUIRED", []);
        const input: emailTemplateInterface = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;

        const { title, subject, bodyContent } = input;
        const requiredFields = ["title", "subject", "bodyContent"]
        const adminId = (event as any).requestContext.authorizer.lambda.id;
        const operation = 'create';
        const uniqueField = 'subject'

        const missingFields = newRequiredFieldsValidation(requiredFields, input);
        if (missingFields.length > 0) {
            return formatResponse(RESPONSE_STATUS.ERROR, HTTP_CODE.OK, "ALL_VALUES_REQUIRED", null, { fields: missingFields });
        }
        const isDataExist = await checKFieldValueExist(modelName, uniqueField, subject);
        if (isDataExist) {
            return formatResponse(RESPONSE_STATUS.ERROR, HTTP_CODE.OK, "VALUE_ALREADY_EXIST", [], { field1: "Subject" });
        }

        const emailTemplateData = {
            mailKey: generateUniqueBatchKey(), title, subject, bodyContent,
            createdBy: adminId, isAutomatic: 0
        };
        const result = await performModelQuery(modelName, operation, emailTemplateData);
        if (result) {
            return formatResponse(RESPONSE_STATUS.SUCCESS, HTTP_CODE.OK, "DATA_ADDED");
        } else {
            return formatResponse(RESPONSE_STATUS.ERROR, HTTP_CODE.OK, "DATA_ADD_ERROR");
        }
    } catch (error) {
        console.log(error);
        return formatResponse(RESPONSE_STATUS.ERROR, HTTP_CODE.SERVER_ERROR, "SOMETHING_WENT_WRONG");
    }
}

export const updateEmailTemplate = async (event: APIGatewayProxyEventV2) => {
    try {
        if (!event.body) return formatResponse(RESPONSE_STATUS.ERROR, HTTP_CODE.OK, "ALL_VALUES_REQUIRED", []);
        const input: emailTemplateInterface = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
        const { id, title, subject, bodyContent, isAutomatic } = input;
        const requiredFields = ["id", "isAutomatic"];
        const adminId = (event as any).requestContext.authorizer.lambda.id;
        const uniqueField1 = 'subject';
        const uniqueField2 = 'id';
        const operation = "update";

        if (isValidEnum(STATUSES, isAutomatic)) {
            return formatResponse(RESPONSE_STATUS.ERROR, HTTP_CODE.OK, "INVALID_FIELD", [], { field1: "isAutomatic" });
        }

        if (isAutomatic == 0) {
            requiredFields.push("subject", "bodyContent", "title", "marketingCategoryId");
        }

        const missingFields = newRequiredFieldsValidation(requiredFields, input);
        if (missingFields.length > 0) {
            return formatResponse(RESPONSE_STATUS.ERROR, HTTP_CODE.OK, "ALL_VALUES_REQUIRED", null, { fields: missingFields });
        }

        if (isAutomatic === 1 && (subject !== undefined || bodyContent !== undefined)) {
            return formatResponse(RESPONSE_STATUS.ERROR, HTTP_CODE.OK, "INVALID_FIELD", [], { field1: "subject or bodyContent" });
        }

        let isIdExist = await checKFieldValueExist(modelName, uniqueField2, id as string);
        if (!isIdExist) {
            return formatResponse(RESPONSE_STATUS.ERROR, HTTP_CODE.OK, "INVALID_RECORD", [], { field1: 'Template' });
        }
        const isDataExist = await checKFieldValueExist(modelName, uniqueField1, subject, id);
        if (isDataExist) {
            return formatResponse(RESPONSE_STATUS.ERROR, HTTP_CODE.OK, "VALUE_ALREADY_EXIST", [], { field1: "Subject" });
        }

        const emailTemplateData: any = {
            updatedBy: adminId
        };

        if (isAutomatic == 0) {
            emailTemplateData.subject = subject;
            emailTemplateData.bodyContent = bodyContent;
            emailTemplateData.title = title;
        };

        const data = { query: { _id: id }, update: emailTemplateData };
        const result = await performModelQuery(modelName, operation, data);

        if (result.modifiedCount > 0) {
            return formatResponse(RESPONSE_STATUS.SUCCESS, HTTP_CODE.OK, "DATA_UPDATED");
        } else {
            return formatResponse(RESPONSE_STATUS.ERROR, HTTP_CODE.OK, "DATA_UPDATE_ERROR");
        }

    } catch (error) {
        console.log(error);
        return formatResponse(RESPONSE_STATUS.ERROR, HTTP_CODE.SERVER_ERROR, "SOMETHING_WENT_WRONG");
    }

}

export const getAllEmailTemplates = async (event: APIGatewayProxyEventV2) => {
    try {
        if (!event.body) return formatResponse(RESPONSE_STATUS.ERROR, HTTP_CODE.OK, "ALL_VALUES_REQUIRED", []);
        let input: emailTemplateInterface = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
        let { page = "*", limit = 10, isSearch = false, search1 = '', search2 = '', search3 = '', type = 'manual' } = input;
        let filterCondition: any = {};
        if (page != "*") {
            page = typeof page === 'string' ? parseInt(page) : page;
            limit = typeof limit === 'string' ? parseInt(limit) : limit;
            page = (isSearch) ? 1 : page;
            if (!isPositiveNumber(page)) {
                return formatResponse(RESPONSE_STATUS.ERROR, HTTP_CODE.OK, "INVALID_FIELD", [], { field1: "Page" });
            }
            if (!isPositiveNumber(limit)) {
                return formatResponse(RESPONSE_STATUS.ERROR, HTTP_CODE.OK, "INVALID_FIELD", [], { field1: "Limit" });
            }
        } else {
            filterCondition = { status: 1 };
        }

        let searchDataFilter = [];
        const searchFields = {
            "search1": { 'field': 'title', 'type': 'regex' },
            "search2": { 'field': 'marketingCategoryId', 'type': 'equal', 'dataType': 'Object' },
            "search3": { 'field': 'status', 'type': 'equal', 'dataType': 'Number' }
        };
        searchDataFilter = await getSearchFilterCondition(searchFields, { search1, search2, search3 });
        if (searchDataFilter.length > 0) {
            filterCondition.$and = searchDataFilter
        }

        if (type == 'automatic') {
            filterCondition.isAutomatic = 1;
        } else {
            filterCondition.isAutomatic = 0;
        }

        const lookupConfigs:any = [];

        const projectionFields = {
            "_id": 1,
            "mailKey": 1,
            "title": 1,
            "subject": 1,
            "status": 1,
            "isAutomatic": 1
        };

        const sortConfig = { "_id": -1 };
        const matchCondition = { ...filterCondition };
        const unwindLookupIndices: any = [];
        const pageSize = limit;
        const pageNumber = page;

        const { result, totalPages, currentPage, totalCount, remainingCount } = await performAggregationQuery(modelName, lookupConfigs, projectionFields, sortConfig as SortConfig, matchCondition, pageSize, pageNumber, unwindLookupIndices);
        if (totalCount > 0) {
            return formatResponse(RESPONSE_STATUS.SUCCESS, HTTP_CODE.OK, "DATA_FETCHED", { result, totalPages, currentPage, totalCount, remainingCount });
        } else {
            return formatResponse(RESPONSE_STATUS.SUCCESS, HTTP_CODE.OK, "NO_DATA", { result, totalPages, currentPage, totalCount, remainingCount });
        }
    } catch (error) {
        console.log(error);
        return formatResponse(RESPONSE_STATUS.ERROR, HTTP_CODE.SERVER_ERROR, "SOMETHING_WENT_WRONG");
    }
}

export const getEmailTemplateById = async (event: APIGatewayProxyEventV2) => {
    try {
        if (!event.body) return formatResponse(RESPONSE_STATUS.ERROR, HTTP_CODE.OK, "ALL_VALUES_REQUIRED", []);
        let input: emailTemplateInterface = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
        const { id } = input;
        const uniqueField = 'id';
        const operation = 'readAll';
        if (!id) {
            return formatResponse(RESPONSE_STATUS.ERROR, HTTP_CODE.OK, "ID_REQUIRED");
        }
        if (!isMongoObjectId(id)) {
            return formatResponse(RESPONSE_STATUS.ERROR, HTTP_CODE.OK, "INVALID_OBJECT_ID");
        }
        let isIdExist = await checKFieldValueExist(modelName, uniqueField, id);
        if (!isIdExist) {
            return formatResponse(RESPONSE_STATUS.ERROR, HTTP_CODE.OK, "INVALID_RECORD", [], { field1: 'Template' });
        }
        const selectFields = {
            "_id": 1,
            "mailKey": 1,
            "title": 1,
            "subject": 1,
            "bodyContent": 1,
            "isAutomatic": 1,
            "status": 1,
            "createdAt": {
                $dateToString: {
                    format: "%Y-%m-%dT%H:%M:%S.%LZ",
                    date: "$createdAt",
                    timezone: TIME_ZONE
                }
            }
        }
        const data = {
            selectFields,
            query: { _id: id }
        }
        const finalReponse = await performModelQuery(modelName, operation, data);
        if (finalReponse) {
            return formatResponse(RESPONSE_STATUS.SUCCESS, HTTP_CODE.OK, "DATA_FETCHED", finalReponse?.result[0]);
        } else {
            return formatResponse(RESPONSE_STATUS.ERROR, HTTP_CODE.OK, "NO_DATA");
        }
    } catch (error) {
        console.log(error);
        return formatResponse(RESPONSE_STATUS.ERROR, HTTP_CODE.SERVER_ERROR, "SOMETHING_WENT_WRONG");
    }
}

export const updateEmailTemplateStatus = async (event: APIGatewayProxyEventV2) => {
    try {
        if (!event.body) return formatResponse(RESPONSE_STATUS.ERROR, HTTP_CODE.OK, "ALL_VALUES_REQUIRED", []);
        let input: emailTemplateInterface = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
        const { status, id } = input;
        const adminId = (event as any).requestContext.authorizer.lambda.id;
        const uniqueField = 'id';
        const operation = 'updateStatus';

        if (!id || status == null) {
            return formatResponse(RESPONSE_STATUS.ERROR, HTTP_CODE.OK, "ID_AND_STATUS_REQUIRED");
        }

        if (!isValidEnum(STATUSES, status)) {
            return formatResponse(RESPONSE_STATUS.ERROR, HTTP_CODE.OK, "INVALID_STATUS_TYPE");
        }

        if (!isMongoObjectId(id)) {
            return formatResponse(RESPONSE_STATUS.ERROR, HTTP_CODE.OK, "INVALID_OBJECT_ID");
        }

        let isIdExist = await checKFieldValueExist(modelName, uniqueField, id);

        if (!isIdExist) {
            return formatResponse(RESPONSE_STATUS.ERROR, HTTP_CODE.OK, "INVALID_RECORD", [], { field1: 'Template' });
        }

        const updateData = { query: { id }, update: { status, updatedBy: adminId } };
        const result = await performModelQuery(modelName, operation, updateData);
        if (result.modifiedCount > 0) {
            return formatResponse(RESPONSE_STATUS.SUCCESS, HTTP_CODE.OK, "STATUS_UPDATED");
        } else {
            return formatResponse(RESPONSE_STATUS.ERROR, HTTP_CODE.OK, "DATA_UPDATE_ERROR");
        }
    } catch (error) {
        console.log(error);
        return formatResponse(RESPONSE_STATUS.ERROR, HTTP_CODE.SERVER_ERROR, "SOMETHING_WENT_WRONG");
    }
}

export const getEmailTemplateByMailKey = async (event: APIGatewayProxyEventV2) => {
    try {
        if (!event.body) return formatResponse(RESPONSE_STATUS.ERROR, HTTP_CODE.OK, "ALL_VALUES_REQUIRED", []);
        let input: emailTemplateInterface = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
        const { mailKey } = input;
        const uniqueField = 'mailKey';
        const operation = 'readAll';
        if (!mailKey) {
            return formatResponse(RESPONSE_STATUS.ERROR, HTTP_CODE.OK, "MAIL_KEY_REQUIRED");
        }
        let isMailKeyExist = await checKFieldValueExist(modelName, uniqueField, mailKey);
        if (!isMailKeyExist) {
            return formatResponse(RESPONSE_STATUS.ERROR, HTTP_CODE.OK, "INVALID_RECORD", [], { field1: 'Template Key' });
        }
        const selectFields = {
            "_id": 1,
            "mailKey": 1,
            "title": 1,
            "subject": 1,
            "bodyContent": 1,
            "marketingCategoryId": 1,
            "status": 1,
            "createdAt": {
                $dateToString: {
                    format: "%Y-%m-%dT%H:%M:%S.%LZ",
                    date: "$createdAt",
                    timezone: TIME_ZONE
                }
            }
        }
        const data = {
            selectFields,
            query: { mailKey: mailKey }
        }
        const finalReponse = await performModelQuery(modelName, operation, data);
        if (finalReponse) {
            return formatResponse(RESPONSE_STATUS.SUCCESS, HTTP_CODE.OK, "DATA_FETCHED", finalReponse?.result[0]);
        } else {
            return formatResponse(RESPONSE_STATUS.ERROR, HTTP_CODE.OK, "NO_DATA");
        }

    } catch (error) {
        console.log(error);
        return formatResponse(RESPONSE_STATUS.ERROR, HTTP_CODE.SERVER_ERROR, "SOMETHING_WENT_WRONG");
    }
}