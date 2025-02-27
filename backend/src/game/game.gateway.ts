import { WebSocketGateway, WebSocketServer, SubscribeMessage } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GameService } from './game.service';
import { Logger } from '@nestjs/common';
import { validate } from 'class-validator';
import { MoveDto } from './dto/send-move.dto';

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
  async handleSendMove(client: Socket, moveData: MoveDto) {
    try {
      // Validate DTO
      const moveDto = Object.assign(new MoveDto(), moveData);
      const errors = await validate(moveDto);
  
      if (errors.length > 0) {
        throw new Error(errors.map(err => Object.values(err.constraints).join(', ')).join('; '));
      }
  
      this.logger.log(`move_received: ${moveDto.player_id} in ${moveDto.room_id}, ${moveDto.move_from}->${moveDto.move_to}${moveDto.promotion ? `,p=${moveDto.promotion}` : ''}`);
  
      // Process the move
      const game_fen = await this.gameService.makeMove(
        moveDto.player_id,
        moveDto.room_id,
        moveDto.move_from,
        moveDto.move_to,
        moveDto.promotion
      );
      this.logger.debug(`move_processed: ${moveDto.room_id}, new_fen=${game_fen.fen}`);
  
      // Get and broadcast updated game state
      const gameState = await this.gameService.getGameState(moveDto.room_id);
      this.logger.debug(`game_state_retrieved: ${moveDto.room_id}`);
  
      this.server.to(moveDto.room_id).emit('game_state', { sender: client.id, gameState });
      this.logger.debug(`game_state_broadcasted: ${moveDto.room_id} by ${client.id}`);
  
    } catch (error) {
      const errorMsg = `Move error (${moveData.room_id}): ${error.message}`;
      this.logger.error(`move_error: ${moveData.player_id} in ${moveData.room_id}, ${moveData.move_from}->${moveData.move_to}, err=${error.message}`);
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
