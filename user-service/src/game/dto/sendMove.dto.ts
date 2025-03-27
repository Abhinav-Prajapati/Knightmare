import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class ChessMoveDto {
  @IsString()
  @IsNotEmpty({ message: 'Game ID is required' })
  gameId: string;

  @IsString()
  @IsNotEmpty({ message: 'Player ID is required' })
  playerId: string;

  @IsString()
  @IsOptional()
  UCImove?: string;
}
