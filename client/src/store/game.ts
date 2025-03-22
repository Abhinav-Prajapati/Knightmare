import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Chess } from 'chess.js';

// Type definitions
export enum PlayerColor {
  WHITE = 'w',
  BLACK = 'b'
}

export enum GameType {
  ENGINE = 'engine',
  HUMAN = 'human',
  ONLINE = 'online'
}

export enum GameStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  CHECK = 'check',
  CHECKMATE = 'checkmate',
  STALEMATE = 'stalemate',
  DRAW = 'draw',
  RESIGNED = 'resigned',
  TIMEOUT = 'timeout'
}

interface Player {
  id: string;
  username: string;
  rating?: number;
  color: PlayerColor;
  isComputer?: boolean;
  computerLevel?: number;
  avatar?: string;
}

interface ClockState {
  initial: number; // Time in seconds
  white: number;
  black: number;
  increment: number;
  lastMoveTime: number | null;
  isRunning: boolean;
  activeColor: PlayerColor;
}

export interface MoveHistoryItem {
  uci: string; // Universal Chess Interface notation
  san: string; // Standard Algebraic Notation
  fen: string;
  timestamp: number;
}

interface GameState {
  // Game metadata
  currentGameId: string | null;
  gameType: GameType | null;
  startTime: number | null;
  endTime: number | null;

  // Players
  whitePlayer: Player | null;
  blackPlayer: Player | null;
  playerColor: PlayerColor | null;

  // Board state
  fen: string;
  lastMove: string | null;
  moveHistory: MoveHistoryItem[];

  // Game status
  status: GameStatus;
  winner: PlayerColor | null;
  isDraw: boolean;
  isCheck: boolean;

  // Clock
  clock: ClockState | null;

  //Engine Level
  computerLevel?: number;

  // Actions
  setCurrentGameId: (gameId: string) => void;
  clearCurrentGame: () => void;
  setGameType: (type: GameType) => void;
  setPlayerColor: (color: PlayerColor) => void;
  setPlayers: (white: Player, black: Player) => void;
  updateFen: (fen: string) => void;
  addMove: (uci: string, san: string, fen: string) => void;
  updateClock: (whiteTime: number, blackTime: number) => void;
  startClock: () => void;
  stopClock: () => void;
  switchClockTurn: () => void;
  updateGameStatus: (status: GameStatus, winner?: PlayerColor) => void;
  isInGame: () => boolean;
  resetGame: () => void;
  setComputerLevel: (level: number) => void;

  // Derived state
  getCurrentTurn: () => PlayerColor | null;
  getOpponentColor: () => PlayerColor | null;
  getPlayerById: (id: string) => Player | null;
  getRemainingTime: (color: PlayerColor) => number | null;
}

// Initial state
const initialClockState: ClockState = {
  initial: 600, // 10 minutes
  white: 600,
  black: 600,
  increment: 0,
  lastMoveTime: null,
  isRunning: false,
  activeColor: PlayerColor.WHITE
};

const DEFAULT_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

