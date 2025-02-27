import { GameStatus, GameOutcome, WinMethod } from '@prisma/client';
import { 
  IsString, IsOptional, IsEnum, IsArray, IsBoolean, ValidateNested, IsDate 
} from 'class-validator';
import { Type } from 'class-transformer';

export class GameOverStatusDto {
  @IsBoolean()
  isGameOver: boolean;

  @IsBoolean()
  isInCheck: boolean;

  @IsBoolean()
  isInCheckmate: boolean;

  @IsBoolean()
  isInStalemate: boolean;

  @IsBoolean()
  isInDraw: boolean;
}

export class GameStateDto {
  @IsString()
  gameId: string;

  @IsString()
  fen: string;

  @IsString()
  @IsOptional()
  pgn?: string;

  @IsEnum(['w', 'b'])
  turn: 'w' | 'b';

  @IsArray()
  @IsString({ each: true })
  moveHistory: string[];

  @IsString()
  @IsOptional()
  whitePlayerId: string | null;

  @IsString()
  @IsOptional()
  blackPlayerId: string | null;

  @IsEnum(GameStatus)
  status: GameStatus;

  @IsOptional()
  @ValidateNested()
  @Type(() => GameOverStatusDto) 
  gameOverStatus?: GameOverStatusDto;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  legalMoves?: string[];
}

export class CompletedGameStateDto extends GameStateDto {
  @IsEnum(GameOutcome)
  outcome: GameOutcome;

  @IsEnum(WinMethod)
  winMethod: WinMethod;

  @IsDate()
  endTime: Date;

  @IsString()
  finalFen: string;
}
