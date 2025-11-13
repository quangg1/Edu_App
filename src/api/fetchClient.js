
import { logout } from './tokenUtils'; 
import { auth } from '../config/firebase';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Helper function to get Firebase ID token
const getFirebaseToken = async () => {
    try {
        const currentUser = auth.currentUser;
        if (currentUser) {
            return await currentUser.getIdToken();
        }
    } catch (error) {
        console.warn('Failed to get Firebase token:', error);
    }
    return null;
};

export const fetchClient = async (endpoint, options = {}) => {
    const url = `${API_BASE_URL}${endpoint}`;
    
    // Get Firebase token if available
    const firebaseToken = await getFirebaseToken();
    
    // Prepare headers
    const headers = {
        ...options.headers,
    };
    
    // Add Firebase token to Authorization header if available
    if (firebaseToken) {
        headers['Authorization'] = `Bearer ${firebaseToken}`;
    }
    
    // 1. Thực hiện request ban đầu
    let response = await fetch(url, { 
        ...options, 
        headers,
        credentials: "include" 
    });

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
            
            // 4. Get fresh Firebase token and retry request
            const freshFirebaseToken = await getFirebaseToken();
            const retryHeaders = {
                ...options.headers,
            };
            if (freshFirebaseToken) {
                retryHeaders['Authorization'] = `Bearer ${freshFirebaseToken}`;
            }
            
            response = await fetch(url, { 
                ...options, 
                headers: retryHeaders,
                credentials: "include" 
            });
            
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