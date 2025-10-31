import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import {
  User,
  Mail,
  Lock,
  Trash2,
  Award,
  FileText,
  BookOpen,
  ClipboardCheck,
  Zap, // Thêm icon cho mục sử dụng
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Avatar, AvatarFallback } from '../components/ui/avatar';

// --- Helper Functions ---

// 1. Hàm format số (vd: 1500 -> 1,500)
const formatTokens = (tokens: number) => {
  return new Intl.NumberFormat('vi-VN').format(tokens);
};

// 2. Hàm format thời gian (vd: 5 phút trước)
const formatTimeAgo = (date: Date): string => {
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  let interval = seconds / 31536000; // Năm
  if (interval > 1) return Math.floor(interval) + " năm trước";
  interval = seconds / 2592000; // Tháng
  if (interval > 1) return Math.floor(interval) + " tháng trước";
  interval = seconds / 86400; // Ngày
  if (interval > 1) return Math.floor(interval) + " ngày trước";
  interval = seconds / 3600; // Giờ
  if (interval > 1) return Math.floor(interval) + " giờ trước";
  interval = seconds / 60; // Phút
  if (interval > 1) return Math.floor(interval) + " phút trước";
  return "vài giây trước";
};

// 3. Hàm lấy icon dựa trên tên feature
const getFeatureIcon = (feature: string) => {
  switch (feature) {
    case 'Tạo Đề Thi':
      return <FileText className="w-5 h-5 text-blue-600" />;
    case 'Kế Hoạch Bài Giảng':
      return <BookOpen className="w-5 h-5 text-purple-600" />;
    case 'Thang Đánh Giá':
      return <ClipboardCheck className="w-5 h-5 text-orange-600" />;
    default:
      return <Zap className="w-5 h-5 text-gray-500" />;
  }
};

