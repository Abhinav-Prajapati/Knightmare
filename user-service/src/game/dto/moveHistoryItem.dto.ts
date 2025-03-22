import { IsString, IsOptional, IsNumber } from 'class-validator';

export class MoveHistoryItemDto {
    @IsString()
    uci: string;

    @IsString()
    san: string;

    @IsString()
    fen: string;

    @IsNumber()
    timestamp: number;

    @IsString()
    @IsOptional()
    comment?: string;
}