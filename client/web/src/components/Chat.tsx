import { Send } from 'lucide-react'
import React from 'react'

const SenderMessage = ({ message }: { message: string }) => {
  return (
    <div className="w-full flex justify-start">
      <div className="text-white/80 text-lg text-left w-max p-2 bg-[#272A30] rounded-b-2xl rounded-tr-2xl">{message}</div>
    </div>
  )
}

const ReceiverMessage = ({ message }: { message: string }) => {
  return (
    <div className="w-full flex justify-end">
      <div className="text-white/80 text-lg text-right w-max p-2 bg-[#272A30] rounded-b-2xl rounded-tl-2xl bg-gradient-to-r from-[#7143E2] to-[#A348DF]">{message}</div>
    </div>
  )
}

const Chat = () => {
  return (
    <div className="frost-blur relative flex flex-col items-center select-none w-full h-[24rem]">
      {/* Header */}
      <div className="absolute w-full items-center flex h-16 rounded-t-2xl backdrop-blur-lg">
        <span className="text-white/80 pl-5 text-4xl font-rochester">Chat</span>
      </div>

      {/* Chat messages container */}
      <div className="w-full flex-grow px-4 overflow-y-auto gap-2 flex flex-col pt-16 pb-16">
        <SenderMessage message="Hello sup, this is Ron" />
        <ReceiverMessage message="Ha bol bhai" />
        <ReceiverMessage message="Hello, what are you up to?" />
        <SenderMessage message="Just chilling, how about you?" />
        <ReceiverMessage message="Same here, nothing much." />
        <SenderMessage message="Cool. Let me know if you want to hang out later." />
        <ReceiverMessage message="Sure, will do." />
        <SenderMessage message="Cool. Let me know if you want to hang out later." />
        <SenderMessage message="Hello sup, this is Ron" />
        <ReceiverMessage message="Ha bol bhai" />
        <ReceiverMessage message="Hello, what are you up to?" />
        <SenderMessage message="Just chilling, how about you?" />
        <ReceiverMessage message="Same here, nothing much." />
        <SenderMessage message="Cool. Let me know if you want to hang out later." />
        <ReceiverMessage message="Sure, will do." />
        <SenderMessage message="Cool. Let me know if you want to hang out later." />
      </div>

      {/* Input area */}
      <div className="w-full h-14 flex px-5 justify-between mt-auto mb-2">
        <input
          className="flex-grow rounded-xl bg-transparent border px-3 text-white/80 text-xl"
          placeholder="Type a message..."
          type="text"
        />
        <button className="ml-3 text-white/80 py-1 px-2 flex justify-center items-center rounded-xl bg-gradient-to-tr from-[#7143E2] to-[#A348DF]">
          <Send size={35} />
        </button>
      </div>
    </div>
  )
}

export default Chat
