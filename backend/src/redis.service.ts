import { Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export class RedisService {
  private redis: Redis;

  constructor() {
    this.redis = new Redis({
      host: 'localhost', // Change if using a different Redis host
      port: 6379,
    });
  }

  async set(key: string, gameData: object, expireTime?: number) {
    const value = JSON.stringify(gameData);
    if (expireTime) {
      await this.redis.set(key, value, 'EX', expireTime);
    } else {
      await this.redis.set(key, value);
    }
  }

  async get(key: string): Promise<string | null> {
    return this.redis.get(key);
  }

  async del(key: string) {
    return this.redis.del(key);
  }
}
