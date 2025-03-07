import { Type } from 'class-transformer';
import { IsString, IsNotEmpty, IsOptional, IsDate } from 'class-validator';

export class ChessMoveDto {
  @IsString()
  @IsNotEmpty({ message: 'Player ID is required' })
  playerId: string;

  @IsString()
  @IsNotEmpty({ message: 'Game ID is required' })
  gameId: string;

  @IsString()
  @IsNotEmpty({ message: 'Uci move is required' })
  UCImove: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  timestamp?: Date;
}