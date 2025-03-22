import {IsNotEmpty, IsEnum} from 'class-validator'
import { PlayerColor } from '../enums/game.enums';


export class CreateGameDto {
  @IsEnum(PlayerColor,{
    message:'valid player color required ie w/b'
  })
  @IsNotEmpty()
  playerColor: PlayerColor;
}