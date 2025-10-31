import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
} from "../components/ui/dialog";

import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "../components/ui/select";
import { Textarea } from "../components/ui/textarea";
import {
  Download,
  Loader2,
  FileText,
  Upload,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  FileUp,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import Flashcard from "./FlashCard";

// Types
type Question = {
  question?: string;
  options?: Record<string, string>;
  type?: string;
  correct_answer?: string;
  explanation?: string;
  [key: string]: unknown;
};

type QuizResult = {
  name?: string | null;
  subject?: string | null;
  grade?: string | number;
  num_questions?: number | null;
  time_limit?: number | null;
  difficulty?: string | null;
  duration?: string | null;
  questions?: Question[];
  download_url?: string | null;
  [key: string]: unknown;
};

type FormState = {
  file: File | null;
  text_content: string;
  name: string;
  subject: string;
  grade: string | number;
  num_questions: number;
  time_limit: number;
  difficulty: string;
  topic: string;
  percentage: number;
  [key: string]: unknown;
};

// --- State ban đầu cho form ---
const initialState: FormState = {
  file: null,
  text_content: "",
  name: "",
  subject: "",
  grade: "",
  num_questions: 10,
  time_limit: 45,
  difficulty: "Medium",
  topic: "",
  percentage: 70,
};

const TestDialog = ({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) => {
  // --- State cho quy trình (wizard) ---
  const [step, setStep] = useState<number>(1); // 1: Content, 2: Config
  const [loading, setLoading] = useState<boolean>(false);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormState>(initialState);
  const [progress, setProgress] = useState<string>('');



  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setStep(1);
        setLoading(false);
        setQuizResult(null);
        setDownloadUrl(null);
        setError(null);
        setFormData(initialState);
      }, 300);
    }
  }, [open]);

  // --- Hàm xử lý chung cho các input ---
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const target = e.target as HTMLInputElement | HTMLTextAreaElement;
    const { name, value } = target;
    setFormData((prev: FormState) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string) => (value: string) => {
    setFormData((prev: FormState) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files && event.target.files[0] ? event.target.files[0] : null;
    setFormData((prev: FormState) => ({ ...prev, file: file }));
  };

  // --- Kiểm tra xem bước 1 đã hợp lệ chưa ---
  const isStep1Valid = !!formData.file || formData.text_content.trim().length > 0;

  // --- Hàm gọi API ---
  const FRONTEND_API = import.meta.env.VITE_API_BASE_URL;
  
  const handleGenerate = async () => {
    if (!isStep1Valid) {
      setError("Vui lòng cung cấp nội dung trước khi tạo đề.");
      setStep(1);
      return;
    }

    setLoading(true);
    setQuizResult(null);
    setDownloadUrl(null);
    setError(null);

    const apiFormData = new FormData();
    
    // Validate dữ liệu đầu vào
    if (!formData.file && !formData.text_content.trim()) {
      setError("Vui lòng cung cấp file hoặc nội dung văn bản");
      setLoading(false);
      return;
    }

    // File upload (nếu có)
    if (formData.file) {
      if (!['.pdf', '.docx'].includes(formData.file.name.toLowerCase().slice(-5))) {
        setError("Chỉ hỗ trợ file .pdf hoặc .docx");
        setLoading(false);
        return;
      }
      apiFormData.append("file", formData.file);
    }

    // Text content (nếu có)
    if (formData.text_content.trim()) {
      apiFormData.append("text_content", formData.text_content.trim());
    }

    // Thêm các trường bắt buộc với giá trị mặc định
    apiFormData.append("num_questions", String(formData.num_questions || 10));
    apiFormData.append("time_limit", String(formData.time_limit || 45));
    apiFormData.append("difficulty", formData.difficulty || "Medium");
    apiFormData.append("percentage", String(formData.percentage || 70));

    // Thêm các trường tùy chọn nếu có
    if (formData.name?.trim()) {
      apiFormData.append("name", formData.name.trim());
    }
    if (formData.subject?.trim()) {
      apiFormData.append("subject", formData.subject.trim());
    }
    if (formData.grade) {
      const gradeNum = Number(formData.grade);
      if (!isNaN(gradeNum)) {
        apiFormData.append("grade", String(gradeNum));
      }
    }
    if (formData.topic?.trim()) {
      apiFormData.append("topic", formData.topic.trim());
    }

    let reader: ReadableStreamDefaultReader | undefined;
    
    try {
      console.log('Starting quiz generation...');
      const response = await fetch(`${FRONTEND_API}/api/v1/quizzes/stream`, {
        method: 'POST',
        body: apiFormData,
        credentials: 'include',
        headers: {
          'Accept': 'text/event-stream',
          'Origin': 'https://gemini.veronlabs.com',
          'Referer': 'https://gemini.veronlabs.com/',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Xử lý streaming response
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body is not readable');
      }

      const decoder = new TextDecoder();
      let buffer = '';
      
      // Handle different event types
      // Xử lý stream response
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        // Thêm dữ liệu mới vào buffer
        buffer += decoder.decode(value, { stream: true });
        
        // Tách và xử lý từng event
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Giữ lại phần chưa hoàn chỉnh cho lần sau

        let currentEvent = '';
        let currentData = '';

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          if (line.startsWith('event: ')) {
            currentEvent = line.slice(7);
          } else if (line.startsWith('data: ')) {
            currentData = line.slice(6);
            
            // Process complete event-data pair
            if (currentEvent && currentData) {
              try {
                const data = JSON.parse(currentData);
                console.log(`Received ${currentEvent}:`, data);

                switch (currentEvent) {
                  case 'status':
                    setProgress(data.message);
                    break;

                  case 'generating':
                    if (data.detail) {
                      setQuizResult(prev => ({
                        ...prev,
                        questions: [...(prev?.questions || []), data.detail]
                      }));
                    }
                    break;

                  case 'Done':
                    if (data.detail) {
                      setQuizResult(data.detail);
                      if (data.detail.download_url) {
                        const url = data.detail.download_url.startsWith("http")
                          ? data.detail.download_url
                          : `${FRONTEND_API}${data.detail.download_url}`;
                        setDownloadUrl(url);
                      }
                      setLoading(false);
                    }
                    break;

                  case 'error':
                    console.error('Stream error:', data);
                    setError(data.error || 'Lỗi không xác định từ server');
                    setLoading(false);
                    break;
                }
              } catch (err) {
                console.error('Error parsing JSON:', err, currentData);
              }
              
              // Reset for next event-data pair
              currentEvent = '';
              currentData = '';
            }
          }
        }
      }
    } catch (err) {
      const error = err as Error;
      console.error("❌ Quiz generation error:", error);
      setError(error.message || "Đã xảy ra lỗi khi tạo đề.");
      setLoading(false);
    } finally {
      // Cleanup if needed
      reader?.cancel();
    }
  };
  
  

  // --- Render nội dung dựa trên trạng thái ---
  const renderContent = () => {
    // Trạng thái TẢI (Loading)
      if (loading) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <Loader2 className="w-16 h-16 animate-spin text-primary" />
          <p className="text-lg font-medium">Đang tạo đề thi...</p>
          <p className="text-sm text-muted-foreground">
            {progress || 'Hệ thống đang phân tích tài liệu và sinh câu hỏi.'}
          </p>
          {quizResult?.questions && (
            <p className="text-sm text-muted-foreground">
              Đã tạo {quizResult.questions.length} câu hỏi
            </p>
          )}
        </div>
      );
    }

    // Trạng thái LỖI (Error)
    if (error && !loading) {
       return (
         <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4 text-center">
            <CheckCircle className="w-16 h-16 text-destructive" />
            <p className="text-lg font-medium">Đã xảy ra lỗi!</p>
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button variant="outline" onClick={() => { setError(null); setStep(1); }}>
              Thử lại
            </Button>
         </div>
       );
    }

    // Trạng thái THÀNH CÔNG (Success)
    if (quizResult) {
      return (
        <div className="space-y-4">
           
           {/* 1. Block thông báo thành công (BỎ sticky, cuộn bình thường) */}
           <div className="flex flex-col items-center justify-center text-center p-4 rounded-lg bg-green-50 shadow-sm">
            <CheckCircle className="w-12 h-12 text-green-600 mb-2" />
            <h3 className="font-semibold text-lg text-green-700">Đề thi đã tạo thành công!</h3>
            <p className="text-sm text-muted-foreground">Thời gian tạo: {quizResult.duration}</p>
           </div>

           {/* 2. Block thông tin tóm tắt (BỎ sticky, cuộn bình thường) */}
           <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2 text-sm mt-4 p-4 bg-muted/50 rounded-lg">
             <p><strong>Tên:</strong> {quizResult.name || "N/A"}</p>
             <p><strong>Môn:</strong> {quizResult.subject || "N/A"}</p>
             <p><strong>Lớp:</strong> {quizResult.grade || "N/A"}</p>
             <p><strong>Số câu:</strong> {quizResult.num_questions}</p>
             <p><strong>Thời gian:</strong> {quizResult.time_limit} phút</p>
             <p><strong>Độ khó:</strong> {quizResult.difficulty}</p>
           </div>

           {/* 3. Preview Header (GIỮ sticky top-0, cố định khi cuộn qua) */}
           <div className="sticky top-0 bg-background pt-2 pb-4 border-b z-10">
             <div className="flex items-center justify-between">
               <Label className="text-lg font-semibold">Xem trước câu hỏi</Label>
               <div className="text-sm text-muted-foreground flex items-center">
                 <span className="inline-block w-2 h-2 bg-primary rounded-full mr-2"></span>
                 Nhấn vào câu hỏi để xem đáp án
               </div>
             </div>
           </div>

           {/* 4. Flashcards List (SỬA mb-16 -> pb-20 để thêm đệm cuối) */}
           <div className="space-y-4 pb-20"> 
             {Array.isArray(quizResult.questions) && quizResult.questions.length > 0 ? (
               (quizResult.questions as Question[]).map((q, i) => (
                 <div 
                   key={i} 
                   className="rounded-lg shadow-sm overflow-visible" 
                 >
                   <Flashcard 
                     index={i} 
                     questionData={{
                       questionText: q.question || '',
                       questionType: q.type || 'multiple_choice',
                       options: q.options || {},
                       correctAnswer: q.correct_answer || '',
                       explanation: q.explanation || ''
                     }} 
                   />
                 </div>
               ))
             ) : (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <span className="text-4xl mb-4">📝</span>
                  <p className="text-lg font-medium">Không có câu hỏi để hiển thị</p>
                  <p className="text-sm">Hãy thử lại với nội dung khác</p>
                </div>
             )}
           </div>
        </div>
      );
    }

    // Trạng thái BIỂU MẪU (Form)
    return (
      <form onSubmit={(e) => e.preventDefault()}>
        {/* Chỉ báo các bước */}
        <div className="flex justify-center items-center mb-4">
          <div className={`flex items-center ${step === 1 ? 'text-primary' : 'text-muted-foreground'}`}>
            <span className={`flex items-center justify-center w-6 h-6 rounded-full ${step === 1 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>1</span>
            <span className="ml-2 font-medium">Nội dung</span>
          </div>
          <span className="h-px w-12 bg-border mx-4"></span>
           <div className={`flex items-center ${step === 2 ? 'text-primary' : 'text-muted-foreground'}`}>
            <span className={`flex items-center justify-center w-6 h-6 rounded-full ${step === 2 ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>2</span>
            <span className="ml-2 font-medium">Cấu hình</span>
          </div>
        </div>
        
        {/* --- Bước 1: Cung cấp nội dung --- */}
        <div className={step === 1 ? "block" : "hidden"}>
          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload"><Upload className="w-4 h-4 mr-2" /> Tải File</TabsTrigger>
              <TabsTrigger value="text"><FileText className="w-4 h-4 mr-2" /> Dán văn bản</TabsTrigger>
            </TabsList>
            <TabsContent value="upload" className="mt-4">
              <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg">
                <FileUp className="w-10 h-10 text-muted-foreground mb-2" />
                <Label htmlFor="file-upload" className="text-primary font-medium cursor-pointer">
                  Chọn file (.pdf, .docx)
                </Label>
                <Input id="file-upload" type="file" accept=".pdf,.docx" onChange={handleFileChange} className="hidden" />
                {formData.file && <p className="text-sm text-muted-foreground mt-2">Đã chọn: {formData.file?.name}</p>}
              </div>
            </TabsContent>
            <TabsContent value="text" className="mt-4">
              <Textarea
                id="text-content"
                name="text_content"
                value={formData.text_content}
                onChange={handleInputChange}
                placeholder="Dán nội dung tài liệu của bạn vào đây..."
                rows={8}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* --- Bước 2: Cấu hình đề thi --- */}
        <div className={step === 2 ? "block space-y-4" : "hidden"}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Tên đề thi (Tùy chọn)</Label>
              <Input name="name" value={formData.name} onChange={handleInputChange} placeholder="VD: Đề 15 phút" />
            </div>
            <div>
              <Label>Môn học (Tùy chọn)</Label>
              <Input name="subject" value={formData.subject} onChange={handleInputChange} placeholder="VD: Sinh học" />
            </div>
            <div>
              <Label>Khối lớp (Tùy chọn)</Label>
              <Input type="number" name="grade" value={formData.grade} onChange={handleInputChange} placeholder="VD: 12" />
            </div>
          </div>
          <div>
            <Label>Chủ đề (Tùy chọn)</Label>
            <Input name="topic" value={formData.topic} onChange={handleInputChange} placeholder="VD: Di truyền học" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label>Số câu hỏi</Label>
              <Input type="number" name="num_questions" min="1" value={formData.num_questions} onChange={handleInputChange} />
            </div>
            <div>
              <Label>Tỉ lệ (%)</Label>
              <Input type="number" name="percentage" min="0" max="100" value={formData.percentage} onChange={handleInputChange} />
            </div>
            <div>
              <Label>Thời gian (phút)</Label>
              <Input type="number" name="time_limit" min="5" value={formData.time_limit} onChange={handleInputChange} />
            </div>
            <div>
              <Label>Độ khó</Label>
              <Select name="difficulty" value={formData.difficulty} onValueChange={handleSelectChange("difficulty")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Easy">Dễ</SelectItem>
                  <SelectItem value="Medium">Trung bình</SelectItem>
                  <SelectItem value="Hard">Khó</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* --- Nút điều hướng --- */}
        <DialogFooter className="mt-6">
          {step === 1 && (
            <Button onClick={() => setStep(2)} disabled={!isStep1Valid} className="w-full sm:w-auto">
              Tiếp theo <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
          {step === 2 && (
            <>
              <Button variant="outline" onClick={() => setStep(1)} className="w-full sm:w-auto">
                <ArrowLeft className="w-4 h-4 mr-2" /> Quay lại
              </Button>
              <Button onClick={handleGenerate} className="w-full sm:w-auto">
                Tạo đề thi
              </Button>
            </>
          )}
        </DialogFooter>
      </form>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] p-0 gap-0 flex flex-col"> {/* Đảm bảo có flex flex-col */}
        
        {/* Header - Cố định */}
        <DialogHeader className="px-6 pt-6 pb-4 bg-background z-20 border-b">
          {/* ... giữ nguyên nội dung Header ... */}
        </DialogHeader>
        
        {/* Phần Nội dung - Có thanh cuộn */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden"> 
          <div className="px-6 py-4">
            {renderContent()}
          </div>
        </div>
        
        {/* Footer - Cố định ở dưới cùng */}
        {quizResult && downloadUrl && ( // CHỈ HIỂN THỊ KHI CÓ KẾT QUẢ
             <DialogFooter className="bg-background py-4 px-6 border-t shadow-md"> {/* LOẠI BỎ 'sticky bottom-0' */}
               <Button asChild className="w-full sm:w-auto">
                 <a href={downloadUrl} download className="flex items-center justify-center">
                   <Download className="w-5 h-5 mr-2" />
                   Tải file DOCX
                 </a>
               </Button>
             </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TestDialog;