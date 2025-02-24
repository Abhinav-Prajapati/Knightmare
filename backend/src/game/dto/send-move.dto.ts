export class SendMoveDto {
  playerId: string;
  gameId: string;
  moveFrom: string;
  moveTo: string;
  promotion?: string;
}
