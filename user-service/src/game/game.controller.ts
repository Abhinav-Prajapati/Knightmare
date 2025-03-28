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
import { CreateEngineGameDto } from './dto/engine.dto';
import { ChessMoveDto } from './dto/sendMove.dto';
import { GameState } from './types/chessService';

@Controller('game')
export class GameController {
  constructor(
    private readonly gameService: GameService,
    private readonly prisma: PrismaService,
  ) {}

  @UseGuards(AuthGuard)
  @Post('create')
  async createNewGame(
    @Request() req,
    @Body(ValidationPipe) data: CreateGameDto,
  ) {
    const gameId = await this.gameService.createGame(req.id, data.playerColor);
    return {
      gameId: gameId,
    };
  }

  @UseGuards(AuthGuard)
  @Post(':gameId/join')
  async joinGame(@Request() req, @Param('gameId') gameId: string) {
    await this.gameService.joinGame(gameId, req.id);
    return { message: 'Successfully joined game' };
  }

  @UseGuards(AuthGuard)
  @Get(':gameId/players')
  async getPlayersInfoInfoInGame(@Param('gameId') gameId: string) {
    return this.gameService.getPlayersInfoInCurrentGame(gameId);
  }

  @Get(':gameId/state')
  async getState(@Body() body: any, @Param('gameId') gameId: string) {
    return this.gameService.getGameState(gameId);
  }

  @Post('/engine')
  @UseGuards(AuthGuard)
  async createEngineGame(
    @Request() req,
    @Body(ValidationPipe) data: CreateEngineGameDto,
  ) {
    const gamdId = await this.gameService.createGame(req.id, data.playAs);
    return {
      gameId: gamdId,
    };
  }

  @Post('move') // route made only for testing
  async makeMove(@Body() chessMoveDto: ChessMoveDto): Promise<GameState> {
    // Make player move
    const playerMoveResult =
      await this.gameService.makePlayerMove(chessMoveDto);

    // If game is not over, make computer move
    if (!playerMoveResult.gameOverStatus?.isGameOver) {
      return this.gameService.makeComputerMove(chessMoveDto.gameId);
    }
    return playerMoveResult;
  }
}
