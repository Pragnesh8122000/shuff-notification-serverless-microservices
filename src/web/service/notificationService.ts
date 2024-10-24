import { isEmail, isMongoObjectId, isPositiveNumber, isValidEnum, newRequiredFieldsValidation } from "../../common/validation.js";
import { IUpdateStatusRequest, LookupConfig, SortConfig, TableInputType } from "../interfaces/commonUtilsInterfaces.js";
import { INotificationData } from "../interfaces/notificationInterface.js";
import { checKFieldValueExist, getSearchFilterCondition, performAggregationQuery, performModelQuery } from "../utility/commonUtils.js";
// import { handleImageUploadForUpdate } from "../utility/notificationUtils.js";
import { formatResponse } from "../utility/response.js";
import { APIGatewayProxyEventV2 } from "aws-lambda";
import HTTP_CODE from "../../common/codeConstants.js";
import { RESPONSE_STATUS, STATUSES } from "../../common/enumConstants.js";
import { handleImageUploadForCreate, handleImageUploadForUpdate } from "../utility/fileUploadUtils.js";
const modelName = "NotificationTemplate";
const folderName = "notification-template"
const TIME_ZONE = process.env.TIME_ZONE || "Asia/Kolkata";

export const addNotification = async (event: APIGatewayProxyEventV2) => {
    try {
        if (!event.body) return formatResponse(RESPONSE_STATUS.ERROR, HTTP_CODE.OK, "EMAIL_AND_PASSWORD_REQUIRED", []);
    
        let input: INotificationData;

        if (typeof event.body === 'string') {
        input = JSON.parse(event.body);
        } else {
        input = event.body;
        }
        const { templateName, headerContent, bodyContent,  bodyImage= "" } = input;
        const requiredFields = ["templateName", "headerContent", "bodyContent", "bodyImage"];
        const adminId =  (event as any).requestContext.authorizer.lambda.id;
        const operation = 'create';
        const uniqueField1 = 'id';
        const uniqueField2 = 'templateName';
        const missingFields = newRequiredFieldsValidation(requiredFields, input);
        if (missingFields.length > 0) {
            return formatResponse(RESPONSE_STATUS.ERROR, HTTP_CODE.OK, "ALL_VALUES_REQUIRED", null, { fields: missingFields });
        }
        let isDataExist = await checKFieldValueExist(modelName, uniqueField2, templateName);
        if (isDataExist) {
            return formatResponse(RESPONSE_STATUS.ERROR, HTTP_CODE.OK, "VALUE_ALREADY_EXIST", [], { field1: "Name" });
        }
        const notificationTemplateData = { templateName, headerContent, bodyContent, createdBy: adminId, bodyImage };
        try {
          await handleImageUploadForCreate(bodyImage, 'bodyImage', notificationTemplateData, false, folderName);
        } catch (error) {
            console.log(error);
            return formatResponse(RESPONSE_STATUS.ERROR, HTTP_CODE.OK, "IMAGE_UPLOAD_FAILED");
        }
        const result = await performModelQuery(modelName, operation, notificationTemplateData);
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

export const getAllNotificationList = async (event: APIGatewayProxyEventV2) => {
    try {
        if (!event.body) return formatResponse(RESPONSE_STATUS.ERROR, HTTP_CODE.OK, "EMAIL_AND_PASSWORD_REQUIRED", []);
    
        let input: TableInputType;

        if (typeof event.body === 'string') {
        input = JSON.parse(event.body);
        } else {
        input = event.body;
        }

        let filterCondition: any = {};
        
        let { page = 1, limit = 10, isSearch = false, search1 = '', search2 = '' } = input;
        page = (isSearch) ? 1 : (typeof page === 'string' ? parseInt(page) : page);
        limit = typeof limit === 'string' ? parseInt(limit) : limit;
        
        if (!isPositiveNumber(page)) {
        return formatResponse(RESPONSE_STATUS.ERROR, HTTP_CODE.OK, "INVALID_FIELD", [], { field1: "Page" });
        }
        if (!isPositiveNumber(limit)) {
        return formatResponse(RESPONSE_STATUS.ERROR, HTTP_CODE.OK, "INVALID_FIELD", [], { field1: "Limit" });
        }
    
      let searchDataFilter = [];

      const searchFields = {
        "search1": { 'field': 'templateName', 'type': 'regex' },
        "search2": { 'field': 'status', 'type': 'equal', 'dataType': 'Number' }
      };
      searchDataFilter = await getSearchFilterCondition(searchFields, { search1, search2 });
      if (searchDataFilter.length > 0) {
        filterCondition.$and = searchDataFilter
      }
        const lookupConfigs: LookupConfig[] = [];
    
        const projectionFields = {
          "_id": 1,
          "templateName": 1,
          "headerContent": 1,
          "bodyContent": 1,
          "bodyImage": 1,
          "status": 1,
        };
    
        const sortConfig: SortConfig = { "_id": -1 };
        const matchCondition = {...filterCondition} ;
        const unwindLookupIndices: number[] = [];
        const pageSize = limit;
        const pageNumber = page;
    
        const { result, totalPages, currentPage, totalCount, remainingCount } = await performAggregationQuery(modelName, lookupConfigs, projectionFields, sortConfig, matchCondition, pageSize, pageNumber, unwindLookupIndices);
        if (totalCount > 0) {
          const S3_URL = process.env.S3_URL as string;
          const modifiedResult = result.map((val: any) => {
            return {
              ...val,
              bodyImage: S3_URL + val.bodyImage
            }
          })
          return formatResponse(RESPONSE_STATUS.SUCCESS, HTTP_CODE.OK, "DATA_FETCHED", { result:modifiedResult, totalPages, currentPage, totalCount, remainingCount });
        } else {
          return formatResponse(RESPONSE_STATUS.SUCCESS, HTTP_CODE.OK, "NO_DATA", { result, totalPages, currentPage, totalCount, remainingCount });
        }
      } catch (error) {
        console.log(error);
        return formatResponse(RESPONSE_STATUS.ERROR, HTTP_CODE.SERVER_ERROR, "SOMETHING_WENT_WRONG");
      }
}

export const viewNotificationById = async (event: APIGatewayProxyEventV2) => {
    try {
        const uniqueField = 'id';
        const operation = 'readAll';
        if (!event.body) return formatResponse(RESPONSE_STATUS.ERROR, HTTP_CODE.OK, "ALL_VALUES_REQUIRED", []);
        let input: { id: string };
        if (typeof event.body === 'string') {
            input = JSON.parse(event.body);
          } else {
            input = event.body;
          }
        const { id } = input;
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
          "templateName": 1,
          "bodyContent": 1,
          "status": 1,
          "bodyImage": 1,
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
          query: { _id: id },
        }
        const finalReponse = await performModelQuery(modelName, operation, data);
        if (finalReponse) {
            finalReponse.result[0].bodyImage = `${process.env.S3_URL}${finalReponse.result[0].bodyImage}`;
            return formatResponse(RESPONSE_STATUS.SUCCESS, HTTP_CODE.OK, "DATA_FETCHED", finalReponse?.result[0]);
        } else {
            return formatResponse(RESPONSE_STATUS.ERROR, HTTP_CODE.OK, "NO_DATA");
        }
    
      } catch (error) {
        console.log(error);
        return formatResponse(RESPONSE_STATUS.ERROR, HTTP_CODE.SERVER_ERROR, "SOMETHING_WENT_WRONG");
      }
}

export const editNotification = async (event: APIGatewayProxyEventV2) => {
    try {
        if (!event.body) return formatResponse(RESPONSE_STATUS.ERROR, HTTP_CODE.OK, "EMAIL_AND_PASSWORD_REQUIRED", []);
    
        let input: INotificationData;

        if (typeof event.body === 'string') {
        input = JSON.parse(event.body);
        } else {
        input = event.body;
        }
        const { id = "", templateName, headerContent, bodyContent,  bodyImage } = input;
        const requiredFields = ["templateName", "headerContent", "bodyContent"];
        const adminId =  (event as any).requestContext.authorizer.lambda.id;
        const uniqueField1 = 'id';
        const uniqueField2 = 'templateName';
        const operation = 'update';
        const missingFields = newRequiredFieldsValidation(requiredFields, input);
        if (missingFields.length > 0) {
            return formatResponse(RESPONSE_STATUS.ERROR, HTTP_CODE.OK, "ALL_VALUES_REQUIRED", null, { fields: missingFields });
        }
        if (!isMongoObjectId(id)) {
            return formatResponse(RESPONSE_STATUS.ERROR, HTTP_CODE.OK, "INVALID_OBJECT_ID");
        }
    
        let isIdExist = await checKFieldValueExist(modelName, uniqueField1, id);
        if (!isIdExist) {
            return formatResponse(RESPONSE_STATUS.ERROR, HTTP_CODE.OK, "INVALID_RECORD", [], { field1: 'Template' });
        }
    
        let isDataExist = await checKFieldValueExist(modelName, uniqueField2, templateName, id);
        if (isDataExist) {
            return formatResponse(RESPONSE_STATUS.ERROR, HTTP_CODE.OK, "VALUE_ALREADY_EXIST", [], { field1: "Name" });
        }
    
        const notificationTemplateData = { templateName, headerContent, bodyContent, updatedBy: adminId };
        const condition = { query: { _id: id } };
        const existingData = await performModelQuery(modelName, "findOne", condition); 
        if (!existingData) {
            return formatResponse(RESPONSE_STATUS.ERROR, HTTP_CODE.OK, "INVALID_RECORD", [], { field1: "Data" });
        }
        try {
          if (bodyImage != "") {
            await handleImageUploadForUpdate(condition, modelName, bodyImage, 'bodyImage', notificationTemplateData, false, folderName, existingData);
          }
        } catch (error) {
            console.log(error);
            return formatResponse(RESPONSE_STATUS.ERROR, HTTP_CODE.OK, "IMAGE_UPLOAD_FAILED");
        }
        const data = { query: { _id: id }, update: notificationTemplateData };
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

export const updateNotificationStatus = async (event: APIGatewayProxyEventV2) => {
  try {
    if (!event.body) return formatResponse(RESPONSE_STATUS.ERROR, HTTP_CODE.OK, "ALL_VALUES_REQUIRED", []);;
    let input: IUpdateStatusRequest;

    if (typeof event.body === 'string') {
      input = JSON.parse(event.body);
    } else {
      input = event.body;
    }
    const { status, id } = input;    
    const updatedBy = (event as any).requestContext.authorizer.lambda.id;
    const operation = "updateStatus";
    const uniqueField = "id";

    if (!id || status == null) {
      return formatResponse(RESPONSE_STATUS.ERROR, HTTP_CODE.OK, "ID_AND_STATUS_REQUIRED");
    }

    if (!isValidEnum(STATUSES, status)) {
      return formatResponse(RESPONSE_STATUS.ERROR, HTTP_CODE.OK, "INVALID_STATUS");
    }

    if (!isMongoObjectId(id)) {
      return formatResponse(RESPONSE_STATUS.ERROR, HTTP_CODE.OK, "INVALID_OBJECT_ID");
    }

    const isIdExist = await checKFieldValueExist(modelName, uniqueField, id);

    if (!isIdExist) {
      return formatResponse(RESPONSE_STATUS.ERROR, HTTP_CODE.OK, "INVALID_RECORD", [], { field1: "Notification" });
    }

    const updateData = {
      query: { id },
      update: { status, updatedBy },
    };

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