import React, { useEffect, useRef } from 'react';
import { twMerge } from 'tailwind-merge';
import { MoveHistoryItem } from '@/store/game';

// Updated MoveHistorySegment to use MoveHistoryItem
const MoveHistorySegment = ({
	index,
	move1,
	move2,
	movesLength
}: {
	index: number;
	move1: MoveHistoryItem;
	move2?: MoveHistoryItem;
	movesLength: number
}) => {
	const moveNumber = Math.floor(index / 2) + 1;
	const isLatestSegment = index + (move2 ? 2 : 1) >= movesLength - 2;

	return (
		<div className={twMerge("relative flex p-1", isLatestSegment ? 'bg-gray-700/30' : '')}>
			<span className="text-white/50 w-[10%]">{moveNumber}.</span>
			<span className="text-white/80 px-2 w-[45%]">
				<div className={`w-max ${index === movesLength - 1 ? 'border-b border-white' : ''}`}>
					{move1.san}
				</div>
			</span>
			{move2 && (
				<span className="text-white/80 px-2 w-[45%]">
					<div className={`w-max ${index + 1 === movesLength - 1 ? 'border-b border-white' : ''}`}>
						{move2.san}
					</div>
				</span>
			)}
		</div>
	);
};

// Updated MoveHistory to use MoveHistoryItem array
const MoveHistory = ({ moves }: { moves: MoveHistoryItem[] }) => {
	const historyRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (historyRef.current) {
			historyRef.current.scrollTop = historyRef.current.scrollHeight;
		}
	}, [moves]);

	return (
		<div className="pb-2 px-1 flex flex-col items-center h-full">
			<div
				ref={historyRef}
				className="w-full overflow-y-auto h-[300px]"
				style={{
					maxHeight: '300px',
					scrollbarWidth: 'none',
					msOverflowStyle: 'none',
				}}
			>
				<style>
					{`
            ::-webkit-scrollbar {
              display: none;
            }
          `}
				</style>
				{moves.map((_, i) =>
					i % 2 === 0 ? (
						<MoveHistorySegment
							key={i}
							index={i}
							move1={moves[i]}
							move2={moves[i + 1]}
							movesLength={moves.length}
						/>
					) : null
				)}
			</div>
		</div>
	);
};

interface TimeDisplayProps {
	time: string;
	isActive: boolean;
}

const TimeDisplay: React.FC<TimeDisplayProps> = ({ time, isActive }) => {
	return (
		<div className={`text-4xl font-mono ${isActive ? 'text-white' : 'text-gray-400'}`}>
			{time}
		</div>
	);
};

interface PlayerInfoProps {
	name: string;
	rating: number;
	isActive: boolean;
}

const PlayerInfo: React.FC<PlayerInfoProps> = ({ name, rating, isActive }) => {
	return (
		<div className="flex items-center my-1">
			<div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-500' : 'bg-gray-500'} mr-2`}></div>
			<span className="flex-grow">{name}</span>
			<span className="text-gray-400">{rating}</span>
		</div>
	);
};

const ControlButtons: React.FC = () => {
	return (
		<div className="flex justify-between my-2 text-gray-400">
			<button className="p-1">↺</button>
			<button className="p-1">⏮</button>
			<button className="p-1">◀</button>
			<button className="p-1">▶</button>
			<button className="p-1">⏭</button>
			<button className="p-1">↻</button>
		</div>
	);
};

interface ChessGameInterfaceProps {
	moveHistory: MoveHistoryItem[];
	player1: PlayerInfoProps;
	player2: PlayerInfoProps;
	time1: string;
	time2: string;
}

const ChessGameInterface: React.FC<ChessGameInterfaceProps> = ({
	moveHistory,
	player1,
	player2,
	time1,
	time2
}) => {
	return (
		<div className="flex flex-col bg-gray-800 text-white max-w-sm rounded-lg overflow-hidden">
			<div className="px-4 pt-4">
				<TimeDisplay time={time1} isActive={player1.isActive} />
				<PlayerInfo name={player1.name} rating={player1.rating} isActive={player1.isActive} />
				<ControlButtons />
			</div>
			<div className="border-y border-gray-700 w-full">
				<MoveHistory moves={moveHistory} />
			</div>
			<div className="px-4 pb-4">
				<PlayerInfo name={player2.name} rating={player2.rating} isActive={player2.isActive} />
				<TimeDisplay time={time2} isActive={player2.isActive} />
			</div>
		</div>
	);
};

export default ChessGameInterface;