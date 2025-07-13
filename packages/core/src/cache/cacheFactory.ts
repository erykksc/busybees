import { CacheService } from "./cacheService";
import { Logger } from "@aws-lambda-powertools/logger";

export function createCacheService(logger?: Logger): CacheService {
  return new CacheService({
    enabled: true,
    defaultTtl: 86400, // 24 hours
    logger,
  });
}