import React, { useEffect, useRef } from 'react';
import { twMerge } from 'tailwind-merge';
import { MoveHistoryItem, useGameBoard } from '@/store/game';

const MoveHistorySegment = ({
	move,
	isLastMove
}: {
	move: MoveHistoryItem;
	isLastMove: boolean;
}) => {
	return (
		<div className={twMerge(
			"text-white/80 px-2",
			isLastMove ? "bg-gray-700" : ""
		)}>
			{move.san}
		</div>
	);
};

const MoveHistory = () => {
	const historyRef = useRef<HTMLDivElement>(null);
	const { moveHistory } = useGameBoard();

	useEffect(() => {
		if (historyRef.current) {
			historyRef.current.scrollTop = historyRef.current.scrollHeight;
		}
	}, [moveHistory]);

	// Organize moves into pairs for display
	const movePairs = [];
	for (let i = 0; i < moveHistory.length; i += 2) {
		movePairs.push({
			moveNumber: Math.floor(i / 2) + 1,
			whiteMove: moveHistory[i],
			blackMove: i + 1 < moveHistory.length ? moveHistory[i + 1] : undefined
		});
	}

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
				<div className="grid grid-cols-12 w-full gap-1">
					{movePairs.map((pair, index) => (
						<React.Fragment key={index}>
							<div className="col-span-2 text-white/50 text-center pr-1">
								{pair.moveNumber}.
							</div>
							<div className="col-span-5">
								<MoveHistorySegment
									move={pair.whiteMove}
									isLastMove={moveHistory.length - 1 === index * 2}
								/>
							</div>
							<div className="col-span-5">
								{pair.blackMove && (
									<MoveHistorySegment
										move={pair.blackMove}
										isLastMove={moveHistory.length - 1 === index * 2 + 1}
									/>
								)}
							</div>
						</React.Fragment>
					))}
				</div>
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
	player1: PlayerInfoProps;
	player2: PlayerInfoProps;
	time1: string;
	time2: string;
}

const ChessGameInterface: React.FC<ChessGameInterfaceProps> = ({
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
				<MoveHistory />
			</div>
			<div className="px-4 pb-4">
				<PlayerInfo name={player2.name} rating={player2.rating} isActive={player2.isActive} />
				<TimeDisplay time={time2} isActive={player2.isActive} />
			</div>
		</div>
	);
};

export default ChessGameInterface;