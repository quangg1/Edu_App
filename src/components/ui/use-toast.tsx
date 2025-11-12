import * as React from 'react';
import { ToastContext } from './toast'; // Import từ tệp bạn vừa tạo

export const useToast = () => {
  const context = React.useContext(ToastContext);

  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }

  // Định nghĩa hàm toast theo cấu trúc tiêu chuẩn
  // Ví dụ: toast({ title: "Thành công", description: "Job đã hoàn tất" })
  return {
    toast: context.toast,
  };
};