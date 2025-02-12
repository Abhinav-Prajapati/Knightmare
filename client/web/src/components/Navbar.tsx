"use client"
import UserProfile from './UserProfile'
import { useAuthStore } from '@/store/auth'
import React from 'react'

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuthStore()

  return (
    <div className='w-full h-[7vh] flex items-center justify-between'>
      {/* Logo */}
      <div className="flex w-max text-4xl items-end mx-4">
        <span className=' textgrad font-semibold bg-gradient-to-r to-[#A348DF] from-[#7143E2] bg-clip-text text-transparent '>Quick</span>
        <span className='text-white/80 text-3xl'>Chess</span>
      </div>

      {/* Logout Button */}
      {isAuthenticated && (
        <div
          className="h-10 w-28 bg-white text-black text-center rounded-full flex items-center justify-center cursor-pointer"
          onClick={logout}
        >
          Logout
        </div>
      )}

      {/* User Profile */}
      {isAuthenticated && user ? (
        <UserProfile name={user.username} />
      ) : (
        <div className="text-white/70">Not Logged In</div>
      )}
    </div>
  )
}

export default Navbar
