import { Module } from '@nestjs/common';
import { GameController } from './game.controller';
import { GameService } from './game.service';
import { RedisService } from 'src/redis.service';
import { AuthGuard } from 'src/user/auth.guard';
import { PrismaService } from 'src/prisma.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  controllers: [GameController],
  providers: [GameService, RedisService, AuthGuard, PrismaService],
  exports: [GameService]
})
export class GameModule { }
