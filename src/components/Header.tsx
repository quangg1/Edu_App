import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Sparkles, Bell, User, LogOut } from "lucide-react";
import { Button } from "../components/ui/button";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import NotificationsSheet from "../components/NotificationsSheet";

const Header: React.FC = () => {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const wrapperRef = useRef<HTMLDivElement>(null);

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

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAsRead = (id: string) =>
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );

  const handleMarkAllAsRead = () =>
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

  // ✅ Hàm lấy từ cuối cùng trong fullName
  const getLastName = (fullName?: string) => {
    if (!fullName) return "";
    const parts = fullName.trim().split(" ");
    return parts[parts.length - 1];
  };

  // 🔒 Close dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 🟢 Header khi chưa đăng nhập
  if (!user) {
    return (
      <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-md border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => navigate("/")}
          >
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              AI Teaching Assistant
            </h1>
          </div>

          <div className="flex gap-3">
            <Button onClick={() => navigate("/login")} className="px-5 py-2">
              Đăng nhập
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/register")}
              className="px-5 py-2"
            >
              Đăng ký
            </Button>
          </div>
        </div>
      </header>
    );
  }

  // 🔵 Header khi đã đăng nhập
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-white/70 backdrop-blur-md">
      <div className="flex h-16 items-center px-4 justify-between">
        {/* Logo */}
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => navigate("/")}
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-sm">AI Teaching Assistant</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          {/* Hiển thị tên người dùng */}
          <span className="font-medium text-sm text-gray-800">
            {getLastName(user.fullName)}
          </span>

          <Button
            variant="ghost"
            size="icon"
            className="relative"
            onClick={() => setNotificationsOpen(true)}
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full"></span>
            )}
          </Button>

          {/* Avatar + Dropdown */}
          <div ref={wrapperRef} className="relative">
            <Avatar
              className="h-9 w-9 cursor-pointer hover:ring-2 ring-primary transition-all"
              onClick={() => setDropdownOpen((prev) => !prev)}
            >
              <AvatarFallback className="bg-primary text-primary-foreground">
                {getLastName(user.name)?.[0]?.toUpperCase() || <User className="h-5 w-5" />}
              </AvatarFallback>
            </Avatar>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-40 bg-white border rounded-xl shadow-lg z-50">
                <button
                  onClick={() => navigate("/profile")}
                  className="flex items-center gap-2 px-4 py-2 w-full hover:bg-gray-100"
                >
                  <User size={16} /> Hồ sơ
                </button>
                <button
                  onClick={logoutUser}
                  className="flex items-center gap-2 px-4 py-2 w-full hover:bg-gray-100 text-red-600"
                >
                  <LogOut size={16} /> Đăng xuất
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <NotificationsSheet
        open={notificationsOpen}
        onOpenChange={setNotificationsOpen}
        notifications={notifications}
        onMarkAsRead={handleMarkAsRead}
        onMarkAllAsRead={handleMarkAllAsRead}
      />
    </header>
  );
};

export default Header;
