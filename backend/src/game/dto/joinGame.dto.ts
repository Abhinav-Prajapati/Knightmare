import { IsNotEmpty, IsString } from 'class-validator';

export class JoinGameDto {
  @IsString()
  @IsNotEmpty()
  game_id: string;
}