import {
  Body,
  Controller,
  Param,
  Post,
  Get,
  UseGuards,
  Request,
  ValidationPipe,
  InternalServerErrorException,
} from '@nestjs/common';
import { GameService } from './game.service';
import { AuthGuard } from 'src/user/auth.guard';
import { CreateGameDto } from './dto/create-game.dto';
import { PrismaService } from '../prisma.service';
import { ChessEngineRequestDto, ChessEngineResponseDto, CreateEngineGameDto } from './dto/engine.dto';

@Controller('game')
export class GameController {
  constructor(private readonly gameService: GameService,
    private readonly prisma: PrismaService,
  ) { }

  @UseGuards(AuthGuard)
  @Post('create')
  async createNewGame(@Request() req, @Body(ValidationPipe) data: CreateGameDto) {
    const gameId = await this.gameService.createGame(req.id, data.playerColor);
    return {
      'gameId': gameId,
    };
  }

  @UseGuards(AuthGuard)
  @Post(':gameId/join')
  async joinGame(@Request() req, @Param('gameId') gameId: string) {
    await this.gameService.joinGame(gameId, req.id);
    return { message: 'Successfully joined game', };
  }

  @UseGuards(AuthGuard)
  @Get(':gameId/players')
  async getPlayersInfoInfoInGame(@Param('gameId') gameId: string) {
    return this.gameService.getPlayersInfoInCurrentGame(gameId)
  }

  @Get(':gameId/state')
  async getState(@Body() body: any, @Param('gameId') gameId: string) {
    return this.gameService.getGameState(gameId);
  }

  @Post('/engine')
  @UseGuards(AuthGuard)
  async createEngineGame(@Request() req, @Body(ValidationPipe) data: CreateEngineGameDto) {
    const gamdId = await this.gameService.createGame(req.id, data.playAs)
    const msg = await this.gameService.joinGame(gamdId, '8e7c6367-8ba1-410d-81ba-c315dd02b1aa') // this uuid is id of stockfish bot
    return {
      'gameInfo': await this.gameService.getPlayersInfoInCurrentGame(gamdId)
    }
  }

  @Post('/best-move') // only for testing
  async getEngineMove(@Body() gameParameters: ChessEngineRequestDto): Promise<ChessEngineResponseDto> {
    try {
      return await this.gameService.getEngineMove(gameParameters);
    } catch (error) {
      console.error('Error calling chess engine:', error);
      throw new InternalServerErrorException('Failed to get the best move');
    }
  }
}