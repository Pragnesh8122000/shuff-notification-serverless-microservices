import { STATUSES } from "src/common/enumConstants.js";

export interface emailTemplateInterface {
    id?: string;
    mailKey: string;
    title: string;
    subject: string;
    bodyContent: string;
    isAutomatic: typeof STATUSES[keyof typeof STATUSES];
    status: typeof STATUSES[keyof typeof STATUSES];
    isSearch?: boolean;
    search1?: string;
    search2?: string;
    search3?: string;
    search4?: string;
    search5?: string;
    search6?: string;
    page?: number;
    limit?: number;
    type?:'manual' | 'automatic';
}