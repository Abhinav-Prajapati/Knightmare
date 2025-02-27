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
    // create new game
    const gameId = await this.gameService.createGame(req.id, data.playerColor);

    // Fetch user info and send along with game id
    const user = await this.prisma.user.findFirst(
      {
        where: { id: req.id },
        select: {
          id: true,
          user_name: true,
          name: true,
          country: true,
          profile_image_url: true,
        }
      },
    )

    const userGameDisplayInfoDto = new UserGameDisplayInfoDto()
    userGameDisplayInfoDto.playerId = user.id
    userGameDisplayInfoDto.name = user.name
    userGameDisplayInfoDto.userName = user.user_name
    userGameDisplayInfoDto.country = user.country
    userGameDisplayInfoDto.profileImageUrl = user.profile_image_url

    return {
      'gameId' : gameId, 
      'userInfo' : userGameDisplayInfoDto
    };
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