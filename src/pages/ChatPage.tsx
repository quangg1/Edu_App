import { ChatContainer, Chat } from "../components/chat/ChatContainer";
import { ClaudeWelcome } from "../components/chat/ClaudeWelcome";

interface ChatPageProps {
  currentChat: Chat | null;
  onUpdateChat: (chat: Chat) => void;
  onNewChat: () => void;
  onNavigate: (page: "multiple-choice" | "rubric") => void;
}

export function ChatPage({ currentChat, onUpdateChat, onNewChat, onNavigate }: ChatPageProps) {
  const handleWelcomeMessage = () => {
    onNewChat(); 
  };

  return (
    <div className="h-full w-full">
      {currentChat ? (
        <ChatContainer
          currentChat={currentChat}
          onUpdateChat={onUpdateChat}
        />
      ) : (
        <ClaudeWelcome 
          onSendMessage={handleWelcomeMessage} 
          onNavigate={onNavigate}
        />
      )}
    </div>
  );
}
