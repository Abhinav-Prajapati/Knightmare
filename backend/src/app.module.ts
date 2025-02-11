import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserController } from './user/user.controller';
import { UserService } from './user/user.service';
import { UserModule } from './user/user.module';
import { ConfigModule } from '@nestjs/config';
import { GameModule } from './game/game.module';
import { ChatGateway } from './game/game.gateway';
import { AuthGuard } from './user/auth.guard';

@Module({
  imports: [
    UserModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    GameModule,
  ],
  controllers: [AppController, UserController],
  providers: [AppService, UserService, ChatGateway, GameModule, AuthGuard],
})
export class AppModule { }
