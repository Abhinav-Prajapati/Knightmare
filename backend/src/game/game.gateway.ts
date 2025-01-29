import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ cors: true }) // Enable CORS for cross-origin connections
export class ChatGateway {
  @WebSocketServer()
  server: Server;

  // Triggered when a client sends a message
  @SubscribeMessage('message')
  handleMessage(
    @MessageBody() data: { user: string; message: string },
    @ConnectedSocket() client: Socket,
  ) {
    console.log(`Received message from ${data.user}: ${data.message}`);
    console.log(`all clients ${client.id}`);

    // Broadcast the message to all connected clients
    this.server.emit('message', data);
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
