import React, { useState } from 'react';
import { ChatMessage } from '../types';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Bot, Send, Mic, X } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onClose?: () => void;
  onSendMessage?: (message: string) => void;
  onQuickReply?: (reply: string) => void;
  isLoading?: boolean;
}

export function ChatInterface({ messages, onClose, onSendMessage, onQuickReply, isLoading }: ChatInterfaceProps) {
  const [inputValue, setInputValue] = useState('');
  // removed local isTyping state

  const handleSend = () => {
    if (inputValue.trim() && onSendMessage && !isLoading) {
      onSendMessage(inputValue);
      setInputValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#1F2D3D] rounded-lg shadow-xl border border-gray-200 dark:border-white/10">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-[#1F2D3D] to-[#2EB8A9]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-white">Aegis Agent</h3>
            <p className="text-xs text-white/80">AI Procurement Assistant</p>
          </div>
        </div>
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white hover:bg-white/20"
          >
            <X className="w-5 h-5" />
          </Button>
        )}
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className="space-y-2">
              <div
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${msg.sender === 'user'
                      ? 'bg-[#2EB8A9] text-white'
                      : 'bg-gray-100 text-gray-900'
                    }`}
                >
                  {msg.sender === 'agent' && (
                    <div className="flex items-center gap-2 mb-1">
                      <Bot className="w-4 h-4 text-[#2EB8A9]" />
                      <span className="text-xs text-gray-600">Aegis</span>
                    </div>
                  )}
                  <p className="text-sm">{msg.message}</p>
                  <p
                    className={`text-xs mt-1 ${msg.sender === 'user' ? 'text-white/70' : 'text-gray-500'
                      }`}
                  >
                    {formatTime(msg.timestamp)}
                  </p>
                </div>
              </div>

              {/* Quick replies */}
              {msg.quickReplies && msg.sender === 'agent' && (
                <div className="flex flex-wrap gap-2 ml-2">
                  {msg.quickReplies.map((reply, idx) => (
                    <Button
                      key={idx}
                      variant="outline"
                      size="sm"
                      onClick={() => onQuickReply?.(reply)}
                      className="text-xs hover:bg-[#2EB8A9] hover:text-white hover:border-[#2EB8A9]"
                    >
                      {reply}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Typing indicator */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <Bot className="w-4 h-4 text-[#2EB8A9]" />
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: '0.2s' }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: '0.4s' }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex gap-2">
          <Textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Aegis anything..."
            className="resize-none"
            rows={1}
          />
          <div className="flex flex-col gap-2">
            <Button
              size="icon"
              onClick={handleSend}
              disabled={!inputValue.trim() || isLoading}
              className={`bg-[#2EB8A9] hover:bg-[#2EB8A9]/90 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Send className="w-4 h-4" />
            </Button>
            <Button size="icon" variant="outline">
              <Mic className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
