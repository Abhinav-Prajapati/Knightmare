import { WebSocketGateway, WebSocketServer, SubscribeMessage } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GameService } from './game.service';
import { Logger } from '@nestjs/common';
import { validate } from 'class-validator';
import { ChessMoveDto } from './dto/send-move.dto';

const socketEvents = {
  JOIN_GAME: 'join_room',
  SEND_MOVE: 'send_move',
}

@WebSocketGateway({ cors: true })
export class ChatGateway {
  @WebSocketServer()
  server: Server;

  private rooms: Map<string, Set<string>> = new Map();
  private readonly logger = new Logger('ChatGateway');

  constructor(private readonly gameService: GameService) {
    this.logger.log('Game Socket.io initialized');
  }

  @SubscribeMessage(socketEvents.JOIN_GAME)
  async handleJoinRoom(client: Socket, roomId: string) {
    try {
      // Create room if it doesn't exist
      if (!this.rooms.has(roomId)) {
        this.rooms.set(roomId, new Set());
        this.logger.debug(`room_created: ${roomId}`);
      }

      // Add client to room
      this.rooms.get(roomId).add(client.id);
      client.join(roomId);

      const roomSize = this.rooms.get(roomId).size;
      this.logger.debug(`client_joined: ${client.id} to ${roomId}, size=${roomSize}`);

      // Get and broadcast game state
      const gameState = await this.gameService.getGameState(roomId);
      this.server.to(roomId).emit('game_state', { gameState });
    } catch (error) {
      this.logger.error(`join_room_error: ${roomId}, ${error.message}`);
      client.emit('error', { message: 'Failed to join room' });
    }
  }

  @SubscribeMessage(socketEvents.SEND_MOVE)
  async handleSendMove(client: Socket, chessMove: ChessMoveDto) {
    try {
      // Validate DTO
      const chessMoveDto = Object.assign(new ChessMoveDto(), chessMove);
      const errors = await validate(chessMoveDto);
      if (errors.length > 0) {
        throw new Error(errors.map(err => Object.values(err.constraints).join(', ')).join('; '));
      }

      this.logger.log(
        `move_received: ${chessMoveDto.playerId} in ${chessMoveDto.gameId}, ${chessMoveDto.moveFrom}->${chessMoveDto.moveTo}${chessMoveDto.promotion ? `,p=${chessMoveDto.promotion}` : ''}`
      );

      // Process the move
      const newGameState = await this.gameService.makeMove(chessMoveDto);
      this.logger.debug(`move_processed: ${chessMoveDto.gameId}, new fen=${newGameState.fen}`);

      // Get and broadcast updated game state
      this.server.to(chessMoveDto.gameId).emit('game_state', newGameState);
      this.logger.debug(`game_state_broadcasted: ${chessMoveDto.gameId} by ${client.id}`);

    } catch (error) {
      const errorMsg = `Move error (${chessMove.gameId}): ${error.message}`;
      this.logger.error(
        `move_error: ${chessMove.playerId} in ${chessMove.gameId}, ${chessMove.moveFrom}->${chessMove.moveTo}, err=${error.message}`
      );

      client.emit('error', {
        message: errorMsg,
        code: error.code || 'MOVE_ERROR',
      });
    }
  }

  handleConnection(client: Socket) {
    this.logger.log({
      event: 'client_connected',
      clientId: client.id,
      timestamp: new Date().toISOString(),
      totalConnections: this.server?.engine?.clientsCount || 'unknown'
    });

    client.emit('message', { user: 'System', message: 'Welcome to the chat!' });
  }

  handleDisconnect(client: Socket) {
    let roomsAffected = [];
    this.rooms.forEach((clients, roomId) => {
      if (clients.has(client.id)) {
        clients.delete(client.id);
        roomsAffected.push({
          roomId,
          remainingClients: clients.size
        });


        if (clients.size === 0) {
          this.rooms.delete(roomId);
        }
      }
    });

    if (roomsAffected.length > 0) {
      this.logger.debug({
        event: 'disconnect_room_impact',
        clientId: client.id,
        affectedRooms: roomsAffected,
        timestamp: new Date().toISOString()
      });
    }
  }
}