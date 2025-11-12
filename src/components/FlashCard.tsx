import React, { useState, useRef, useEffect } from "react"; 
import LatexRenderer from "./LatexRenderer";

interface FlashcardProps {
  questionData: {
    questionText: string;
    questionType: string;
    options?: Record<string, string>;
    correctAnswer?: string;
    explanation?: string;
    [key: string]: unknown;
  };
  index: number;
}

const Flashcard: React.FC<FlashcardProps> = ({ questionData, index }) => {
    const [flipped, setFlipped] = useState(false);
    const [maxHeight, setMaxHeight] = useState<number | null>(null); // Đổi tên state
    const frontRef = useRef<HTMLDivElement>(null); 
    const backRef = useRef<HTMLDivElement>(null); // THÊM: Ref cho mặt sau
    const q = questionData || {};
  
    const options = q.options && Object.keys(q.options).length ? q.options : null;
    const questionText = q.questionText || "N/A";
    const correct = q.correctAnswer || "Chưa có đáp án";
    const explanation = q.explanation || "";

    // Effect để đo chiều cao của cả hai mặt và lấy chiều cao lớn nhất
    useEffect(() => {
        if (frontRef.current && backRef.current) {
            // Đảm bảo nội dung được hiển thị hoàn toàn khi đo
            const frontHeight = frontRef.current.scrollHeight;
            const backHeight = backRef.current.scrollHeight;

            // Lấy chiều cao lớn nhất của mặt trước và mặt sau
            setMaxHeight(Math.max(frontHeight, backHeight)); 
        }
    // Cập nhật khi nội dung mặt trước hoặc mặt sau thay đổi
    }, [questionData.question, questionData.options, questionData.explanation, questionData.correct_answer, index]);
  
    return (
      <div
        // Áp dụng chiều cao lớn nhất và đảm bảo thẻ không quá nhỏ
        className="relative w-full cursor-pointer perspective mb-4 overflow-visible" 
        style={{ height: maxHeight ? `${maxHeight}px` : 'auto', minHeight: '150px' }} 
        onClick={() => setFlipped(!flipped)}
      >
        <div
          className={`relative w-full h-full transition-all duration-500 [transform-style:preserve-3d] ${
            flipped ? "[transform:rotateY(180deg)]" : ""
          }`}
        >
          {/* Mặt trước */}
          <div 
            ref={frontRef} 
            className="absolute w-full h-full bg-white border border-gray-200 rounded-lg p-3 shadow-sm [backface-visibility:hidden] overflow-hidden" 
          >
            <div className="mb-2">
              <strong className="text-primary">{index + 1}. </strong>
              <LatexRenderer text={questionText} />
            </div>
  
            {q.questionType === "multiple-choice" && options && (
              <ul className="pl-6 list-disc text-sm mt-2">
                {Object.entries(options).map(([key, value]) => (
                  <li key={key} className="mt-1">
                    <span className="font-medium">{key}.</span>{" "}
                    <LatexRenderer text={value || ""} />
                  </li>
                ))}
              </ul>
            )}
  
            <p className="text-xs italic text-gray-500 mt-2 text-center">
              👉 Nhấn để xem đáp án
            </p>
          </div>
  
          {/* Mặt sau */}
          <div 
            ref={backRef} // THÊM: Ref cho mặt sau
            // THÊM: overflow-y-auto để cho phép cuộn nội bộ nếu maxHeight không đủ
            className="absolute w-full h-full bg-blue-50 border border-blue-300 rounded-lg p-3 shadow-sm [transform:rotateY(180deg)] [backface-visibility:hidden] overflow-y-auto"
          >
            {q.questionType === "multiple-choice" && (
              <div className="text-sm mb-2">
                <strong>Đáp án đúng:</strong>{" "}
                <span className="text-green-600 font-semibold">{correct}</span>
              </div>
            )}
  
            {q.questionType === "essay" && (
              <div className="mt-2 text-sm">
                <strong>Đáp án gợi ý:</strong>
                {/* THÊM: max-h-[150px] và overflow-y-auto để cuộn nội dung Essay dài */}
                <div className="mt-1 p-2 bg-white rounded border max-h-[150px] overflow-y-auto"> 
                  <LatexRenderer text={correct} />
                </div>
              </div>
            )}
  
            {explanation && (
              <div className="mt-2 text-xs text-gray-700">
                <strong>Giải thích:</strong> <LatexRenderer text={explanation} />
              </div>
            )}
  
            <p className="text-xs italic text-gray-500 mt-2 text-center">
              🔄 Nhấn để quay lại câu hỏi
            </p>
          </div>
        </div>
      </div>
    );
  };

export default Flashcard;