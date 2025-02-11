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
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Set()); // Create room if it doesn't exist
    }

    this.rooms.get(roomId).add(client.id); // Add player to the room set
    client.join(roomId); // Join the room

    this.server.to(roomId).emit('events', client.id);
  }

  @SubscribeMessage('send_move')
  async handleSendMove(
    client: Socket,
    { roomId, move_from, move_to, promotion }: { roomId: string; move_from: string; move_to: string; promotion?: string }
  ) {
    try {
      const game_fen = await this.gameService.makeMove(roomId, move_from, move_to, promotion);
      const gameState = await this.gameService.getGameState(roomId)
      this.server.to(roomId).emit('game_state', { sender: client.id, gameState });

    } catch (error) {
      client.emit('error', { message: error.message });
    }
  }

  // Triggered when a client connects
  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
    client.emit('message', { user: 'System', message: 'Welcome to the chat!' });
  }

  // Triggered when a client disconnects
  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }
}
