import { WebSocketGateway, WebSocketServer, SubscribeMessage } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GameService } from './game.service';
import { Logger } from '@nestjs/common';

@WebSocketGateway({ cors: true })
export class ChatGateway {
  @WebSocketServer()
  server: Server;

  private rooms: Map<string, Set<string>> = new Map();
  private readonly logger = new Logger('ChatGateway');

  constructor(private readonly gameService: GameService) {
    this.logger.log('ChatGateway initialized');
  }


  @SubscribeMessage('join_room')
  async handleJoinRoom(client: Socket, roomId: string) {
    this.logger.log({
      event: 'join_room_attempt',
      clientId: client.id,
      roomId: roomId,
      timestamp: new Date().toISOString()
    });

    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Set());
      this.logger.debug({
        event: 'room_created',
        roomId: roomId,
        timestamp: new Date().toISOString()
      });
    }

    this.rooms.get(roomId).add(client.id);
    client.join(roomId);

    const roomSize = this.rooms.get(roomId).size;
    this.logger.debug({
      event: 'client_joined_room',
      clientId: client.id,
      roomId: roomId,
      currentRoomSize: roomSize,
      allClientsInRoom: Array.from(this.rooms.get(roomId)),
      timestamp: new Date().toISOString()
    });

    const gameState = await this.gameService.getGameState(roomId);
    this.server.to(roomId).emit('game_state', { sender: client.id, gameState });
    this.server.to(roomId).emit('events', client.id);
  }

  @SubscribeMessage('send_move')
  async handleSendMove(
    client: Socket,
    { playerId, roomId, move_from, move_to, promotion }: {
      playerId: string;
      roomId: string;
      move_from: string;
      move_to: string;
      promotion?: string;
    }
  ) {
    this.logger.log({
      event: 'move_received',
      clientId: client.id,
      roomId: roomId,
      moveDetails: {
        playerId,
        from: move_from,
        to: move_to,
        promotion
      },
      timestamp: new Date().toISOString()
    });

    try {
      const game_fen = await this.gameService.makeMove(
        playerId,
        roomId,
        move_from,
        move_to,
        promotion
      );

      this.logger.debug({
        event: 'move_processed',
        clientId: client.id,
        roomId: roomId,
        newFen: game_fen,
        timestamp: new Date().toISOString()
      });

      const gameState = await this.gameService.getGameState(roomId);

      this.logger.debug({
        event: 'game_state_retrieved',
        roomId: roomId,
        gameState: gameState,
        timestamp: new Date().toISOString()
      });

      this.server.to(roomId).emit('game_state', { sender: client.id, gameState });

      this.logger.debug({
        event: 'game_state_broadcasted',
        roomId: roomId,
        clientId: client.id,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      this.logger.error({
        event: 'move_processing_error',
        clientId: client.id,
        roomId: roomId,
        error: {
          message: error.message,
          stack: error.stack,
        },
        moveDetails: {
          playerId,
          from: move_from,
          to: move_to,
          promotion
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
