import { WebSocketGateway, WebSocketServer, SubscribeMessage } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GameService } from './game.service';
import { Logger } from '@nestjs/common';
import { JoinRoomDto } from './dto/join-room.dto';
import { SendMoveDto } from './dto/send-move.dto';

@WebSocketGateway({ cors: true })
export class ChatGateway {
  @WebSocketServer()
  server: Server;

  private rooms: Map<string, Set<string>> = new Map();
  private readonly logger = new Logger('Game Socket.io');

  constructor(private readonly gameService: GameService) {
    this.logger.log('ChatGateway initialized');
  }

  @SubscribeMessage('join_room')
  async handleJoinRoom(client: Socket, data: JoinRoomDto) {

    if (!this.rooms.has(data.roomId)) {
      this.rooms.set(data.roomId, new Set());
      this.logger.log(`Room Created ${data.roomId}`);
    }

    this.rooms.get(data.roomId).add(client.id);
    client.join(data.roomId);
    this.logger.debug(`Player : ${data.userId} joined room : ${data.roomId}`)
    this.server.to(data.roomId).emit('events', client.id); // TODO: send msg to already joined player in room that this new player has joined 

    const gameState = await this.gameService.getGameState(data.roomId);
    this.server.to(data.roomId).emit('game_state', { sender: client.id, gameState });
  }

  @SubscribeMessage('send_move')
  async handleSendMove(client: Socket, data: SendMoveDto) {

    this.logger.debug(`Move received player : ${data.playerId} game : ${data.gameId} move : ${data.moveFrom} ${data.moveTo} ${data.promotion}`)

    try {
      const gameFEN = await this.gameService.makeMove(
        data.playerId
        , data.gameId
        , data.moveFrom
        , data.moveTo
        , data.promotion
      );

      this.logger.debug(`Move made. game : ${data.gameId} new FEN : ${gameFEN}`)

      const gameState = await this.gameService.getGameState(data.gameId);

      this.logger.debug(`Game State. game : ${data.gameId} game state : ${gameState}`)

      this.server.to(data.gameId).emit('game_state', { sender: client.id, gameState });
    } catch (error) {
      this.logger.error({ // TODO: Do proper error logging
        event: 'move_processing_error',
        clientId: client.id,
        roomId: data.gameId,
        error: {
          message: error.message,
          stack: error.stack,
        },
        moveDetails: {
          playerId: data.playerId,
          from: data.moveFrom,
          to: data.moveTo,
        },
        timestamp: new Date().toISOString()
      });
      client.emit('error', { message: error.message });
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
