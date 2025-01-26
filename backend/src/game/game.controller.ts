import { Body, Controller, Param, Post } from '@nestjs/common';
import { GameService } from './game.service';

@Controller('game')
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @Post('create_game')
  async createNewGame() {
    return this.gameService.createNewGame();
  }
  @Post('/:game_id')
  async makeMove(@Body() body: any, @Param('game_id') gameId: string) {
    try {
      const result = await this.gameService.makeMove(
        gameId,
        body.move_from,
        body.move_to,
        body.promotion,
      );
      return this.gameService.getGameState(gameId);
    } catch (error) {
      // return any error msg as api resopnse
      throw error;
    }
  }
}
