import { isMongoObjectId } from '../../common/validation.js';
import { LookupConfig, MatchCondition, Operation, Pagination, PopulateOption, ProjectionFields, QueryData, ReadData, RequestFields, SearchDataFilter, SearchFields, SortConfig, UpdateData, UpdateStatusData } from '../interfaces/commonUtilsInterfaces.js';
import moment from 'moment';
import mongoose, { Model, Document, PipelineStage, FilterQuery, Types } from 'mongoose';
type ExtraCondition = Record<string, any>;

/**
 * Common Aggregation Query handler for CRUD operation
 * @param {string} mainModelName -  Name of models for functions.
 * @param {LookupConfig[]} lookupConfigs -  Configs for lookup.
 * @param {ProjectionFields} projectionFields -  Fields to project.
 * @param {SortConfig} sortConfig -  Configs for sort.
 * @param {MatchCondition | null} matchCondition -  Configs for match.
 * @param {number} pageSize -  Page size.
 * @param {number | '*'} pageNumber -  Page number.
 * @param {number[]} unwindLookupIndices -  Indexes of lookup to unwind.
 * @returns {Promise<any>} - Returns result depending on the operation.
 */
export const performAggregationQuery = async (
  mainModelName: string,
  lookupConfigs: LookupConfig[],
  projectionFields: ProjectionFields,
  sortConfig: SortConfig,
  matchCondition: MatchCondition | null,
  pageSize: number,
  pageNumber: number | '*',
  unwindLookupIndices?: number[]
): Promise<{
  result: any[];
  totalCount: number;
  totalPages?: number;
  currentPage?: number;
  remainingCount?: number;
}> => {
  try {
    const pipeline: PipelineStage[] = [];
    const Model = mongoose.model(mainModelName);
    
    lookupConfigs.forEach((config, index) => {
      pipeline.push({
        $lookup: config
      });
      if (unwindLookupIndices && unwindLookupIndices.includes(index)) {
        pipeline.push({ $unwind: `$${config.as}` });
      }
    });
    if (matchCondition) {
      matchCondition.deletedAt = null;
      pipeline.push({
        $match: matchCondition
      });
    } else {
      pipeline.push({
        $match: { deletedAt: null }
      });
    }
    pipeline.push({
      $project: projectionFields
    });

    pipeline.push({
      $sort: sortConfig
    });

    const totalCountPipeline = [...pipeline];
    const totalCountStage: PipelineStage.Group = { $group: { _id: null, count: { $sum: 1 } } };
    totalCountPipeline.push(totalCountStage);
    const totalCountResult = await Model.aggregate(totalCountPipeline).exec();
    const totalCount = totalCountResult.length > 0 ? totalCountResult[0].count : 0;
    let pagination: Pagination = { totalCount };

    if (pageNumber !== '*') {
      const totalPages = Math.ceil(totalCount / pageSize);
      const skip = (pageNumber - 1) * pageSize;
      const remainingCount = totalCount - (skip + pageSize) >= 0 ? totalCount - (skip + pageSize) : 0;
      
      // Add pagination stages
      pipeline.push({
        $skip: skip
      });
      pipeline.push({
        $limit: pageSize
      });

      Object.assign(pagination, { totalPages, currentPage: pageNumber, remainingCount, totalCount });
    }

    const result = await Model.aggregate(pipeline).exec();
    const hasEntries = result.length > 0;
    const paginationOverrideFields = (!hasEntries && pageNumber !== '*') ? { totalPages: 0, totalCount: 0 } : {};

    return {
      result,
      ...pagination,
      ...paginationOverrideFields
    };

  } catch (error) {
    throw error;
  }
};

/**
 * Common Query handler for CRUD operation
 * @param {string} modelName -  Name of models for functions.
 * @param {Operation} operation -  Operation to perform.
 * @param {QueryData} data - Data to pass for the operation.
 * @returns {Promise<any>} - Returns result depending on the operation.
 */
