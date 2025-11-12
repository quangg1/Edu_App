import React, { createContext, useContext, useEffect, useState } from "react";
import { fetchClient } from "../api/fetchClient";
import { logout } from "../utils/tokenUtils"; // vẫn giữ để xóa token local nếu có

interface User {
  id: string;
  name: string;
  fullName:string
  email: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logoutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const API_BASE_URL = "https://gemini.veronlabs.com/bot5";

  // 🔹 Khi app load → kiểm tra người dùng hiện tại
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
          credentials: "include", 
        });

        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error("Auth check failed:", err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // 🔹 Đăng nhập
  const login = async (email: string, password: string) => {
    // Gửi yêu cầu đăng nhập
    const res = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      credentials: "include",
    });
  
    const data = await res.json();
  
    // Nếu login API trả lỗi, dừng lại luôn
    if (!res.ok) {
      throw new Error(data.message || "Đăng nhập thất bại");
    }
  
    // Gọi lại /auth/me để xác thực xem cookie có hợp lệ không
    const meRes = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
      credentials: "include",
    });
  
    if (!meRes.ok) {
      throw new Error("Không xác thực được người dùng sau khi đăng nhập");
    }
  
    const meData = await meRes.json();
    const userData = meData.data;
    if (!userData) {
      throw new Error("Không tìm thấy thông tin người dùng");
    }
  
    setUser(userData.user);
  };

  // 🔹 Đăng xuất
  const logoutUser = async () => {
    try {
      await fetch(`${API_BASE_URL}/api/v1/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      logout(); 
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logoutUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth phải được dùng trong <AuthProvider>");
  return context;
};
