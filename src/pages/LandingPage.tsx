import React, { useState } from 'react';
import { BookOpen, FileText, ClipboardCheck, Library, Sparkles, ArrowRight, Users, Award, Zap, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Layout from "../components/Layout"; // Giả định đã có component Layout
import MagicText from '../components/MagicText'
 // Component Layout giả để code chạy được

const LandingPage = () => {
  const [hoveredTool, setHoveredTool] = useState(null);
  const navigate = useNavigate();

  // Dữ liệu mock cho các công cụ AI
  const tools = [
    {
      id: 'test-builder',
      name: 'Tạo Đề Thi',
      icon: FileText,
      description: 'Tạo đề thi và câu hỏi tự động với AI trong vài giây',
      gradient: 'from-blue-500 to-cyan-500',
      features: ['Nhiều dạng câu hỏi', 'Tùy chỉnh độ khó', 'Xuất file Word/PDF'],
      routes: { href: '/test-builder' }
    },
    {
      id: 'lesson-planner',
      name: 'Kế Hoạch Bài Giảng',
      icon: BookOpen,
      description: 'Lập kế hoạch bài giảng chi tiết và hiệu quả theo chuẩn',
      gradient: 'from-purple-500 to-pink-500',
      features: ['Theo chuẩn GDPT', 'Hoạt động đa dạng', 'Tiết kiệm thời gian'],
      routes: { href: '/lesson-planner' }
    },
    {
      id: 'rubric-assessment',
      name: 'Thang Đánh Giá',
      icon: ClipboardCheck,
      description: 'Tạo thang đánh giá và tiêu chí chấm điểm chuyên nghiệp',
      gradient: 'from-orange-500 to-red-500',
      features: ['Rubric chi tiết', 'Tiêu chí rõ ràng', 'Dễ áp dụng'],
      routes: { href: '/rubric-assessment' }
    },
    {
      id: 'learning-hub',
      name: 'Trung Tâm Học Tập',
      icon: Library,
      description: 'Tài nguyên và hoạt động học tập phong phú cho học sinh',
      gradient: 'from-green-500 to-emerald-500',
      features: ['Tài liệu đa dạng', 'Hoạt động tương tác', 'Lộ trình học tập'],
      routes: { href: '/learning-hub' }
    }
  ];

  // Dữ liệu mock cho phần thống kê
  const stats = [
    { icon: Users, value: '10,000+', label: 'Giáo viên tin dùng' },
    { icon: Award, value: '50,000+', label: 'Bài giảng tạo ra' },
    { icon: Zap, value: '90%', label: 'Tiết kiệm thời gian' },
    { icon: Shield, value: '100%', label: 'Miễn phí' }
  ];

  return (
    <Layout>
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Animated Background Elements */}
        {/* Các chấm màu chuyển động (Blob Animation) */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>


        {/* Hero Content */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center max-w-4xl mx-auto">
            {/* Tagline/Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              Công nghệ AI tiên tiến
            </div>
            
            {/* Title with Gradient Text */}
            <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              Trợ lý AI thông minh
              <br />
              {/* Áp dụng component MagicText cho cụm từ "dành cho Giáo viên" */}
              <MagicText text="dành cho Giáo viên" />
            </h2>
            
            {/* Subtitle */}
            <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
              Tiết kiệm thời gian, nâng cao chất lượng giảng dạy với bộ công cụ AI hoàn toàn miễn phí
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => navigate('/onboarding')} // Giả định
                className="group px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-2xl hover:shadow-2xl transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2"
              >
                Bắt đầu ngay
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button 
                onClick={() => window.open('https://www.youtube.com/watch?v=demo-video', '_blank')} // Giả định
                className="px-8 py-4 bg-white text-gray-700 font-semibold rounded-2xl hover:shadow-xl transition-all duration-300 border-2 border-gray-200 hover:border-gray-300"
              >
                Xem demo
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-white rounded-2xl p-6 text-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                {/* Icon Circle */}
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                {/* Value and Label */}
                <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tools Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h3 className="text-4xl font-bold text-gray-900 mb-4">
            Công cụ AI mạnh mẽ
          </h3>
          <p className="text-xl text-gray-600">
            Tất cả những gì bạn cần để giảng dạy hiệu quả hơn
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {tools.map((tool) => {
            const Icon = tool.icon;
            const isHovered = hoveredTool === tool.id;
            
            return (
              <div
                key={tool.id}
                onMouseEnter={() => setHoveredTool(tool.id)}
                onMouseLeave={() => setHoveredTool(null)}
                onClick={() => navigate(tool.routes.href)}
                className={`group relative bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 cursor-pointer border border-transparent hover:border-blue-200 ${
                  isHovered ? 'scale-105' : ''
                }`}
              >
                {/* Gradient Border Effect */}
                <div className={`absolute inset-0 rounded-3xl bg-gradient-to-r ${tool.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500 pointer-events-none`}></div>
                
                {/* Icon with Hover Animation */}
                <div className={`relative w-16 h-16 rounded-2xl bg-gradient-to-br ${tool.gradient} flex items-center justify-center mb-6 transition-transform duration-500 ${
                  isHovered ? 'scale-110 rotate-3' : ''
                }`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>

                {/* Content */}
                <div className="relative">
                  <h4 className="text-2xl font-bold text-gray-900 mb-3">{tool.name}</h4>
                  <p className="text-gray-600 mb-6">{tool.description}</p>

                  {/* Features */}
                  <div className="space-y-2 mb-6">
                    {tool.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm text-gray-700">
                        <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${tool.gradient}`}></div>
                        {feature}
                      </div>
                    ))}
                  </div>

                  {/* CTA Button in Card */}
                  <button
                  // onClick={() => navigate(tool.routes.href)} // Đã chuyển lên div cha
                  className={`w-full py-3 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                      isHovered 
                        ? `bg-gradient-to-r ${tool.gradient} text-white shadow-lg` 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Khám phá ngay
                    <ArrowRight className={`w-5 h-5 transition-transform ${isHovered ? 'translate-x-1' : ''}`} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Features Section (Dark/Contrast Section) */}
      <div className="bg-gradient-to-br from-blue-600 to-purple-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-4xl font-bold mb-4">Tại sao chọn chúng tôi?</h3>
            <p className="text-xl text-blue-100">
              Công nghệ AI giúp bạn làm việc thông minh hơn, không phải vất vả hơn
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: 'Tiết kiệm thời gian',
                description: 'Tạo tài liệu giảng dạy chỉ trong vài phút thay vì hàng giờ',
                icon: Zap
              },
              {
                title: 'Chất lượng cao',
                description: 'Nội dung được tạo bởi AI được đào tạo bài bản và chuyên nghiệp',
                icon: Award
              },
              {
                title: 'Miễn phí 100%',
                description: 'Tất cả tính năng đều miễn phí, không giới hạn số lần sử dụng',
                icon: Shield
              }
            ].map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 hover:bg-white/20 transition-all duration-300 shadow-xl">
                  {/* Feature Icon */}
                  <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center mb-4">
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  {/* Title and Description */}
                  <h4 className="text-xl font-bold mb-3">{feature.title}</h4>
                  <p className="text-blue-100">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* CTA Section (Final) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-12 text-center text-white shadow-2xl">
          <h3 className="text-4xl font-bold mb-4">
            Sẵn sàng trải nghiệm?
          </h3>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Hàng ngàn giáo viên đã tin tưởng và sử dụng. Hãy tham gia cùng chúng tôi ngay hôm nay!
          </p>
          <button 
            onClick={() => navigate('/signup')} // Giả định
            className="px-10 py-4 bg-white text-blue-600 font-bold rounded-2xl hover:shadow-2xl transition-all duration-300 hover:scale-105 inline-flex items-center gap-2"
          >
            Bắt đầu miễn phí
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>


      {/* Custom CSS for Blob Animation */}
      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
    </Layout>
  );
};

export default LandingPage;