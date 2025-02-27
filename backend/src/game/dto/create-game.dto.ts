import {IsNotEmpty, IsEnum} from 'class-validator'

enum GameColor {
  WHITE = 'white',
  BLACK = 'black',
}

export class CreateGameDto {
  @IsEnum(GameColor)
  @IsNotEmpty()
  player_color: GameColor;
}
