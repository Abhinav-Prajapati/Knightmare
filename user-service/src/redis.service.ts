import { Injectable, Logger } from '@nestjs/common';
import { Redis } from 'ioredis';
import * as dotenv from 'dotenv';

dotenv.config();

@Injectable()
export class RedisService {
  private redis: Redis;
  private logger = new Logger(RedisService.name);

  constructor() {
    const redisHost = process.env.REDIS_HOST || 'localhost';
    const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);

    try {
      this.redis = new Redis({
        host: redisHost,
        port: redisPort,
      });

      this.redis.on('connect', () => {
        this.logger.log(`✅ Connected to Redis at ${redisHost}:${redisPort}`);
      });

      this.redis.on('error', (err) => {
        this.logger.error(`❌ Redis Connection Error: ${err.message}`);
      });
    } catch (error) {
      this.logger.error(`🚨 Failed to initialize Redis: ${error.message}`);
    }
  }

  async set(key: string, gameData: object, expireTime?: number) {
    try {
      const value = JSON.stringify(gameData);
      if (expireTime) {
        await this.redis.set(key, value, 'EX', expireTime);
      } else {
        await this.redis.set(key, value);
      }
      this.logger.log(`✅ Data set for key: ${key}`);
    } catch (error) {
      this.logger.error(`❌ Failed to set key ${key}: ${error.message}`);
    }
  }

  async get(key: string): Promise<string | null> {
    try {
      const value = await this.redis.get(key);
      if (!value) {
        this.logger.warn(`⚠️ No data found for key: ${key}`);
      }
      return value;
    } catch (error) {
      this.logger.error(`❌ Failed to get key ${key}: ${error.message}`);
      return null;
    }
  }

  async del(key: string) {
    try {
      const result = await this.redis.del(key);
      if (result) {
        this.logger.log(`✅ Deleted key: ${key}`);
      } else {
        this.logger.warn(`⚠️ Key not found: ${key}`);
      }
    } catch (error) {
      this.logger.error(`❌ Failed to delete key ${key}: ${error.message}`);
    }
  }
}
