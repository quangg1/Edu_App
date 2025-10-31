import { Home, ListChecks, Presentation, MessageSquare, Plus } from "lucide-react";
import { Chat } from "./chat/ChatContainer";

type Page = "home" | "multiple-choice" | "presentation" | "chat";

interface NavigationProps {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
  chatHistory: Chat[];
  currentChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onNewChat: () => void;
}

export default function Navigation({ currentPage, setCurrentPage, chatHistory, currentChatId, onSelectChat, onNewChat }: NavigationProps) {
  return (
    <aside className="flex flex-col w-64 h-screen px-4 py-8 overflow-y-auto bg-white border-r rtl:border-r-0 rtl:border-l dark:bg-gray-800 dark:border-gray-700">
      <a href="#" className="mx-auto">
        <div className="flex items-center">
            <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">AI Teacher Tools</span>
        </div>
      </a>

      <div className="flex flex-col justify-between flex-1 mt-6">
        <nav className="-mx-3 space-y-6 ">
          <div className="space-y-3 ">
            <label className="px-3 text-xs text-gray-500 uppercase dark:text-gray-400">Tools</label>
            <button
              onClick={() => setCurrentPage("home")}
              className={`flex items-center w-full px-3 py-2 text-gray-600 transition-colors duration-300 transform rounded-lg dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-gray-200 hover:text-gray-700 ${currentPage === 'home' ? 'bg-gray-100 dark:bg-gray-800' : ''}`}
            >
              <Home className="w-5 h-5" />
              <span className="mx-2 text-sm font-medium">Home</span>
            </button>
            <button
              onClick={() => setCurrentPage("multiple-choice")}
              className={`flex items-center w-full px-3 py-2 text-gray-600 transition-colors duration-300 transform rounded-lg dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-gray-200 hover:text-gray-700 ${currentPage === 'multiple-choice' ? 'bg-gray-100 dark:bg-gray-800' : ''}`}
            >
              <ListChecks className="w-5 h-5" />
              <span className="mx-2 text-sm font-medium">Multiple Choice</span>
            </button>
            <button
              onClick={() => setCurrentPage("presentation")}
              className={`flex items-center w-full px-3 py-2 text-gray-600 transition-colors duration-300 transform rounded-lg dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-gray-200 hover:text-gray-700 ${currentPage === 'presentation' ? 'bg-gray-100 dark:bg-gray-800' : ''}`}
            >
              <Presentation className="w-5 h-5" />
              <span className="mx-2 text-sm font-medium">Presentation Generator</span>
            </button>
          </div>

          <div className="space-y-3 ">
            <label className="px-3 text-xs text-gray-500 uppercase dark:text-gray-400">General Chat</label>
            <button
              onClick={onNewChat}
              className="flex items-center w-full px-3 py-2 text-gray-600 transition-colors duration-300 transform rounded-lg dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-gray-200 hover:text-gray-700"
            >
              <Plus className="w-5 h-5" />
              <span className="mx-2 text-sm font-medium">New Chat</span>
            </button>
            <div className="max-h-48 overflow-y-auto">
              {chatHistory.map(chat => (
                <button
                  key={chat.id}
                  onClick={() => onSelectChat(chat.id)}
                  className={`flex items-center w-full px-3 py-2 text-gray-600 transition-colors duration-300 transform rounded-lg dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-gray-200 hover:text-gray-700 ${currentChatId === chat.id ? 'bg-gray-100 dark:bg-gray-800' : ''}`}
                >
                  <MessageSquare className="w-5 h-5" />
                  <span className="mx-2 text-sm font-medium truncate">{chat.title}</span>
                </button>
              ))}
            </div>
          </div>
        </nav>
      </div>
    </aside>
  );
}
