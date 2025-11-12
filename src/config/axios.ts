// Cấu hình chung cho Axios requests
export const axiosConfig = {
  withCredentials: true,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  },
  timeout: 600000 // 10 phút
};