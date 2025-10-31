import { User, Bot } from "lucide-react";
import { memo } from "react";

interface ChatMessageProps {
  message: string;
  isUser: boolean;
  timestamp: Date;
}

function ChatMessageComponent({ message, isUser, timestamp }: ChatMessageProps) {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`flex items-start gap-4 p-4 ${isUser ? "justify-end" : ""}`}>
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
          <Bot className="h-5 w-5 text-secondary-foreground" />
        </div>
      )}
      <div
        className={`max-w-[75%] rounded-lg p-3 ${
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground"
        }`}
      >
        <p className="text-sm">{message}</p>
        <p className={`text-xs mt-1 ${isUser ? "text-primary-foreground/70" : "text-muted-foreground/70"}`}>
          {formatTime(timestamp)}
        </p>
      </div>
      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
          <User className="h-5 w-5 text-primary-foreground" />
        </div>
      )}
    </div>
  );
}

export const ChatMessage = memo(ChatMessageComponent);
