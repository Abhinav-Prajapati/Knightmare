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
      this.server.to(roomId).emit('game_state', { sender: client.id, gameState });
      this.server.to(roomId).emit('events', client.id);
    } catch (error) {
      this.logger.error(`join_room_error: ${roomId}, ${error.message}`);
      client.emit('error', { message: 'Failed to join room' });
    }
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
    try {
      // Validate input parameters
      if (!playerId || !roomId || !move_from || !move_to) {
        throw new Error('Missing required move parameters');
      }

      this.logger.log(`move_received: ${playerId} in ${roomId}, ${move_from}->${move_to}${promotion ? `,p=${promotion}` : ''}`);

      // Process the move
      const game_fen = await this.gameService.makeMove(playerId, roomId, move_from, move_to, promotion);
      this.logger.debug(`move_processed: ${roomId}, new_fen=${game_fen.fen}`);

      // Get and broadcast updated game state
      const gameState = await this.gameService.getGameState(roomId);
      this.logger.debug(`game_state_retrieved: ${roomId}`);

      this.server.to(roomId).emit('game_state', { sender: client.id, gameState });
      this.logger.debug(`game_state_broadcasted: ${roomId} by ${client.id}`);

    } catch (error) {
      const errorMsg = `Move error (${roomId}): ${error.message}`;
      this.logger.error(`move_error: ${playerId} in ${roomId}, ${move_from}->${move_to}, err=${error.message}`);
      client.emit('error', {
        message: errorMsg,
        code: error.code || 'MOVE_ERROR'
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
