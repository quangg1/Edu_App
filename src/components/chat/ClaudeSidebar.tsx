import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";
import { Sidebar, SidebarContent, SidebarHeader, SidebarFooter } from "../ui/sidebar";
import { 
  Plus, 
  MessageSquare, 
  Clock,
  ChevronDown,
  User
} from "lucide-react";

export interface ChatHistory {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
  messageCount: number;
}

interface ClaudeSidebarProps {
  chatHistory: ChatHistory[];
  currentChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onNewChat: () => void;
}

export function ClaudeSidebar({ 
  chatHistory, 
  currentChatId, 
  onSelectChat, 
  onNewChat, 
}: ClaudeSidebarProps) {

  return (
    <Sidebar className="border-r border-sidebar-border">
      <SidebarHeader className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 bg-orange-500 rounded flex items-center justify-center">
            <span className="text-white text-xs font-medium">C</span>
          </div>
          <h1 className="text-lg font-medium text-sidebar-foreground">Claude</h1>
        </div>
        
        <Button 
          onClick={onNewChat} 
          className="w-full justify-start bg-sidebar-accent hover:bg-sidebar-accent/80 text-sidebar-foreground border border-sidebar-border" 
          size="sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          New chat
        </Button>
      </SidebarHeader>

      <SidebarContent className="p-0">
        <ScrollArea className="flex-1">
          <div className="p-2">
            {/* Navigation sections */}
            <div className="space-y-1 mb-4">
              <Button
                variant="ghost"
                className="w-full justify-start h-8 px-2 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Chats
              </Button>
            </div>

            {/* Recents section */}
            <div>
              <div className="flex items-center gap-2 px-2 py-1 text-xs font-medium text-sidebar-foreground/70 uppercase tracking-wider">
                <Clock className="h-3 w-3" />
                Recents
              </div>
              <div className="space-y-1 mt-2">
                {chatHistory.map((chat) => (
                  <button
                    key={chat.id}
                    className={`w-full text-left px-2 py-1.5 text-sm rounded-md truncate ${
                      currentChatId === chat.id
                        ? "bg-sidebar-accent text-sidebar-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-accent"
                    }`}
                    onClick={() => onSelectChat(chat.id)}
                  >
                    {chat.title}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
            <User className="h-4 w-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground">Esmondrio</p>
            <p className="text-xs text-sidebar-foreground/70">Pro plan</p>
          </div>
          <ChevronDown className="h-4 w-4 text-sidebar-foreground/70" />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
