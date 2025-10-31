// tokenUtils.js hoặc tokenUtils.ts

// 1. Nếu bạn lưu Access Token trong Local Storage (Ít an toàn hơn, nhưng dễ quản lý hơn cookie)
export const setToken = (token) => {
    localStorage.setItem('accessToken', token);
};

export const getToken = () => {
    return localStorage.getItem('accessToken');
};

// 2. Hàm quan trọng nhất được dùng trong AuthProvider
export const logout = () => {

    localStorage.removeItem('accessToken');


    localStorage.removeItem('user_info'); 

    window.location.href = '/'; 
};
// 3. Các hàm liên quan khác (tùy chọn)
export const isTokenExpired = (token) => {

    return false; // Phổ biến là để Backend xử lý
};