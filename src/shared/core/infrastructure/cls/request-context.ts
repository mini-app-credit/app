/**
 * Request-scoped context stored in CLS (continuation-local storage).
 * Populated by ClsModule.middleware.setup on every HTTP request.
 * Available anywhere via ClsService without threading through params.
 */
export interface RequestContext {
  /** Authenticated user ID (from JWT, set after passport guard runs) */
  userId: string | null;
  /** Request metadata */
  meta: {
    /** Raw request headers (lowercased keys) */
    headers: Record<string, string | undefined>;
  };
}

/** CLS store keys */
export const CLS_REQUEST_CONTEXT = 'req_ctx' as const;
