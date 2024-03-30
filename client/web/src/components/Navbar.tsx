"use client"
import UserProfile from './UserProfile'
import { useLogout } from '@/hooks/useLogout'
import React, { useContext, useEffect } from 'react'

const Navbar = () => {

  const { logout } = useLogout()
  const handleClick = () => {
    logout();
  }
  return (
    <div className='w-full h-[7vh] flex items-center justify-between'>
      {/* logo  */}
      <div className="flex w-max text-4xl items-end mx-4">
        <span className=' textgrad font-semibold bg-gradient-to-r to-[#A348DF] from-[#7143E2] bg-clip-text text-transparent '>Quick</span>
        <span className='text-white/80 text-3xl'>Chess</span>
      </div>
      <div className="h-10 w-28 bg-white text-black text-center rounded-full flex items-center justify-center cursor-pointer"
        onClick={handleClick}
      >Logout</div>
      <UserProfile />
    </div>
  )
}

export default Navbar