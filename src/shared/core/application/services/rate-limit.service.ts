import { RateCategory } from "../../domain";

export interface RateLimitService {
  isAllowed(key: string, category: RateCategory): Promise<boolean>;
  getRemainingRequests(key: string, category: RateCategory, includeCurrentRequest?: boolean): Promise<number>;
  getResetTime(key: string, category: RateCategory): Promise<number>;
  reset(key: string, category: RateCategory): Promise<void>;
  resetPrefix(prefix: string): Promise<void>;
}