export const performModelQuery = async (
  modelName: string, 
  operation: Operation, 
  data: QueryData
): Promise<any> => {
  try {
    if (!modelName) {
      throw new Error('Model name is required');
    }
    const Model: Model<Document> = mongoose.model<Document>(modelName);
    
    // Helper function for population
    const populateNested = (queryBuilder: any, populateOptions: PopulateOption[]) => {
      populateOptions.forEach((populateOption) => {
        const { path, select, populate } = populateOption;
        let populateConfig: any = { path, select };

        if (populate) {
          populateConfig.populate = populate.map((populateItem) => ({
            path: populateItem.path,
            select: populateItem.select,
          }));
        }
        queryBuilder = queryBuilder.populate(populateConfig);
      });
      return queryBuilder;
    };

    const operations: Record<Operation, () => Promise<any>> = {
      create: async () => await Model.create(data),
      read: async () => {
        const { page = 1, limit = 10, selectFields = {}, populate = [], sortBy = [], query } = data as ReadData;
        const offset = (page - 1) * limit;
        let queryBuilder = Model.find(data?.query || {}).skip(offset).limit(limit).where({ deletedAt: null });

        if (selectFields && Object.keys(selectFields).length > 0) {
          queryBuilder = queryBuilder.select(selectFields);
        }

        if (populate && populate.length > 0) {
          queryBuilder = populateNested(queryBuilder, populate);
        }

        sortBy.map(sort => {
          const [field, order] = sort.split(':');
          return { [field]: order === 'desc' ? -1 : 1 };
        })

        const [documents, totalCount, remainingCount] = await Promise.all([
          queryBuilder.exec(),
          Model.countDocuments(query).where({ deletedAt: null }),
          Model.countDocuments(query).skip(offset + limit).where({ deletedAt: null }),
        ]);

        const hasEntries = documents.length > 0;
        return {
          result: documents,
          totalPages: hasEntries ? Math.ceil(totalCount / limit) : 0,
          currentPage: page,
          totalCount: hasEntries ? totalCount : 0,
          remainingCount,
        };
      },
      readAll: async () => {
        const { selectFields = {}, populate = [], sortBy = [], query } = data;
        let queryBuilder = Model.find(query).where({ deletedAt: null });

        if (selectFields && Object.keys(selectFields).length > 0) {
          queryBuilder = queryBuilder.select(selectFields);
        }

        if (populate && populate.length > 0) {
          queryBuilder = populateNested(queryBuilder, populate);
        }

        if (sortBy && sortBy.length > 0) {
          queryBuilder = queryBuilder.sort(sortBy.map((sort: string) => sort.split(':')));
        }
        
        const documents = await queryBuilder.exec();
        const totalCount = await Model.countDocuments(query).where({ deletedAt: null });
        return { result: documents, totalCount };
      },
      update: async () => await Model.updateOne((data as UpdateData).query, (data as UpdateData).update).where({ deletedAt: null }),
      delete: async () => await Model.deleteOne(data).where({ deletedAt: null }),
      deleteMany: async () => await Model.deleteMany({ ...data.query, deletedAt: null }),
      updateStatus: async () => await Model.updateOne({ _id: (data as UpdateStatusData).query.id }, { $set: { status: (data as UpdateStatusData).update.status, updatedBy: (data as UpdateStatusData).update.updatedBy } }).where({ deletedAt: null }),
      find: async () => await Model.find().where({ deletedAt: null }),
      findOne: async () => await Model.findOne((data as any).query, (data as any)?.selectFields).where({ deletedAt: null }),
      findById: async () => await Model.findById((data as { id: string }).id).where({ deletedAt: null }).select({ __v: 0 }),
      insertMany: async () => await Model.insertMany(data),
    };

    if (!operations[operation]) {
      throw new Error('Operation not supported');
    }

    return await operations[operation]();
  } catch (error) {
    throw error;
  }
};

export const checKFieldValueExist = async (
  modelName: string,
  field: string,
  value: string | number | Types.ObjectId,
  id?: string | Types.ObjectId,
  extraCondition: ExtraCondition = {}
): Promise<boolean> => {
  try {
    // logger.info("Starting execution of the checKFieldValueExist");
    
    // Get the model from mongoose
    const Model: Model<any> = mongoose.model(modelName);
    
    // Convert 'id' field to '_id' for mongoose
    if (field === 'id') {
      field = '_id';
    }

    // Build the filter query
    let filter: FilterQuery<any> = {
      [field]: typeof value === "string" ? value.trim() : value
    };

    // Merge any extra conditions if they exist
    if (Object.keys(extraCondition).length > 0) {
      Object.assign(filter, extraCondition);
    }

    // Exclude the given ID if provided
    if (id) {
      filter._id = { $ne: new Types.ObjectId(id) };
    }

    // Enable mongoose query debugging if necessary
    if (process.env.ENABLE_QUERY === "YES") {
      mongoose.set('debug', (collectionName: string, method: string, query: any, projectionData: any) => {
        // logger.info(` <<< Query Log >>> \n db.${collectionName}.${method}(${JSON.stringify(query)}) > Projection Part: ${JSON.stringify(projectionData)} `);
      });
    }

    // Count documents matching the filter and excluding soft-deleted records
    const count: number = await Model.countDocuments(filter)
      .where({ deletedAt: null })
      .collation({ locale: 'en', strength: 2 });

    // Return true if any matching documents are found, false otherwise
    return count > 0;
  } catch (err) {
    // logger.error('Error during execution of the checKFieldValueExist \n', err);
    throw err;
  }
};

