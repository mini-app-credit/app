import { RateCategory, RATE_LIMIT_CATEGORY } from "../../domain";

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
}

// Standard configs as per ADR-011
export const configs: Record<RateCategory, RateLimitConfig> = {
  [RATE_LIMIT_CATEGORY.PUBLIC]: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
  },
  [RATE_LIMIT_CATEGORY.AUTH_SENSITIVE]: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
  },
  [RATE_LIMIT_CATEGORY.AUTHENTICATED]: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 300,
  },
  [RATE_LIMIT_CATEGORY.MCP_USER]: {
    windowMs: Number(process.env.MCP_RATE_LIMIT_USER_WINDOW_MS) || 60 * 1000,
    maxRequests: Number(process.env.MCP_RATE_LIMIT_USER_MAX_REQUESTS) || 200,
  },
  [RATE_LIMIT_CATEGORY.MCP_TOOL]: {
    windowMs: Number(process.env.MCP_RATE_LIMIT_TOOL_WINDOW_MS) || 60 * 1000,
    maxRequests: Number(process.env.MCP_RATE_LIMIT_TOOL_MAX_REQUESTS) || 50,
  },
};
