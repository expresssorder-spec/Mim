import React, { useRef, useEffect, useState } from 'react';
import { Message } from '../types';
import { Send, Bot, Video, Phone, MoreVertical } from 'lucide-react';

interface ChatSimulatorProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  isTyping: boolean;
  isConnected: boolean;
}

export const ChatSimulator: React.FC<ChatSimulatorProps> = ({ messages, onSendMessage, isTyping, isConnected }) => {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim() || !isConnected) return;
    onSendMessage(inputText);
    setInputText('');
  };

  return (
    <div className="flex flex-col h-[700px] w-full max-w-md mx-auto bg-gray-100 rounded-[3rem] border-8 border-gray-800 shadow-2xl overflow-hidden relative">
      {/* Phone Notch/Header */}
      <div className={`text-white p-4 pt-8 flex items-center justify-between shadow-md z-10 transition-colors duration-300 ${isConnected ? 'bg-[#075E54]' : 'bg-gray-600'}`}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <Bot size={20} />
          </div>
          <div>
            <h3 className="font-bold text-sm leading-tight">My Store Bot</h3>
            <p className="text-[10px] opacity-80 flex items-center gap-1">
              {isConnected ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block"></span>
                  Online
                </>
              ) : (
                'Offline'
              )}
            </p>
          </div>
        </div>
        <div className="flex gap-4">
            <Video size={18} />
            <Phone size={18} />
            <MoreVertical size={18} />
        </div>
      </div>

      {/* Chat Area */}
      <div 
        className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#e5ddd5]"
        style={{ backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")', opacity: 0.95 }}
      >
        <div className="text-center text-xs text-gray-500 my-4 bg-[#e1f3fb] inline-block mx-auto px-2 py-1 rounded shadow-sm">
          Messages are end-to-end encrypted. No one outside of this chat, not even WhatsApp, can read or listen to them.
        </div>

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] px-3 py-2 rounded-lg text-sm shadow-sm relative ${
                msg.sender === 'user'
                  ? 'bg-[#dcf8c6] text-gray-800 rounded-tr-none'
                  : 'bg-white text-gray-800 rounded-tl-none'
              }`}
            >
              {msg.isAiGenerated && (
                <span className="absolute -top-2 -left-2 text-[10px] bg-indigo-100 text-indigo-700 px-1 rounded border border-indigo-200">
                    AI
                </span>
              )}
              <p className="whitespace-pre-wrap">{msg.text}</p>
              <p className="text-[10px] text-gray-400 text-right mt-1">
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white px-4 py-3 rounded-lg rounded-tl-none shadow-sm flex gap-1 items-center">
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></span>
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSend} className="bg-[#f0f0f0] p-2 flex items-center gap-2 relative">
        {!isConnected && (
            <div className="absolute inset-0 bg-gray-200/60 z-20 backdrop-blur-[1px] flex items-center justify-center text-xs text-gray-600 font-medium cursor-not-allowed">
                Bot is disconnected
            </div>
        )}
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type a message..."
          disabled={!isConnected}
          className="flex-1 py-2 px-4 rounded-full border-none focus:ring-0 focus:outline-none bg-white shadow-sm text-sm disabled:opacity-50"
        />
        <button
          type="submit"
          className={`p-2 rounded-full shadow-md transition-colors ${isConnected ? 'bg-[#00897b] text-white hover:bg-[#007c6f]' : 'bg-gray-400 text-gray-200'}`}
          disabled={!inputText.trim() || !isConnected}
        >
          <Send size={18} />
        </button>
      </form>

      {/* Home Indicator */}
      <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1/3 h-1 bg-gray-300 rounded-full"></div>
    </div>
  );
};