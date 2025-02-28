import {
  Body,
  Controller,
  Param,
  Post,
  Get,
  UseGuards,
  Request,
  ValidationPipe,
} from '@nestjs/common';
import { GameService } from './game.service';
import { AuthGuard } from 'src/user/auth.guard';
import { CreateGameDto } from './dto/create-game.dto';
import { PrismaService } from '../prisma.service';
import { UserGameDisplayInfoDto } from './dto/game.dto';

@Controller('game')
export class GameController {
  constructor(private readonly gameService: GameService,
  private readonly prisma: PrismaService,
  ) {}

  @UseGuards(AuthGuard)
  @Post('create_game')
  async createNewGame(@Request() req, @Body(ValidationPipe) data: CreateGameDto) {
    const gameId = await this.gameService.createGame(req.id, data.playerColor);
    return {
      'gameId' : gameId, 
    };
  }

  @UseGuards(AuthGuard)
  @Post(':gameId/join')
  async joinGame(@Request() req, @Param('gameId') gameId: string) {
    await this.gameService.joinGame(gameId, req.id);
    return { message: 'Successfully joined game',  };
  }

  @UseGuards(AuthGuard)
  @Get(':gameId/get_players_info_in_game')
  async getPlayersInfoInfoInGame(@Param('gameId') gameId:string){
    return this.gameService.getPlayersInfoInCurrentGame(gameId)
  }

  @Get('/:game_id')
  async getState(@Body() body: any, @Param('game_id') gameId: string) {
    return this.gameService.getGameState(gameId);
  }
}