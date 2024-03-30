import { ChevronDown } from 'lucide-react'
import Image from 'next/image'
import React, { useCallback, useContext, useEffect } from 'react'
import DummyPrifileImage from "../../public/text-profile-pic.jpg"
import { useAuthContext } from '@/hooks/useAuthContext'

const UserProfile = () => {

  const { user } = useAuthContext()

  return (
    <div className=" text-white/70  w-40  flex items-center  mx-3 rounded-md bg-BUTTON-dark ">
      <div className="flex items-center">
        {/* priofile photo  */}
        <div className="h-10 w-10 overflow-hidden rounded-md m-1">
          <Image alt='test profile image' src={DummyPrifileImage} />
        </div>
        {/* user name  */}
        <span className='text-lg'>{user?.username}</span>
        <ChevronDown size={30} />
      </div>
    </div>
  )
}

export default UserProfile