export const getSearchFilterCondition = async (
  searchFields: SearchFields,
  requestFields: RequestFields
): Promise<SearchDataFilter> => {
  const searchDataFilter: SearchDataFilter = [];

  for (const [key, value] of Object.entries(searchFields)) {
    const searchValue = requestFields[key]; 
    const searchType = value.type && value.type.trim();

    if (searchValue !== undefined && searchValue !== "") {
      switch (searchType) {
        case 'regex':
          if (value.dataType === 'Number') {
            searchDataFilter.push({
              $expr: {
                $regexMatch: {
                  input: { $toString: `$${value.field}` },
                  regex: searchValue.toString()
                }
              }
            });
          } else {
            const RegExp_Search = new RegExp(`${searchValue}`, "i");
            searchDataFilter.push({ [value.field]: { $regex: RegExp_Search } });
          }
          break;
        case 'equal':
          if (value.dataType === 'Number') {
            searchDataFilter.push({ [value.field]: Number(searchValue) });
          } else if (value.dataType === 'EqualORNumber') {
            const fieldValue = JSON.parse(searchValue.toLowerCase());
            const data = value.field.split("|");
            const orCondition = { $or: data.map(field => ({ [field]: fieldValue })) };
            searchDataFilter.push(orCondition);
          } else if (value.dataType === 'Boolean') {
            const fieldValue = JSON.parse(searchValue.toLowerCase());
            searchDataFilter.push({ [value.field]: fieldValue });
          } else if (value.dataType === 'Object') {
            if(isMongoObjectId(searchValue)) {
              const objectId = new mongoose.Types.ObjectId(`${searchValue}`);
              searchDataFilter.push({ [value.field]: objectId });
            }
          } else if (value.dataType === 'String') {
            searchDataFilter.push({ [value.field]: searchValue });
          }
          break;
        case 'objectField':
          if (value.dataType === 'Object') {
            const filter: Record<string, any> = {};
            filter[`${value.field}.${searchValue}`] = 1;
            searchDataFilter.push(filter);
          } else {
            searchDataFilter.push({ [value.field]: searchValue });
          }
          break;
        case 'range':
          const rangeValues = searchValue.rangeFilter.split(' - ');
          if (rangeValues.length === 2) {
            const minValue = Number(rangeValues[0]);
            const maxValue = Number(rangeValues[1]);
            searchDataFilter.push({ [value.field]: { $gte: minValue, $lte: maxValue } });
          }
          break;
        case 'date':
          if (value.dataType === 'range' && value.format) {
            const dateRange = searchValue.split(' - ');
            const dateFormat = value.format;
            const startDate = moment(dateRange[0], 'DD/MM/YYYY').format(dateFormat);
            const endDate = moment(dateRange[1], 'DD/MM/YYYY').format(dateFormat);
            searchDataFilter.push({ [value.field]: { $gte: `${startDate} 00:00:00`, $lte: `${endDate} 23:59:59` } });
          } else if (value.dataType === 'stringRange') {
            const [startDateStr, endDateStr] = searchValue.split(' - ');
            const startDate = moment(startDateStr, 'DD/MM/YYYY').startOf('day').utc().toDate();
            const endDate = moment(endDateStr, 'DD/MM/YYYY').endOf('day').utc().toDate();

            searchDataFilter.push({
              [value.field]: {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
              }
            });
          } else if (value.dataType === 'formattedStringRange') {
            const [startDateStr, endDateStr] = searchValue.split(' - ');
            const startDate = moment(startDateStr, 'DD/MM/YYYY').format("YYYY-MM-DD 00:00:00");
            const endDate = moment(endDateStr, 'DD/MM/YYYY').format("YYYY-MM-DD 23:59:59");
            
            searchDataFilter.push({
              [value.field]: {
                $gte: startDate,
                $lte: endDate
              }
            });
          } else {
            const dateFormat = value.format || 'YYYY-MM-DD';
            const date = moment(searchValue, 'DD/MM/YYYY').utc().format(dateFormat);
            searchDataFilter.push({ [value.field]: { $eq: date } });
          }
          break;
        default:
          console.log('do nothing...');
      }
    }
  }
  
  return searchDataFilter;
};