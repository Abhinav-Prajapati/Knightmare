import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
    console.log('✅ Connected to the database.');

    // Check if User and Game tables exist
    const tables = await this.$queryRaw<{ table_name: string }[]>`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name IN ('User', 'Game')
    `;

    if (tables.length < 3) {
      console.log('🚀 Tables missing. Running migration...');
      this.runMigration();
    }

    // Seed that data base
    await this.seedDatabase();
  }

  private runMigration() {
    try {
      console.log('📌 Running Prisma migrations...');
      execSync('yarn prisma migrate deploy', { stdio: 'inherit' });
    } catch (error) {
      console.error('❌ Migration failed:', error);
    }
  }

  private async seedDatabase() {
    console.log('🌱 Checking for initial data...');

    const existingUser = await this.user.findFirst();
    if (!existingUser) {
      await this.user.create({
        data: {
          user_name: 'siddhima',
          name: 'Siddhima',
          email: 'siddhima@example.com',
          password_hash: '11111111',
          role: 'player',
        },
      });
      console.log('✅ Seeded player 1.');

      await this.user.create({
        data: {
          user_name: 'abhinav',
          name: 'abhinav',
          email: 'abhinav@example.com',
          password_hash: '11111111',
          role: 'player',
        },
      });
      console.log('✅ Seeded player 2.');

      await this.user.create({
        data: {
          id: '8e7c6367-8ba1-410d-81ba-c315dd02b1aa',
          user_name: 'stockfish',
          name: 'Stockfish',
          email: 'stockfish@example.com',
          password_hash: '11111111',
          role: 'bot',
        },
      });
      console.log('✅ Seeded stockfish 17.');
    } else {
      console.log('⚡ Database already has data, skipping seeding.');
    }
  }
}
