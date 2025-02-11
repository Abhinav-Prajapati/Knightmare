import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GameService } from './game.service';

@WebSocketGateway({ cors: true })
export class ChatGateway {
  @WebSocketServer()
  server: Server;

  private rooms: Map<string, Set<string>> = new Map();

  constructor(private readonly gameService: GameService) { }

  @SubscribeMessage('join_room')
  handleJoinRoom(client: Socket, roomId: string) {
    console.log(`Client ${client.id} attempting to join room: ${roomId}`);

    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Set());
      console.log(`Room ${roomId} created`);
    }

    this.rooms.get(roomId).add(client.id);
    console.log(`Client ${client.id} added to room: ${roomId}`);
    client.join(roomId);

    this.server.to(roomId).emit('events', client.id);
    console.log(`Broadcasted event to room ${roomId}: ${client.id}`);
  }

  @SubscribeMessage('send_move')
  async handleSendMove(
    client: Socket,
    { playerId, roomId, move_from, move_to, promotion }: { playerId: string; roomId: string; move_from: string; move_to: string; promotion?: string }
  ) {
    console.log(`Received move from client ${client.id} in room ${roomId}`);
    console.log(`Move details - playerId: ${playerId}, from: ${move_from}, to: ${move_to}, promotion: ${promotion}`);
    try {
      const game_fen = await this.gameService.makeMove(playerId, roomId, move_from, move_to, promotion);
      console.log(`Move processed successfully. New FEN: ${game_fen}`);

      const gameState = await this.gameService.getGameState(roomId);
      console.log(`Retrieved game state for room ${roomId}`);

      this.server.to(roomId).emit('game_state', { sender: client.id, gameState });
      console.log(`Emitted new game state to room ${roomId}`);
    } catch (error) {
      console.error(`Error processing move for client ${client.id}:`, error.message);
      client.emit('error', { message: error.message });
    }
  }

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
    client.emit('message', { user: 'System', message: 'Welcome to the chat!' });
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    this.rooms.forEach((clients, roomId) => {
      if (clients.has(client.id)) {
        clients.delete(client.id);
        console.log(`Client ${client.id} removed from room ${roomId}`);
        if (clients.size === 0) {
          this.rooms.delete(roomId);
          console.log(`Room ${roomId} deleted (empty)`);
        }
      }
    });
  }
}
