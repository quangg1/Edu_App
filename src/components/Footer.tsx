import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Clock } from 'lucide-react';
import ChaosFooter from './ChaosFooter'; // Có thể để icon social media

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    platform: [
      { name: 'Giới thiệu', href: '/about' },
      { name: 'Các công cụ AI', href: '/tools' },
      { name: 'Hướng dẫn sử dụng', href: '/guides' },
      { name: 'Tin tức AI', href: '/news' },
    ],
    teaching: [
      { name: 'Kế hoạch bài giảng', href: '/lesson-planner' },
      { name: 'Tạo đề thi', href: '/test-builder' },
      { name: 'Thang đánh giá', href: '/rubric-assessment' },
      { name: 'Trung tâm học tập', href: '/learning-hub' },
    ],
    support: [
      { name: 'Hỏi đáp', href: '/faq' },
      { name: 'Liên hệ hỗ trợ', href: '/contact' },
      { name: 'Chính sách bảo mật', href: '/privacy' },
      { name: 'Điều khoản sử dụng', href: '/terms' },
    ]
  };

  return (
    <footer className="relative bg-gradient-to-br from-gray-900 via-gray-950 to-black text-gray-300">
      {/* Decorative gradient overlay */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_left,_var(--tw-gradient-stops))] from-blue-500/30 via-purple-600/30 to-transparent" />

      {/* Main Content */}
      <div className="relative max-w-7xl mx-auto px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
          {/* Platform Info */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <span className="text-white font-bold text-lg">AI</span>
              </div>
              <span className="text-2xl font-extrabold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Teaching Assistant
              </span>
            </div>
            <p className="text-gray-400 leading-relaxed mb-8">
              Cung cấp công cụ AI hỗ trợ giáo viên lập kế hoạch bài giảng, tạo đề thi và đánh giá học sinh một cách thông minh và hiệu quả.
            </p>
            <div className="space-y-4">
              <div className="flex items-center">
                <Phone className="h-5 w-5 mr-3 text-blue-400" />
                <span>0981528064</span>
              </div>
              <div className="flex items-center">
                <Mail className="h-5 w-5 mr-3 text-purple-400" />
                <span>quang.nguyen@veronlabs.com</span>
              </div>
              <div className="flex items-center">
                <MapPin className="h-5 w-5 mr-3 text-green-400" />
                <span>123 Lê Lợi, Quận 1, TP.HCM</span>
              </div>
              <div className="flex items-center">
                <Clock className="h-5 w-5 mr-3 text-pink-400" />
                <span>08:00 - 18:00</span>
              </div>
            </div>
          </div>

          {/* Dynamic Link Sections */}
          {Object.entries(footerLinks).map(([section, links]) => (
            <div key={section}>
              <h3 className="text-lg font-semibold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                {section.charAt(0).toUpperCase() + section.slice(1)}
              </h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.name}>
                    <Link
                      to={link.href}
                      className="text-gray-400 hover:text-white transition-colors duration-200"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Social & Copyright */}
        <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <div className="flex space-x-4 mb-6 md:mb-0">
            <ChaosFooter /> {/* Social media icons */}
          </div>
          <div className="text-gray-500 text-sm">
            © {currentYear} <span className="text-white">AI Teaching Assistant</span>. Tất cả quyền được bảo lưu.
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="relative bg-gray-950/70 backdrop-blur-sm border-t border-gray-800 py-4">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center text-sm text-gray-400">
          <div className="flex flex-wrap justify-center md:justify-start gap-6 mb-3 md:mb-0">
            <Link to="/privacy" className="hover:text-white transition-colors">Chính sách bảo mật</Link>
            <Link to="/terms" className="hover:text-white transition-colors">Điều khoản sử dụng</Link>
            <Link to="/help/cookies" className="hover:text-white transition-colors">Chính sách cookie</Link>
          </div>
          <p className="text-center md:text-right">
            Được phát triển bởi tập đoàn Veron - Hỗ trợ giáo viên tối ưu hóa giảng dạy
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
