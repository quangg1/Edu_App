
import { logout } from './tokenUtils'; 

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const API_TIMEOUT = parseInt(import.meta.env.VITE_API_TIMEOUT || '600000');

export const fetchClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true // Quan trọng cho CORS với credentials
});

// Add a request interceptor
fetchClient.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor
fetchClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    if (error.response) {
      // Handle 401 Unauthorized
      if (error.response.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
      // Handle other status codes
      return Promise.reject(error.response.data);
    }
    if (error.code === 'ECONNABORTED') {
      return Promise.reject({
        message: 'Request timeout - Vui lòng thử lại sau'
      });
    }
    return Promise.reject(error);
  }
});

export const fetchClient = async (endpoint, options = {}) => {
    const url = `${API_BASE_URL}${endpoint}`;
    
    // 1. Thực hiện request ban đầu
    let response = await fetch(url, { ...options, credentials: "include" });

    // 2. Kiểm tra nếu là lỗi 401 (Unauthorized)
    if (response.status === 401 && endpoint !== "/api/v1/auth/refreshToken") {
        console.warn("Access Token hết hạn. Đang thử làm mới token...");

        // 3. Gọi API làm mới token
        const refreshRes = await fetch(`${API_BASE_URL}/api/v1/auth/refreshToken`, {
            method: "POST", // Hoặc GET, tùy vào cách bạn thiết lập
            credentials: "include",
            // Lưu ý: Không cần body, nó dùng refreshToken từ cookie
        });

        if (refreshRes.ok) {
            console.log("Token làm mới thành công. Thử lại request ban đầu.");
            
            // 4. Token mới đã được đặt trong Cookie. Thử lại request ban đầu
            response = await fetch(url, { ...options, credentials: "include" });
            
            // Nếu request thử lại vẫn 401, nó sẽ đi tiếp xuống bước 5
            if (response.status !== 401) {
                return response;
            }
        } 
        
        // 5. Nếu làm mới token thất bại (refresh token hết hạn/ko hợp lệ)
        console.error("Làm mới token thất bại. Đăng xuất người dùng.");
        logout(); // Xóa token local và làm sạch trạng thái
        // throw new Error("Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.");
        
        // Trả về 401 để kích hoạt logic đăng xuất của AuthProvider/router
        return new Response(JSON.stringify({ message: "Phiên làm việc đã hết hạn." }), { status: 401, headers: { 'Content-Type': 'application/json' } });

    }
    
    return response;
};