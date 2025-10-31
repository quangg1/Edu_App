import React from 'react';
import 'katex/dist/katex.min.css';
import { InlineMath } from 'react-katex';

interface LatexRendererProps {
  text?: string;
}

const LatexRenderer: React.FC<LatexRendererProps> = ({ text }) => {
  if (!text) return null;

  // 🧩 1️⃣ Chuẩn hóa: thêm "\" cho các lệnh LaTeX bị thiếu
  const normalizeLatex = (input: string) => {
    return input
      .replace(/(^|[^\\])frac/g, '$1\\frac') // thêm "\" trước frac nếu thiếu
      .replace(/(^|[^\\])sqrt/g, '$1\\sqrt') // nếu có căn bậc hai
      .replace(/(^|[^\\])(pi|theta|alpha|beta|times|div)/g, '$1\\$2'); // ký hiệu toán phổ biến
  };

  // 🧩 2️⃣ Xử lý từng phần $...$
  const parts = text.split(/(\$.*?\$)/g).map((part, index) => {
    if (part.startsWith('$') && part.endsWith('$')) {
      const mathContent = part.slice(1, -1);
      const normalized = normalizeLatex(mathContent);
      return <InlineMath key={index}>{normalized}</InlineMath>;
    }
    return part;
  });

  return <p className="inline">{parts}</p>;
};

export default LatexRenderer;
