export const STATUSES = {
    ACTIVE: 1,
    INACTIVE: 0
} as const;

export const ACCOUNT_TYPES = {
    PRIMARY: "primary",
    SECONDARY: "secondary"
} as const;

export const VERIFICATION_TYPES = {
    PASSPORT: "passport",
    DRIVING_LICENCE: "driving_licence"
} as const;

export const APPROVAL_STATUS = {
    PENDING: 0,
    APPROVED: 1,
    REJECTED: 2
} as const;

export const RELATION_TYPES = {
    MOM: "mom",
    DAD: "dad",
    SISTER: "sister",
    BROTHER: "brother",
    OTHERS: "others"
} as const;

export const PLATFORMS = {
    ANDROID: "android",
    IOS: "ios"
} as const;

export const YES_NO_TYPE = {
    YES: 1,
    NO: 0,
} as const;

export const PLAN_TYPES = {
   MONTHLY:"monthly",
   YEARLY:"yearly"
} as const;

export const ENQUIRY_TYPES = {
    PANIC: "panic",
    CONCERN: "concern"
} as const;

export const SEND_STATUS = {
    PENDING: "pending",
    SUCCESS: "success",
    FAILED: "failed"
} as const;

export const RESPONSE_STATUS = {
    SUCCESS: 1,
    ERROR: 0,
    AUTH_FAIL: 4,
    PROXY: 17
  } as const;

export const PROGRESS_STATUS = {
    PENDING: 0,
    IN_PROGRESS: 1,
    RESOLVED: 2,
    REJECTED: 3
} as const;

export const GENDER = {
    MALE: "male",
    FEMALE: "female",
    OTHERS: "others"
} as const;

export const STATE_TYPES = {
    SIGNUP: "signup",
    LOGIN: "login",
    LOGOUT: "logout",
    DELETE_ACCOUNT: "delete_account",
} as const;

