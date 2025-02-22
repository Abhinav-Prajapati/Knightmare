"use client"
import UserProfile from './UserProfile'
import { useAuthStore } from '@/store/auth'
import React from 'react'

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuthStore()

  return (
    <div className="w-full p-4">
      <div className='w-full h-14 flex items-center justify-between backdrop-blur-sm bg-gray-400 bg-opacity-10 border-[1px] border-orange-400/30 backdrop-filter rounded-sm'>
        {/* Logo */}
        <div className="flex w-max text-5xl items-end mx-4">
          <span className='font-semibold font-rochester bg-gradient-to-r to-[#A348DF] from-[#7143E2] bg-clip-text text-transparent'>Quick</span>
          <span className='text-white/80 text-4xl font-rochester'>Chess</span>
        </div>

        {/* User Profile */}
        {isAuthenticated && user ? (
          <UserProfile name={user.username} />
        ) : (
          <div className="text-white/70">Not Logged In</div>
        )}
      </div>
    </div>
  )
}

export default Navbar
