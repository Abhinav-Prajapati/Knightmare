import { Type } from 'class-transformer';
import { IsString, IsNotEmpty, IsOptional, IsDate } from 'class-validator';

export class ChessMoveDto {
  @IsString()
  @IsNotEmpty({ message: 'Player ID is required' })
  playerId: string;

  @IsString()
  @IsNotEmpty({ message: 'Room ID is required' })
  gameId: string;

  @IsString()
  @IsNotEmpty({ message: 'Source square is required' })
  moveFrom: string;

  @IsString()
  @IsNotEmpty({ message: 'Target square is required' })
  moveTo: string;

  @IsString()
  @IsOptional()
  promotion?: string;
  
  @IsOptional()
  @IsDate()
  @Type(() => Date) 
  timestamp?: Date;
}