// Create store
export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentGameId: null,
      gameType: null,
      startTime: null,
      endTime: null,
      whitePlayer: null,
      blackPlayer: null,
      playerColor: null,
      fen: DEFAULT_FEN,
      lastMove: null,
      moveHistory: [],
      status: GameStatus.NOT_STARTED,
      winner: null,
      isDraw: false,
      isCheck: false,
      clock: initialClockState,

      // Actions
      setCurrentGameId: (gameId: string) => {
        set({ currentGameId: gameId });
      },

      clearCurrentGame: () => {
        set({
          currentGameId: null,
          gameType: null,
          startTime: null,
          endTime: null,
          whitePlayer: null,
          blackPlayer: null,
          playerColor: null,
          fen: DEFAULT_FEN,
          lastMove: null,
          moveHistory: [],
          status: GameStatus.NOT_STARTED,
          winner: null,
          isDraw: false,
          isCheck: false,
          clock: initialClockState,
        });
      },

      setGameType: (type: GameType) => {
        set({ gameType: type });
      },

      setPlayerColor: (color: PlayerColor) => {
        set({ playerColor: color });
      },

      setPlayers: (white: Player, black: Player) => {
        set({
          whitePlayer: white,
          blackPlayer: black,
          startTime: Date.now()
        });
      },

      updateFen: (fen: string) => {
        const chess = new Chess(fen);
        const isCheck = chess.inCheck();
        const status = (() => {
          if (chess.isCheckmate()) return GameStatus.CHECKMATE;
          if (chess.isStalemate()) return GameStatus.STALEMATE;
          if (chess.isDraw()) return GameStatus.DRAW;
          if (isCheck) return GameStatus.CHECK;
          return GameStatus.IN_PROGRESS;
        })();

        const winner = (() => {
          if (status === GameStatus.CHECKMATE) {
            return chess.turn() === 'w' ? PlayerColor.BLACK : PlayerColor.WHITE;
          }
          return null;
        })();

        set({
          fen,
          isCheck,
          status,
          winner,
          isDraw: chess.isDraw()
        });
      },

      addMove: (uci: string, san: string, fen: string) => {
        const moveItem: MoveHistoryItem = {
          uci,
          san,
          fen,
          timestamp: Date.now()
        };

        set(state => ({
          lastMove: uci,
          moveHistory: [...state.moveHistory, moveItem]
        }));

        // Handle clock switching
        get().switchClockTurn();
      },

      updateClock: (whiteTime: number, blackTime: number) => {
        set(state => ({
          clock: {
            ...state.clock!,
            white: whiteTime,
            black: blackTime
          }
        }));
      },

      startClock: () => {
        set(state => ({
          clock: {
            ...state.clock!,
            isRunning: true,
            lastMoveTime: Date.now()
          }
        }));
      },

      stopClock: () => {
        set(state => ({
          clock: {
            ...state.clock!,
            isRunning: false
          }
        }));
      },

      switchClockTurn: () => {
        const { clock } = get();
        if (!clock) return;

        const now = Date.now();
        const elapsed = clock.lastMoveTime ? (now - clock.lastMoveTime) / 1000 : 0;

        let whiteTime = clock.white;
        let blackTime = clock.black;

        if (clock.activeColor === PlayerColor.WHITE) {
          whiteTime = Math.max(0, whiteTime - elapsed);
          set(state => ({
            clock: {
              ...state.clock!,
              white: whiteTime,
              black: blackTime + clock.increment,
              activeColor: PlayerColor.BLACK,
              lastMoveTime: now
            }
          }));
        } else {
          blackTime = Math.max(0, blackTime - elapsed);
          set(state => ({
            clock: {
              ...state.clock!,
              white: whiteTime + clock.increment,
              black: blackTime,
              activeColor: PlayerColor.WHITE,
              lastMoveTime: now
            }
          }));
        }

        // Check for timeout
        if (whiteTime <= 0) {
          get().updateGameStatus(GameStatus.TIMEOUT, PlayerColor.BLACK);
        } else if (blackTime <= 0) {
          get().updateGameStatus(GameStatus.TIMEOUT, PlayerColor.WHITE);
        }
      },

      updateGameStatus: (status: GameStatus, winner?: PlayerColor) => {
        set({
          status,
          winner: winner || null,
          endTime: [
            GameStatus.CHECKMATE,
            GameStatus.STALEMATE,
            GameStatus.DRAW,
            GameStatus.RESIGNED,
            GameStatus.TIMEOUT
          ].includes(status) ? Date.now() : null
        });

        if (status !== GameStatus.IN_PROGRESS && status !== GameStatus.CHECK) {
          get().stopClock();
        }
      },

      isInGame: () => {
        return get().currentGameId !== null && [
          GameStatus.NOT_STARTED,
          GameStatus.IN_PROGRESS,
          GameStatus.CHECK
        ].includes(get().status);
      },

      resetGame: () => {
        set({
          fen: DEFAULT_FEN,
          lastMove: null,
          moveHistory: [],
          status: GameStatus.NOT_STARTED,
          winner: null,
          isDraw: false,
          isCheck: false,
          clock: initialClockState,
          startTime: null,
          endTime: null
        });
      },

      // Derived state getters
      getCurrentTurn: () => {
        const chess = new Chess(get().fen);
        return chess.turn() === 'w' ? PlayerColor.WHITE : PlayerColor.BLACK;
      },

      getOpponentColor: () => {
        const playerColor = get().playerColor;
        if (!playerColor) return null;
        return playerColor === PlayerColor.WHITE ? PlayerColor.BLACK : PlayerColor.WHITE;
      },

      getPlayerById: (id: string) => {
        const { whitePlayer, blackPlayer } = get();
        if (whitePlayer?.id === id) return whitePlayer;
        if (blackPlayer?.id === id) return blackPlayer;
        return null;
      },

      getRemainingTime: (color: PlayerColor) => {
        const { clock } = get();
        if (!clock) return null;

        if (color === PlayerColor.WHITE) {
          return clock.white;
        } else {
          return clock.black;
        }
      },
      setComputerLevel: (level: number) => {
        set({ computerLevel: level })
      },
    }),
    { // NOT A GOOD IDEA TO STORE GAME STATE IN PLANE TEXT
      name: 'chess-game-storage',
      partialize: (state) => ({
        currentGameId: state.currentGameId,
        gameType: state.gameType,
        fen: state.fen,
        playerColor: state.playerColor,
        computerLevel: state.computerLevel,
      }),
    }
  )
);

// Create hooks for accessing specific parts of the state
export const useGameMetadata = () => {
  const { currentGameId, gameType, startTime, endTime } = useGameStore();
  return { currentGameId, gameType, startTime, endTime };
};

export const useGamePlayers = () => {
  const { whitePlayer, blackPlayer, playerColor } = useGameStore();
  return { whitePlayer, blackPlayer, playerColor };
};

export const useGameBoard = () => {
  const { fen, lastMove, moveHistory } = useGameStore();
  const updateFen = useGameStore(state => state.updateFen);
  const addMove = useGameStore(state => state.addMove);
  return { fen, lastMove, moveHistory, updateFen, addMove };
};

export const useGameStatus = () => {
  const { status, winner, isDraw, isCheck } = useGameStore();
  const updateGameStatus = useGameStore(state => state.updateGameStatus);
  return { status, winner, isDraw, isCheck, updateGameStatus };
};

export const useGameClock = () => {
  const { clock } = useGameStore();
  const updateClock = useGameStore(state => state.updateClock);
  const startClock = useGameStore(state => state.startClock);
  const stopClock = useGameStore(state => state.stopClock);
  const switchClockTurn = useGameStore(state => state.switchClockTurn);
  return { clock, updateClock, startClock, stopClock, switchClockTurn };
};