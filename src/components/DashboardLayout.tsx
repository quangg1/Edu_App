import { ReactNode, useState } from "react";
import { BookOpen, FileText, Target, GraduationCap } from "lucide-react";
import { NavLink } from "react-router-dom";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import NotificationsSheet from "../components/NotificationsSheet";
import { Header } from "./components/Header";

interface DashboardLayoutProps {
  children: ReactNode;
}

const navigation = [
  {
    title: "Soạn Giáo Án",
    subtitle: "AI Lesson Planner",
    href: "/lesson-planner",
    icon: BookOpen,
    color: "text-primary",
  },
  {
    title: "Tạo Đề Kiểm Tra",
    subtitle: "AI Test Builder",
    href: "/test-builder",
    icon: FileText,
    color: "text-accent",
  },
  {
    title: "Đánh Giá Rubrics",
    subtitle: "AI Rubric Assessment",
    href: "/rubric-assessment",
    icon: Target,
    color: "text-primary-light",
  },
  {
    title: "Phát Triển Năng Lực",
    subtitle: "Teacher Learning Hub",
    href: "/learning-hub",
    icon: GraduationCap,
    color: "text-accent-light",
  },
];

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: "1",
      type: "lesson" as const,
      title: "Giáo án mới đã được tạo",
      message: "Giáo án 'Phương trình bậc hai' đã được AI tạo thành công",
      timestamp: new Date(Date.now() - 1000 * 60 * 5),
      read: false,
    },
  ]);

  const handleMarkAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((notif) => ({ ...notif, read: true }))
    );
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-foreground">AI Teaching</h1>
            <p className="text-xs text-muted-foreground">Assistant Platform</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            className={({ isActive }) =>
              `flex items-start gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "hover:bg-secondary text-foreground"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className={`w-5 h-5 mt-0.5 ${isActive ? "text-white" : item.color}`} />
                <div className="flex-1 min-w-0">
                  <div className={`font-semibold text-sm ${isActive ? "text-white" : "text-foreground"}`}>
                    {item.title}
                  </div>
                  <div className={`text-xs ${isActive ? "text-white/80" : "text-muted-foreground"}`}>
                    {item.subtitle}
                  </div>
                </div>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-border">
        <div className="px-4 py-3 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20">
          <p className="text-xs font-medium text-primary mb-1">💡 Mẹo sử dụng</p>
          <p className="text-xs text-muted-foreground">
            Kết hợp các module để tạo trải nghiệm học tập hoàn chỉnh
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className="hidden lg:block w-72 border-r border-border bg-card">
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="container max-w-7xl mx-auto p-4 md:p-6 lg:p-8 animate-fade-in">
          {children}
        </div>
      </main>

      {/* Notification sheet (vẫn giữ, nếu Header cần gọi được) */}
      <NotificationsSheet
        open={notificationsOpen}
        onOpenChange={setNotificationsOpen}
        notifications={notifications}
        onMarkAsRead={handleMarkAsRead}
        onMarkAllAsRead={handleMarkAllAsRead}
      />
    </div>
  );
};

export default DashboardLayout;
