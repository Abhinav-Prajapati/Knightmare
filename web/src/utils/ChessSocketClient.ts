import { Socket, io } from 'socket.io-client';

// Types for game state and moves
interface GameOverStatus {
    isGameOver: boolean;
    isInCheck: boolean;
    isInCheckmate: boolean;
    isInStalemate: boolean;
    isInDraw: boolean;
}

interface GameState {
    fen: string;
    moveHistory: any[];
    playerColor: 'w' | 'b';
    whitePlayerId: string | null;
    blackPlayerId: string | null;
    gameOverStatus: GameOverStatus | null;
    turn: 'w' | 'b';
}

interface ChessMove {
    gameId: string;
    playerId: string;
    moveFrom: string;
    moveTo: string;
    promotion?: string | null;
}

type ErrorCallback = (error: { message: string; code?: string }) => void;
type GameStateCallback = (gameState: GameState) => void;
type MessageCallback = (message: { user: string; message: string }) => void;

/**
 * ChessSocketClient - A wrapper for Socket.IO client to handle engine chess game communications
 */
export class ChessSocketClient {
    private socket: Socket;
    private gameStateCallback: GameStateCallback | null = null;
    private errorCallback: ErrorCallback | null = null;
    private messageCallback: MessageCallback | null = null;
    private connected: boolean = false;

    /**
     * Creates a new ChessSocketClient
     * @param baseUrl The base URL of the websocket server
     * @param options Additional options for the connection
     */
    constructor(
        private baseUrl: string,
        private options: {
            autoConnect?: boolean;
            playerId?: string;
            reconnection?: boolean;
            reconnectionAttempts?: number;
            reconnectionDelay?: number;
        } = {}
    ) {
        // Set default options
        this.options = {
            autoConnect: true,
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            ...options
        };

        // Initialize Socket.IO connection
        this.socket = io(`${baseUrl}/engine`, {
            autoConnect: this.options.autoConnect,
            reconnection: this.options.reconnection,
            reconnectionAttempts: this.options.reconnectionAttempts,
            reconnectionDelay: this.options.reconnectionDelay,
            transports: ['websocket']
        });

        // Set up event listeners
        this.setupEventListeners();
    }

    /**
     * Set up event listeners for socket events
     */
    private setupEventListeners(): void {
        // Connection events
        this.socket.on('connect', () => {
            this.connected = true;
            console.log('Connected to chess engine server');
        });

        this.socket.on('disconnect', () => {
            this.connected = false;
            console.log('Disconnected from chess engine server');
        });

        // Game events
        this.socket.on('game_state', (data) => {
            if (this.gameStateCallback) {
                this.gameStateCallback(data.gameState || data);
            }
        });

        // Error handling
        this.socket.on('error', (error: { message: string; code?: string }) => {
            console.error('Socket error:', error);
            if (this.errorCallback) {
                this.errorCallback(error);
            }
        });

        // System messages
        this.socket.on('message', (message: { user: string; message: string }) => {
            console.log(`${message.user}: ${message.message}`);
            if (this.messageCallback) {
                this.messageCallback(message);
            }
        });
    }

    /**
     * Connect to the websocket server
     */
    connect(): void {
        if (!this.connected) {
            this.socket.connect();
        }
    }

    /**
     * Disconnect from the websocket server
     */
    disconnect(): void {
        if (this.connected) {
            this.socket.disconnect();
        }
    }

    /**
     * Join a chess game
     * @param gameId The ID of the game to join
     */
    joinGame(gameId: string, playAs: 'b' | 'w'): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.connected) {
                this.connect();
            }

            this.socket.emit('join_game', { 'gameId': gameId, 'playAs': playAs }, (response: any) => {
                if (response && response.error) {
                    reject(new Error(response.error));
                } else {
                    resolve();
                }
            });
        });
    }

    /**
     * Send a chess move to the server
     * @param move The chess move to send
     */
    sendMove(move: Omit<ChessMove, 'playerId'>): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.connected) {
                reject(new Error('Not connected to server'));
                return;
            }

            if (!this.options.playerId) {
                reject(new Error('Player ID not set'));
                return;
            }

            const fullMove: ChessMove = {
                ...move,
                playerId: this.options.playerId
            };

            this.socket.emit('send_move', fullMove, (response: any) => {
                if (response && response.error) {
                    reject(new Error(response.error));
                } else {
                    resolve();
                }
            });
        });
    }

    /**
     * Register a callback for game state updates
     * @param callback Function to call when game state updates
     */
    onGameStateUpdate(callback: GameStateCallback): void {
        this.gameStateCallback = callback;
    }

    /**
     * Register a callback for error messages
     * @param callback Function to call when an error occurs
     */
    onError(callback: ErrorCallback): void {
        this.errorCallback = callback;
    }

    /**
     * Register a callback for system messages
     * @param callback Function to call when a message is received
     */
    onMessage(callback: MessageCallback): void {
        this.messageCallback = callback;
    }

    /**
     * Check if the client is connected to the server
     */
    isConnected(): boolean {
        return this.connected;
    }

    /**
     * Set player ID after initialization
     * @param playerId The player's unique ID
     */
    setPlayerId(playerId: string): void {
        this.options.playerId = playerId;
    }

    /**
     * Get the socket instance for advanced use cases
     */
    getSocket(): Socket {
        return this.socket;
    }
}
