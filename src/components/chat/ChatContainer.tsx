import { useState, useEffect, useRef } from "react";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { TypingIndicator } from "./TypingIndicator";
import { ScrollArea } from "../ui/scroll-area";

export interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

interface ChatContainerProps {
  currentChat: Chat | null;
  onUpdateChat: (chat: Chat) => void;
}

export function ChatContainer({ currentChat, onUpdateChat }: ChatContainerProps) {
  const [isTyping, setIsTyping] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [currentChat?.messages, isTyping]);

  const handleSendMessage = async (messageText: string) => {
    if (!currentChat) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      isUser: true,
      timestamp: new Date(),
    };
    
    const updatedMessages = [...currentChat.messages, userMessage];
    
    // Update chat title if this is the first user message after initial
    let updatedTitle = currentChat.title;
    if (currentChat.messages.length < 1) {
      updatedTitle = messageText.slice(0, 50) + (messageText.length > 50 ? "..." : "");
    }
    
    const updatedChat: Chat = {
      ...currentChat,
      title: updatedTitle,
      messages: updatedMessages,
      updatedAt: new Date(),
    };
    
    onUpdateChat(updatedChat);
  };

  if (!currentChat) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="max-w-md">
          <h2 className="text-xl mb-4 text-foreground">Welcome to Claude</h2>
          <p className="text-muted-foreground mb-6">
            Start a new conversation from the sidebar to begin.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Messages */}
      <ScrollArea ref={scrollAreaRef} className="flex-1">
        <div className="max-w-3xl mx-auto">
          {currentChat.messages.map((message) => (
            <ChatMessage
              key={message.id}
              message={message.text}
              isUser={message.isUser}
              timestamp={message.timestamp}
            />
          ))}
          {isTyping && <TypingIndicator />}
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="flex-shrink-0 p-6 border-t border-border">
        <div className="max-w-3xl mx-auto">
          <ChatInput onSendMessage={handleSendMessage} disabled={isTyping} />
        </div>
      </div>
    </div>
  );
}
