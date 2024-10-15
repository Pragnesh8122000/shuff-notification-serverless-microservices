import { STATUSES } from "../../common/enumConstants.js";

export interface PopulateOption {
    path: string;
    select?: string;
    populate?: PopulateOption[];
}

export interface ReadData {
    page?: number;
    limit?: number;
    selectFields?: Record<string, any>;
    populate?: PopulateOption[];
    sortBy?: string[];
    query?: Record<string, any>;
}

export interface UpdateData {
    query: Record<string, any>;
    update: Record<string, any>;
}

export interface UpdateStatusData {
    query: { id: string };
    update: { status: string; updatedBy: string };
}

export type QueryData = ReadData | UpdateData | UpdateStatusData | { id: string } | any;

export type Operation =
    | 'create'
    | 'read'
    | 'readAll'
    | 'update'
    | 'delete'
    | 'updateStatus'
    | 'find'
    | 'findOne'
    | 'findById'
    | 'insertMany'
    | 'deleteMany';

export interface LookupConfig {
    from: string;
    localField: string;
    foreignField: string;
    as: string;
}

export interface SortConfig {
    [key: string]: 1 | -1;
}

export interface MatchCondition {
    [key: string]: any;
    deletedAt?: null;
}

export interface ProjectionFields {
    [key: string]: string | number | object;
}

export interface Pagination {
    totalCount: number;
    totalPages?: number;
    currentPage?: number;
    remainingCount?: number;
}

export interface TableInputType {
    page?: string | number;
    limit?: string | number;
    isSearch?: boolean;
    search1?: string;
    search2?: string;
    search3?: string;
    search4?: string;
    search5?: string;
    search6?: string;
}
  
export interface InterfaceForByIdAPis{
    id: string
}

export interface IUpdateStatusRequest {
    status: typeof STATUSES;
    id: string;
  }

export interface SearchField {
    field: string;
    type: string;
    dataType?: string;
    format?: string;
  }
  
export interface SearchFields {
    [key: string]: SearchField;
  }
  
export interface RequestFields {
    [key: string]: any;
  }
  
export type SearchDataFilter = Record<string, any>[];

export interface EncryptedData {
    iv: string;
    value: string;
}