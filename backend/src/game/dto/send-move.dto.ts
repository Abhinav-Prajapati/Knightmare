import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class MoveDto {
  @IsString()
  @IsNotEmpty({ message: 'Player ID is required' })
  player_id: string;

  @IsString()
  @IsNotEmpty({ message: 'Room ID is required' })
  room_id: string;

  @IsString()
  @IsNotEmpty({ message: 'Source square is required' })
  move_from: string;

  @IsString()
  @IsNotEmpty({ message: 'Target square is required' })
  move_to: string;

  @IsString()
  @IsOptional()
  promotion?: string;
}