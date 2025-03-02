import { IsString, IsOptional, IsInt, Min, Max, IsEnum, IsNotEmpty, isNumber, isInt, IsNumber, IsBoolean } from 'class-validator';
import { DEFAULT_POSITION } from 'chess.js'
import { Transform } from 'class-transformer';
import { PlayerColor } from '../enums/game.enums';

export class CreateEngineGameDto {
    @IsOptional()
    @IsString()
    engineName?: string;

    @IsInt()
    @Min(1)
    @Max(20)
    level: number;

    @IsInt()
    @Min(1)
    @Max(100)
    @IsOptional()
    depth?: number;

    @IsNotEmpty()
    @IsEnum(PlayerColor, {
        message: 'valid player color required ie w/b'
    })
    playAs: PlayerColor;

    @IsOptional()
    @IsString()
    @Transform(({ value }) => value ?? DEFAULT_POSITION)
    fen?: string;

    @IsOptional()
    timeControl?: {
        baseTime: number;
        increment: number;
    };

    @IsOptional()
    @IsInt()
    @Min(800)
    @Max(3000)
    elo?: number;

    @IsOptional()
    @IsInt()
    threads?: number;

    @IsOptional()
    @IsInt()
    hash?: number;
}

export class ChessEngineRequestDto {
    @IsString()
    fen: string

    @IsOptional()
    @IsInt()
    difficulty?: number

    @IsOptional()
    @IsNumber()
    timeLimit?: number

    @IsOptional()
    @IsInt()
    depthLimit
}

export class ChessEngineResponseDto {
    @IsOptional()
    @IsString()
    move?: string; // UCI format (e.g., "e2e4"), undefined if the game is over

    @IsString()
    fenAfter: string;

    @IsBoolean()
    isGameOver: boolean;

    @IsBoolean()
    isCheck: boolean;

    @IsBoolean()
    isCheckmate: boolean;
}