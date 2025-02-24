'use client'

import Image from 'next/image'
import { FC } from 'react'

interface ChessPlayerProps {
  profileUrl: string
  username: string
  rating: number
  countryFlagUrl?: string
  time: string
  capturedPieces?: string[] // Can be an array of piece symbols
}

const ChessPlayerCard: FC<ChessPlayerProps> = ({ profileUrl, username, rating, countryFlagUrl, time, capturedPieces = [] }) => {
  return (
    <div className="relative frost-blur p-4 w-[300px] shadow-lg">
      {/* Background Image */}
      <div className="absolute inset-0 opacity-10">
      </div>

      {/* Player Info */}
      <div className="relative flex items-center space-x-3">
        {/* Profile Image */}
        <div className="w-12 h-12 rounded-md overflow-hidden">
          <Image src={profileUrl} alt="Profile" width={48} height={48} />
        </div>

        <div>
          {/* Rating */}
          <p className="text-gray-300 text-sm">{rating}</p>
          {/* Username */}
          <p className="text-white text-lg font-semibold">{username}</p>
          {/* Country Flag */}
          {countryFlagUrl && (
            <Image src={countryFlagUrl} alt="Country Flag" width={20} height={15} className="mt-1" />
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="border-b border-white/30 my-2"></div>

      {/* Timer */}
      <div className="relative flex items-center justify-center bg-white/10 px-3 py-2 rounded-lg">
        <p className="text-white text-lg font-semibold">{time}</p>
      </div>

      {/* Captured Pieces (Optional) */}
      {capturedPieces.length > 0 && (
        <div className="mt-3 flex space-x-1">
          {capturedPieces.map((piece, index) => (
            <span key={index} className="text-white text-lg">{piece}</span>
          ))}
        </div>
      )}
    </div>
  )
}

export default ChessPlayerCard
