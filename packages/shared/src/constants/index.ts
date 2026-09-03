export const DEFAULT_PAGE_LIMIT = 20;

export const ROLE = {
  USER: "USER",
  ADMIN: "ADMIN",
} as const;

export const REVIEW_STATUS = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const;

export const VOTE_TYPE = {
  HELPFUL: "HELPFUL",
  NOT_HELPFUL: "NOT_HELPFUL",
} as const;
