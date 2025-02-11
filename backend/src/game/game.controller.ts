import { Body, Controller, Param, Post, Put, Get, UseGuards, Request } from '@nestjs/common';
import { GameService } from './game.service';
import { AuthGuard } from 'src/user/auth.guard';

@Controller('game')
export class GameController {
  constructor(private readonly gameService: GameService) { }

  @UseGuards(AuthGuard)
  @Post('create_game')
  async createNewGame(@Request() req) {
    const id = await this.gameService.createGame(req.id);
    return { game_id: id }
  }

  //@UseGuards(AuthGuard)
  @Post(':gameId/join')
  async joinGame(@Request() req, @Param('gameId') gameId: string) {
    await this.gameService.joinGame(gameId, req.user.id);
    return { message: 'Successfully joined game' };
  }

  @Get('/:game_id')
  async getState(@Body() body: any, @Param('game_id') gameId: string) {
    return this.gameService.getGameState(gameId);
  }

  @Put('move/:game_id')
  async makeMove(@Body() body: any, @Param('game_id') gameId: string) {
    return this.gameService.makeMove(
      gameId,
      body.move_from,
      body.move_to,
      body.promotion,
    );
  }
}
