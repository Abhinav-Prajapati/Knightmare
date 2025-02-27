import {
  Body,
  Controller,
  Param,
  Post,
  Get,
  UseGuards,
  Request,
} from '@nestjs/common';
import { GameService } from './game.service';
import { AuthGuard } from 'src/user/auth.guard';
import { CreateGameDto } from './dto/create-game.dto';

@Controller('game')
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @UseGuards(AuthGuard)
  @Post('create_game')
  async createNewGame(@Request() req, @Body() data: CreateGameDto) {
    const id = await this.gameService.createGame(req.id, data.player_color);
    return { game_id: id };
  }

  @UseGuards(AuthGuard)
  @Post(':gameId/join')
  async joinGame(@Request() req, @Param('gameId') gameId: string) {
    await this.gameService.joinGame(gameId, req.id);
    return { message: 'Successfully joined game' };
  }

  @Get('/:game_id')
  async getState(@Body() body: any, @Param('game_id') gameId: string) {
    return this.gameService.getGameState(gameId);
  }
}