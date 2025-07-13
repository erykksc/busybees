import { Logger } from "@aws-lambda-powertools/logger";
import Redis from "ioredis";

export interface CacheConfig {
  enabled?: boolean;
  defaultTtl?: number; // in seconds
}

export class CacheService {
  private redis?: Redis;
  private logger?: Logger;
  private enabled: boolean;
  private defaultTtl: number;

  constructor(config: CacheConfig & { logger?: Logger }) {
    this.logger = config.logger;
    this.enabled = config.enabled ?? true;
    this.defaultTtl = config.defaultTtl ?? 86400; // 24 hours default

    if (this.enabled) {
      try {
        // Connect to local Redis as defined in docker-compose.yml
        this.redis = new Redis({
          host: "localhost",
          port: 6379,
          maxRetriesPerRequest: 1,
          lazyConnect: true,
        });

        this.redis.on("error", (error) => {
          this.logger?.warn("Redis connection error, disabling cache", {
            error: error.message,
          });
          this.enabled = false;
        });

        this.redis.on("connect", () => {
          this.logger?.info("Redis connected successfully");
        });

        this.logger?.info("Redis cache service initialized", {
          host: "localhost",
          port: 6379,
        });
      } catch (error) {
        this.logger?.warn("Failed to initialize Redis, caching disabled", {
          error,
        });
        this.enabled = false;
      }
    } else {
      this.logger?.info("Redis caching explicitly disabled");
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.enabled || !this.redis) {
      return null;
    }

    try {
      const value = await this.redis.get(key);
      if (value) {
        this.logger?.debug("Cache hit", { key });
        return JSON.parse(value) as T;
      }
      this.logger?.debug("Cache miss", { key });
      return null;
    } catch (error) {
      this.logger?.warn("Cache get error, fallback to null", { key, error });
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<boolean> {
    if (!this.enabled || !this.redis) {
      return false;
    }

    try {
      const ttl = ttlSeconds ?? this.defaultTtl;
      const serialized = JSON.stringify(value);

      if (ttl > 0) {
        await this.redis.setex(key, ttl, serialized);
      } else {
        await this.redis.set(key, serialized);
      }

      this.logger?.debug("Cache set", { key, ttl });
      return true;
    } catch (error) {
      this.logger?.warn("Cache set error", { key, error });
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    if (!this.enabled || !this.redis) {
      return false;
    }

    try {
      const result = await this.redis.del(key);
      this.logger?.debug("Cache delete", { key, deleted: result > 0 });
      return result > 0;
    } catch (error) {
      this.logger?.warn("Cache delete error", { key, error });
      return false;
    }
  }

  async flushPattern(pattern: string): Promise<number> {
    if (!this.enabled || !this.redis) {
      return 0;
    }

    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length === 0) {
        return 0;
      }

      const result = await this.redis.del(...keys);
      this.logger?.debug("Cache pattern flush", {
        pattern,
        deletedCount: result,
      });
      return result;
    } catch (error) {
      this.logger?.warn("Cache pattern flush error", { pattern, error });
      return 0;
    }
  }

  generateFreeBusyKey(
    authSub: string,
    timeMin: string,
    timeMax: string,
  ): string {
    return `freebusy:${authSub}:${timeMin}:${timeMax}`;
  }

  async invalidateUserFreeBusyCache(authSub: string): Promise<number> {
    if (!this.enabled || !this.redis) {
      return 0;
    }

    const pattern = `freebusy:${authSub}:*`;
    
    try {
      const deletedCount = await this.flushPattern(pattern);
      
      this.logger?.info("Invalidated user freebusy cache", {
        authSub,
        pattern,
        deletedCount,
      });
      
      return deletedCount;
    } catch (error) {
      this.logger?.warn("Failed to invalidate user freebusy cache", {
        authSub,
        pattern,
        error,
      });
      return 0;
    }
  }

  async disconnect(): Promise<void> {
    if (this.redis) {
      await this.redis.disconnect();
    }
  }
}