// --- Mock Data Interface (Dựa trên schema của bạn) ---
interface IAIUsage {
  _id: string;
  feature: string;
  model: string;
  tokensUsed: number;
  createdAt: Date;
}

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  
  // State để lưu trữ dữ liệu sử dụng
  const [usageHistory, setUsageHistory] = useState<IAIUsage[]>([]);
  const [totalTokens, setTotalTokens] = useState(0);

  // Giả định giới hạn token cho gói miễn phí để vẽ thanh progress
  const FREE_TIER_TOKEN_LIMIT = 50000;

  // --- Fetch Mock Data ---
  useEffect(() => {
    // Đây là nơi bạn sẽ gọi API để lấy `aiUsageSchema`
    // Hiện tại, chúng ta sẽ dùng dữ liệu giả
    const mockData: IAIUsage[] = [
      {
        _id: '1',
        feature: 'Tạo Đề Thi',
        model: 'gpt-4o',
        tokensUsed: 1520,
        createdAt: new Date(Date.now() - 1000 * 60 * 5), // 5 phút trước
      },
      {
        _id: '2',
        feature: 'Kế Hoạch Bài Giảng',
        model: 'gemini-1.5-pro',
        tokensUsed: 850,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3), // 3 giờ trước
      },
      {
        _id: '3',
        feature: 'Thang Đánh Giá',
        model: 'gpt-3.5-turbo',
        tokensUsed: 430,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 ngày trước
      },
      {
        _id: '4',
        feature: 'Tạo Đề Thi',
        model: 'gpt-4o',
        tokensUsed: 2100,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 28), // 28 giờ trước
      },
    ];

    const total = mockData.reduce((acc, item) => acc + item.tokensUsed, 0);
    
    setUsageHistory(mockData);
    setTotalTokens(total);
  }, []);
  // --- Hết phần Mock Data ---

  const getInitials = (fullName?: string) => {
    if (!fullName) return <User className="h-10 w-10" />;
    const parts = fullName.trim().split(" ");
    const first = parts[0]?.[0] || "";
    const last = parts.length > 1 ? parts[parts.length - 1]?.[0] : "";
    return (first + last).toUpperCase();
  };

  if (!user) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          Đang tải thông tin...
        </div>
      </Layout>
    );
  }

  const usagePercentage = (totalTokens / FREE_TIER_TOKEN_LIMIT) * 100;

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Tài khoản
          </h1>

          <div className="space-y-8">

            {/* === Card 1: Thông tin Hồ sơ === (Giữ nguyên) */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="p-6">
                <div className="flex flex-col sm:flex-row items-center gap-5">
                  <Avatar className="h-24 w-24 text-4xl">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white font-semibold">
                      {getInitials(user.fullName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-center sm:text-left">
                    <h2 className="text-2xl font-bold text-gray-900">{user.fullName}</h2>
                    <p className="text-gray-600 flex items-center justify-center sm:justify-start gap-2 mt-1">
                      <Mail className="w-4 h-4 text-gray-500" />
                      {user.email}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-6 py-4 border-t flex justify-end">
                <Button variant="outline">Chỉnh sửa hồ sơ</Button>
              </div>
            </div>

            {/* === Card 2: Gói Đăng Ký === (Giữ nguyên) */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Gói của bạn</h3>
                <div className="flex items-center justify-between p-5 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center shadow-lg">
                      <Award className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <span className="text-lg font-bold text-gray-900">Gói Miễn Phí</span>
                      <p className="text-sm text-gray-600">Truy cập tất cả công cụ AI không giới hạn.</p>
                    </div>
                  </div>
                  <span className="text-lg font-bold text-blue-600">Miễn phí</span>
                </div>
              </div>
            </div>

            {/* === Card 3: Sử dụng AI (MỚI - Inspired by Cursor) === */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Sử dụng AI</h3>
                <p className="text-sm text-gray-500 mb-5">
                  Gói miễn phí của bạn làm mới vào ngày 1 hàng tháng.
                </p>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Sử dụng trong tháng</span>
                    <span className="text-sm font-medium text-gray-700">
                      <span className="font-bold text-gray-900">{formatTokens(totalTokens)}</span>
                      {' / '}
                      {formatTokens(FREE_TIER_TOKEN_LIMIT)} tokens
                    </span>
                  </div>
                  {/* Thanh Progress */}
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-blue-600 h-2.5 rounded-full"
                      style={{ width: `${usagePercentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* === Card 4: Lịch sử sử dụng (MỚI - Dựa trên Schema) === */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-5">Lịch sử sử dụng</h3>
                <div className="flow-root">
                  <ul role="list" className="-mb-4">
                    {usageHistory.map((item, index) => (
                      <li key={item._id} className="pb-4">
                        <div className="relative flex items-center space-x-4">
                          {/* Icon */}
                          <div className="relative px-1">
                            {getFeatureIcon(item.feature)}
                          </div>
                          
                          {/* Dấu gạch nối giữa các mục (trừ mục cuối) */}
                          {index !== usageHistory.length - 1 && (
                            <div className="absolute left-3.5 top-8 -bottom-4 w-px bg-gray-200"></div>
                          )}

                          {/* Nội dung log */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {item.feature}
                            </p>
                            <p className="text-sm text-gray-500">
                              Model: {item.model}
                            </p>
                          </div>
                          
                          {/* Thời gian và Token */}
                          <div className="text-right flex-shrink-0">
                            <p className="text-sm font-semibold text-gray-900">
                              {formatTokens(item.tokensUsed)} tokens
                            </p>
                            <p className="text-sm text-gray-500">
                              {formatTimeAgo(item.createdAt)}
                            </p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              {/* Footer (tùy chọn) */}
              <div className="bg-gray-50 px-6 py-4 border-t text-center">
                <Button variant="link" className="text-sm text-blue-600">
                  Xem toàn bộ lịch sử
                </Button>
              </div>
            </div>
            
            {/* === Card 5: Bảo mật === (Giữ nguyên) */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-5">Bảo mật</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-800">Đổi mật khẩu</p>
                    <p className="text-sm text-gray-500">Nên cập nhật mật khẩu định kỳ để tăng cường bảo mật.</p>
                  </div>
                  <Button variant="outline">
                    <Lock className="w-4 h-4 mr-2" />
                    Đổi mật khẩu
                  </Button>
                </div>
              </div>
            </div>
            
            {/* === Card 6: Vùng nguy hiểm === (Giữ nguyên) */}
            <div className="bg-white rounded-2xl shadow-lg border-2 border-red-100">
              <div className="p-6">
                <h3 className="text-xl font-semibold text-red-700 mb-4">Vùng nguy hiểm</h3>
                  <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-800">Xóa tài khoản</p>
                    <p className="text-sm text-gray-500">Hành động này không thể hoàn tác. Toàn bộ dữ liệu của bạn sẽ bị xóa vĩnh viễn.</p>
                  </div>
                  <Button variant="destructive">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Xóa tài khoản
                  </Button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ProfilePage;