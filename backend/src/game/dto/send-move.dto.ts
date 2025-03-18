import { Type } from 'class-transformer';
import { IsString, IsNotEmpty, IsOptional, IsDate, IsNumber } from 'class-validator';

export class ChessMoveDto {
  @IsString()
  @IsNotEmpty({ message: 'Player ID is required' })
  playerId: string;

  @IsString()
  @IsNotEmpty({ message: 'Game ID is required' })
  gameId: string;

  @IsString()
  @IsOptional()
  UCImove?: string;

  @IsString()
  @IsOptional()
  SANmove?: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  timestamp?: Date;

  @IsOptional()
  @IsNumber()
  difficulty?: number;// recive the difficulty level of engine to return move for needed for computer game and should be ignored for multiplayer games 
}