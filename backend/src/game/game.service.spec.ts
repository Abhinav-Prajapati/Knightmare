import { Test, TestingModule } from '@nestjs/testing';
import { GameService } from './game.service';
import { RedisService } from '../redis.service';
import { HttpException } from '@nestjs/common';

describe('GameService', () => {
  let service: GameService;
  let redisService: RedisService;

  // Mock Redis Service
  const mockRedisService = {
    get: jest.fn(),
    set: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GameService,
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
      ],
    }).compile();

    service = module.get<GameService>(GameService);
    redisService = module.get<RedisService>(RedisService);
  });

  it('should play Fool\'s Mate and detect checkmate', async () => {
    // Create a new game
    mockRedisService.set.mockResolvedValue(true);
    const gameId = await service.createGame();

    // Mock initial game state
    const initialGameState = {
      player1: null,
      player2: null,
      turn: 'white',
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      pgn: '',
      move_history: [],
      status: 'waiting',
    };
    mockRedisService.get.mockResolvedValue(JSON.stringify(initialGameState));

    // Move 1: White f3
    const move1 = await service.makeMove(gameId, 'f2', 'f3');
    const afterMove1 = {
      ...initialGameState,
      fen: move1.fen,
      move_history: [{ from: 'f2', to: 'f3' }],
    };
    mockRedisService.get.mockResolvedValue(JSON.stringify(afterMove1));

    // Move 2: Black e6
    const move2 = await service.makeMove(gameId, 'e7', 'e6');
    const afterMove2 = {
      ...afterMove1,
      fen: move2.fen,
      move_history: [...afterMove1.move_history, { from: 'e7', to: 'e6' }],
    };
    mockRedisService.get.mockResolvedValue(JSON.stringify(afterMove2));

    // Move 3: White g4
    const move3 = await service.makeMove(gameId, 'g2', 'g4');
    const afterMove3 = {
      ...afterMove2,
      fen: move3.fen,
      move_history: [...afterMove2.move_history, { from: 'g2', to: 'g4' }],
    };
    mockRedisService.get.mockResolvedValue(JSON.stringify(afterMove3));

    // Move 4: Black Qh4# (Checkmate)
    const move4 = await service.makeMove(gameId, 'd8', 'h4');
    const afterMove4 = {
      ...afterMove3,
      fen: move4.fen,
      move_history: [...afterMove3.move_history, { from: 'd8', to: 'h4' }],
    };
    mockRedisService.get.mockResolvedValue(JSON.stringify(afterMove4));

    // Check game state after checkmate
    const finalGameState = await service.getGameState(gameId);

    expect(finalGameState.game_over_status.is_gameover).toBe(true);
    expect(finalGameState.game_over_status.is_in_checkmate).toBe(true);
    expect(finalGameState.game_over_status.is_in_check).toBe(true);
    expect(finalGameState.move_history.length).toBe(4);
  });

  it('should throw error for invalid moves', async () => {
    const gameId = await service.createGame();
    mockRedisService.get.mockResolvedValue(JSON.stringify({
      player1: null,
      player2: null,
      turn: 'white',
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      pgn: '',
      move_history: [],
      status: 'waiting',
    }));

    await expect(service.makeMove(gameId, 'e2', 'e5')).rejects.toThrow(HttpException);
  });
});
