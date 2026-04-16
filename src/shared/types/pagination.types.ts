/**
 * Pagination query parameters interface
 */
export interface PaginationQuery {
  offset?: number;
  limit?: number;
}

/**
 * Pagination metadata interface
 */
export interface PaginationMeta {
  total: number;
  offset: number;
  limit: number;
}

/**
 * Cursor pagination query parameters interface
 */
export interface CursorPaginationQuery {
  cursor?: string;
  limit?: number;
}

/**
 * Cursor pagination metadata interface
 */
export interface CursorPaginationMeta {
  nextCursor: string;
  limit: number;
}

/**
 * Paginated response interface
 */
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    pagination: PaginationMeta;
  };
}

