import React from 'react';
import ReactMarkdown from 'react-markdown';
// Plugins cho việc xử lý công thức toán học LaTeX
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

// Import CSS của KaTeX để hiển thị công thức đẹp
// Đảm bảo file này được import ở đâu đó trong dự án (ví dụ: main.tsx hoặc app.tsx)
// import 'katex/dist/katex.min.css'; 

interface MarkdownRendererProps {
  content: string; // Nội dung Markdown hoặc LaTeX
  className?: string;
  inline?: boolean; // Nếu true, nội dung được coi là một phần của dòng (dùng thẻ <span>)
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className, inline = false }) => {
  // Xử lý các trường hợp nội dung null/undefined
  if (!content) return null;

  return (
    <div className={className}>
      <ReactMarkdown
        // Cấu hình các plugin
        remarkPlugins={[remarkMath]} // Xử lý cú pháp $...$ và $$...$$
        rehypePlugins={[rehypeKatex]} // Render LaTeX bằng KaTeX
        
        // Custom component để kiểm soát việc render thẻ <p>
        components={{
          // Nếu `inline` là true (ví dụ: cho hướng dẫn chấm hoặc giải thích ngắn),
          // thay thế thẻ <p> mặc định của Markdown bằng <span> để tránh lỗi layout.
          p: ({ node, ...props }) => {
            if (inline) {
              return <span {...props} className="inline-block" />;
            }
            // Nếu không, render <p> thông thường
            return <p {...props} />;
          },
          // Thêm các custom component khác nếu cần (ví dụ: h1, h2, a)
        }}
      >
        {/*
          Thêm một khoảng trắng trước nội dung để đảm bảo ReactMarkdown
          không gặp lỗi khi nội dung bắt đầu bằng công thức toán học
        */}
        {' ' + content} 
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;