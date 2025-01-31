import { Injectable } from '@nestjs/common';
import * as Redis from 'ioredis';

@Injectable()
export class RedisService {
  private readonly redisClient: Redis.Redis;

  constructor() {
    this.redisClient = new Redis.default(); // Default connects to localhost:6379
  }

  async set(key: string, value: string, ttl: number) {
    return await this.redisClient.set(key, value, 'EX', ttl); // Ensure the TTL is set correctly
  }

  async get(key: string) {
    return await this.redisClient.get(key);
  }
  async del(key: string): Promise<number> {

    return new Promise((resolve, reject) => {

      this.redisClient.del(key, (err, reply) => {

        if (err) {

          return reject(err);

        }

        resolve(reply ?? 0);
      });

    });

  }

}
