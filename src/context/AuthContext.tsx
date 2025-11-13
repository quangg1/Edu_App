import React, { createContext, useContext, useEffect, useState } from "react";
import { fetchClient } from "../api/fetchClient";
import { logout } from "../utils/tokenUtils";
import { useFirebaseAuth } from "../hooks/useFirebaseAuth";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../config/firebase";

interface User {
  id: string;
  name: string;
  fullName: string;
  email: string;
  avatar?: string;
  authProvider?: string;
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
  const firebaseAuth = useFirebaseAuth();

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ;

  // 🔹 Lắng nghe thay đổi Firebase auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Nếu có Firebase user, verify với backend
        try {
          const idToken = await firebaseUser.getIdToken();
          const response = await fetch(`${API_BASE_URL}/api/v1/auth/verify-firebase`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ idToken })
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success && data.user) {
              const userData = {
                id: data.user._id,
                name: data.user.userName || data.user.fullName || firebaseUser.displayName || '',
                fullName: data.user.userName || data.user.fullName || firebaseUser.displayName || '',
                email: data.user.email || firebaseUser.email || '',
                avatar: data.user.avatar || firebaseUser.photoURL,
                authProvider: data.user.authProvider
              };
              console.log('✅ Firebase auth sync successful:', userData);
              setUser(userData);
            } else {
              console.warn('⚠️ Firebase verify response missing user data:', data);
              setUser(null);
            }
          } else {
            const errorData = await response.json().catch(() => ({}));
            console.error('❌ Firebase verify failed:', response.status, errorData);
            setUser(null);
          }
        } catch (error) {
          console.error("❌ Firebase auth sync failed:", error);
          setUser(null);
        }
      } else {
        // Nếu không có Firebase user, kiểm tra JWT token
        try {
          const res = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
            credentials: "include", 
          });

          if (res.ok) {
            const data = await res.json();
            if (data.data && data.data.user) {
              const userData = {
                id: data.data.user._id || data.data.user.id,
                name: data.data.user.fullName || data.data.user.name || data.data.user.userName || '',
                fullName: data.data.user.fullName || data.data.user.name || data.data.user.userName || '',
                email: data.data.user.email || '',
                avatar: data.data.user.avatar
              };
              console.log('✅ JWT auth check successful:', userData);
              setUser(userData);
            } else {
              setUser(null);
            }
          } else {
            setUser(null);
          }
        } catch (err) {
          console.error("❌ Auth check failed:", err);
          setUser(null);
        }
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
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
      // Logout từ Firebase nếu đang dùng Firebase auth
      if (user?.authProvider && user.authProvider !== 'email') {
        await firebaseAuth.logout();
      }
      
      // Logout từ backend
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
