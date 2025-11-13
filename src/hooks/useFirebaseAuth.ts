import { 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { auth, googleProvider, facebookProvider } from '../config/firebase';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/**
 * Hook để sử dụng Firebase Authentication
 */
export const useFirebaseAuth = () => {
  /**
   * Đăng nhập với Google
   */
  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();
      
      // Gửi token lên backend để verify và sync với MongoDB
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/verify-firebase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ idToken })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Xác thực thất bại');
      }

      return data;
    } catch (error: any) {
      console.error('Lỗi đăng nhập Google:', error);
      throw error;
    }
  };

  /**
   * Đăng nhập với Facebook
   */
  const signInWithFacebook = async () => {
    try {
      const result = await signInWithPopup(auth, facebookProvider);
      const idToken = await result.user.getIdToken();
      
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/verify-firebase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ idToken })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Xác thực thất bại');
      }

      return data;
    } catch (error: any) {
      console.error('Lỗi đăng nhập Facebook:', error);
      throw error;
    }
  };


  /**
   * Đăng nhập với email/password
   */
  const signInWithEmail = async (email: string, password: string) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await result.user.getIdToken();
      
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/verify-firebase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ idToken })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Xác thực thất bại');
      }

      return data;
    } catch (error: any) {
      console.error('Lỗi đăng nhập email:', error);
      throw error;
    }
  };

  /**
   * Đăng ký với email/password
   */
  const signUpWithEmail = async (email: string, password: string) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const idToken = await result.user.getIdToken();
      
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/verify-firebase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ idToken })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Đăng ký thất bại');
      }

      return data;
    } catch (error: any) {
      console.error('Lỗi đăng ký email:', error);
      throw error;
    }
  };

  /**
   * Đăng xuất
   */
  const logout = async () => {
    try {
      await signOut(auth);
      
      // Gọi logout endpoint của backend
      await fetch(`${API_BASE_URL}/api/v1/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Lỗi đăng xuất:', error);
      throw error;
    }
  };

  /**
   * Lắng nghe thay đổi trạng thái auth
   */
  const onAuthStateChange = (callback: (user: FirebaseUser | null) => void) => {
    return onAuthStateChanged(auth, callback);
  };

  return {
    signInWithGoogle,
    signInWithFacebook,
    signInWithEmail,
    signUpWithEmail,
    logout,
    onAuthStateChange
  };
};

