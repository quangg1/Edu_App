import { useState, useCallback, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "../components/ui/dialog";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Textarea } from "../components/ui/textarea";
import { Loader2, Sparkles, Upload, FileText, X, Download } from "lucide-react";
import { Card } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { useToast } from "../components/ui/use-toast";

export interface LessonPlanFormData {
  type: 'k12' | 'kindergarten' | 'custom';
  prompt: string; // Tương ứng với 'additionalPrompt' trong backend
  model?: string;
  title: string; 
  grade: string;
  subject: string;
  method: string;
  duration: string;
  objectives: string;
}
interface StreamEvent {
  message?: string;
  subject?: string;
  grade?: number;
  lesson_title?: string;
  html?: string;
  download_url?: string;
}

interface StreamError extends Event {
  error?: Error;
  message?: string;
}
interface TeachingMethod {
    id: string;
    title: string;
    description: string;
    example: string;
}

interface LessonPlanDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    selectedMethod?: TeachingMethod | null;
}

const LessonPlanDialog = ({ open, onOpenChange, selectedMethod }: LessonPlanDialogProps) => {
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState("form");
    const [file, setFile] = useState<File | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [streamOutput, setStreamOutput] = useState("");
    const [downloadToken, setDownloadToken] = useState<string | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    const [formData, setFormData] = useState<LessonPlanFormData>({
      type: selectedMethod?.id === 'kindergarten' ? 'kindergarten' : 'k12',
      prompt: "",
      model: "gemini-2.5-flash",
      // GIÁ TRỊ KHỞI TẠO MỚI
      title: "",
      grade: "",
      subject: "",
      method: "",
      duration: "45 phút", // Gán giá trị mặc định cho duration
      objectives: ""
    });

    useEffect(() => {
        if (!open) {
            setFormData({
              type: selectedMethod?.id === 'kindergarten' ? 'kindergarten' : 'k12',
              prompt: "",
              model: "gemini-2.5-flash",
              // GIÁ TRỊ KHỞI TẠO MỚI
              title: "",
              grade: "",
              subject: "",
              method: "",
              duration: "45 phút", // Gán giá trị mặc định cho duration
              objectives: ""
            });
            setFile(null);
            setActiveTab("form");
            setStreamOutput("");
            setDownloadToken(null);
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
                abortControllerRef.current = null;
            }
        }
    }, [open, selectedMethod]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({
            ...formData,
            [e.target.id]: e.target.value,
        });
    };

    const handleSelectChange = (id: keyof LessonPlanFormData, value: string) => {
        setFormData({
            ...formData,
            [id]: value as any,
        });
    };

    const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) {
            setFile(null);
            return;
        }
        setFile(files[0]);
        toast({ 
            title: "Upload File", 
            description: `File đã được tải lên: ${files[0].name}`,
            variant: "default"
        });
    }, [toast]);

    const handleRemoveFile = useCallback(() => {
        setFile(null);
    }, []);

    const processStreamEvent = useCallback((eventType: string, data: StreamEvent) => {
      switch (eventType) { // Sử dụng eventType truyền vào
          case 'status':
              if (data.message) {
                  setStreamOutput(prev => prev + `\n[Trạng thái] ${data.message}\n`);
              }
              break;
          case 'meta':
              if (data.subject && data.grade && data.lesson_title) {
                  setStreamOutput(prev => prev + `\n[Thông tin] Môn: ${data.subject}, Lớp: ${data.grade}, Bài: ${data.lesson_title}\n`);
              }
              break;
          case 'objectives':
          case 'resources':
          case 'start_activity':
          case 'knowledge_formation_activity':
          case 'practice_activity':
          case 'extend_activity':
          case 'add_para':
          case 'add_items':
          case 'add_table':
              if (data.html) {
                  setStreamOutput(prev => prev + `\n${data.html}\n`);
              }
              break;
          case 'final':
              if (data.download_url) {
                  const token = data.download_url.split('/').pop();
                  setDownloadToken(token || null);
                  setIsGenerating(false);
                  toast({
                      title: "Thành công",
                      description: "Giáo án đã được tạo xong!",
                      variant: "default"
                  });
              }
              break;
          case 'error': // Xử lý lỗi từ stream
              setIsGenerating(false);
              toast({
                  title: "Lỗi Stream",
                  description: data.message || "Có lỗi xảy ra khi tạo giáo án",
                  variant: "destructive"
              });
              break;
      }
  }, [toast]);

  const handleFormSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsGenerating(true);
    setActiveTab('result');
    setStreamOutput('');
    setDownloadToken(null);
  
    // 1. Khởi tạo AbortController để cho phép hủy POST request
    const controller = new AbortController();
    abortControllerRef.current = controller;
  
    try {
        // 2. CHUẨN BỊ DỮ LIỆU
        const formDataToSend = new FormData();
        formDataToSend.append('title', formData.title);
        formDataToSend.append('grade', formData.grade);
        formDataToSend.append('subject', formData.subject);
        formDataToSend.append('method', formData.method);
        formDataToSend.append('duration', formData.duration);
        formDataToSend.append('objectives', formData.objectives);
        
        // 'prompt' ở frontend tương ứng với 'additionalPrompt' ở backend
        formDataToSend.append('prompt', formData.prompt); 
        
        formDataToSend.append('model', formData.model || 'gemini-2.5-flash');
        formDataToSend.append('type', formData.type);
        
        
        if (file) {
            formDataToSend.append('file', file); // Đổi tên key thành 'file' để khớp với `upload.single('file')`
        }
  
        // 3. THỰC HIỆN POST REQUEST VÀ ĐỌC STREAM TRỰC TIẾP
        let endpoint = 'https://gemini.veronlabs.com/bot5/api/v1/lesson-plans/stream';
        switch (formData.type) {
          case 'kindergarten':
            endpoint = 'https://gemini.veronlabs.com/bot5/api/v1/lesson-plans/stream?type=kindergarten';
            break;
          case 'custom':
            endpoint = 'https://gemini.veronlabs.com/bot5/api/v1/lesson-plans/stream?type=custom';
            break;
          default:
            endpoint = 'https://gemini.veronlabs.com/bot5/api/v1/lesson-plans/stream?type=k12';
            break;
        }

        const response = await fetch(endpoint, {
          method: 'POST',
          body: formDataToSend,
          signal: controller.signal,
        });
  
        if (!response.ok || !response.body) {
            const errorText = await response.text();
            throw new Error(`Failed to start generation: ${response.status} - ${errorText}`);
        }
        
        // 4. ĐỌC VÀ PHÂN TÍCH CÚ PHÁP SSE TỪ RESPONSE STREAM
        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = ""; // Buffer để lưu trữ các chunk chưa hoàn chỉnh
  
        while (true) {
            const { done, value } = await reader.read();
            if (done) {
                break;
            }
  
            buffer += decoder.decode(value, { stream: true });
            
            let eventBoundary;
            
            // Xử lý từng khối SSE (Phân tách bằng \n\n)
            while ((eventBoundary = buffer.indexOf('\n\n')) !== -1) {
                const eventBlock = buffer.substring(0, eventBoundary).trim();
                buffer = buffer.substring(eventBoundary + 2); // Cắt bỏ khối đã xử lý
  
                if (!eventBlock) continue;
                
                // Phân tích cú pháp: event: type \n data: {...}
                const lines = eventBlock.split('\n');
                let eventType = '';
                let dataString = '';
                
                for (const line of lines) {
                    if (line.startsWith('event:')) {
                        eventType = line.substring('event:'.length).trim();
                    } else if (line.startsWith('data:')) {
                        dataString += line.substring('data:'.length).trim();
                    }
                }
  
                if (eventType && dataString) {
                    try {
                        const data = JSON.parse(dataString);
                        // Gọi hàm xử lý đã được tái cấu trúc
                        processStreamEvent(eventType, data as StreamEvent); 
                    } catch (err) {
                        console.error(`Error parsing data for event ${eventType}:`, err);
                    }
                }
            }
        }
        
        // Stream kết thúc bình thường
        setIsGenerating(false);
  
    } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
            console.log("Generation cancelled by user.");
            setStreamOutput(prev => prev + '\n[Đã Hủy] Việc tạo giáo án đã bị hủy.');
        } else {
            console.error('Form submission error:', error);
            setIsGenerating(false);
            toast({
                title: "Lỗi",
                description: error instanceof Error ? error.message : "Có lỗi xảy ra",
                variant: "destructive"
            });
        }
    } finally {
        abortControllerRef.current = null;
    }
  }, [formData, file, toast, setActiveTab, processStreamEvent]);

  const handleDownload = useCallback(() => {
    if (downloadToken) {
      const downloadUrl = `https://gemini.veronlabs.com/bot5/api/v1/lesson-plans/download/${downloadToken}`;
      // Tạo thẻ a ẩn để kiểm soát download tốt hơn
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = formData.type === 'custom' 
        ? `tai_lieu_${downloadToken}.docx`
        : `giao_an_${downloadToken}.docx`;
      
      // Thêm token vào headers
      fetch(downloadUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'x-type': formData.type // Thêm type vào header
        }
      })
      .then(response => response.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        link.href = url;
        link.click();
        window.URL.revokeObjectURL(url);
        toast({
          title: "Tải xuống thành công",
          description: `File ${formData.type === 'custom' ? 'tài liệu' : 'giáo án'} đang được tải xuống.`,
          variant: "default",
        });
      })
      .catch(error => {
        console.error('Download error:', error);
        toast({
          title: "Lỗi tải xuống",
          description: "Không thể tải file. Vui lòng thử lại sau.",
          variant: "destructive",
        });
      });
    }
  }, [downloadToken, formData.type, toast]);

    const handleCancel = useCallback(() => {
      if (isGenerating && abortControllerRef.current) {
          // Gọi abort để hủy POST request đang streaming
          abortControllerRef.current.abort(); 
          setIsGenerating(false);
      } else {
          onOpenChange(false);
      }
  }, [isGenerating, onOpenChange]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl sm:max-w-6xl h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>
                        {formData.type === 'kindergarten' ? 'Tạo Kế hoạch Hoạt động' : 'Tạo Giáo án / Tài liệu'}
                    </DialogTitle>
                </DialogHeader>
                
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="form" disabled={isGenerating}>Nhập Liệu</TabsTrigger>
                        <TabsTrigger value="result" disabled={!streamOutput && !isGenerating}>
                            Kết Quả {isGenerating && !downloadToken && ' (Đang tạo...)'}
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="form">
                        <form onSubmit={handleFormSubmit} className="space-y-4 pt-4">
                        <div className="space-y-4">
                        {/* Loại giáo án */}
                        <div className="space-y-2">
                          <Label htmlFor="type">Loại giáo án</Label>
                          <Select
                            value={formData.type}
                            onValueChange={(value) => handleSelectChange('type', value)}
                            disabled={isGenerating}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Chọn loại giáo án" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="k12">K12 (Lớp 1–12)</SelectItem>
                              <SelectItem value="kindergarten">Mầm non</SelectItem>
                              <SelectItem value="custom">Tùy chỉnh (Tài liệu / PDF)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div> 

                        {/* CÁC TRƯỜNG MỚI BẮT ĐẦU */}
                        {formData.type !== 'custom' && (
                        <>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="title">Chủ đề/Tiêu đề <span className="text-red-500">*</span></Label>
                                <input 
                                    id="title" 
                                    type="text"
                                    value={formData.title} 
                                    onChange={handleInputChange} 
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    placeholder="Ví dụ: Phân thức đại số"
                                    required
                                    disabled={isGenerating} 
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="subject">Môn học <span className="text-red-500">*</span></Label>
                                <input 
                                    id="subject" 
                                    type="text"
                                    value={formData.subject} 
                                    onChange={handleInputChange} 
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    placeholder="Ví dụ: Toán"
                                    required
                                    disabled={isGenerating} 
                                />
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="grade">Lớp học/Cấp độ</Label>
                                <input 
                                    id="grade" 
                                    type="text"
                                    value={formData.grade} 
                                    onChange={handleInputChange} 
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    placeholder="Ví dụ: 11"
                                    disabled={isGenerating} 
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="duration">Thời lượng</Label>
                                <input 
                                    id="duration" 
                                    type="text"
                                    value={formData.duration} 
                                    onChange={handleInputChange} 
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    placeholder="Ví dụ: 45 phút"
                                    disabled={isGenerating} 
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="method">Phương pháp</Label>
                                <input 
                                    id="method" 
                                    type="text"
                                    value={formData.method} 
                                    onChange={handleInputChange} 
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    placeholder="Ví dụ: CTGDPT 2018"
                                    disabled={isGenerating} 
                                />
                            </div>
                        </div>
                        
                        <div className="space-y-2">
                            <Label htmlFor="objectives">Mục tiêu (Tùy chọn)</Label>
                            <Textarea 
                                id="objectives" 
                                value={formData.objectives} 
                                onChange={handleInputChange} 
                                rows={2} 
                                placeholder="Mục tiêu cụ thể của bài học..." 
                                disabled={isGenerating} 
                            />
                        </div>
                          </>
                        )}

                        {/* Yêu cầu chi tiết (TƯƠNG ỨNG VỚI PROMPT GỐC/ADDITIONAL PROMPT) */}
                        <div className="space-y-2">
                            <Label htmlFor="prompt">Yêu cầu chi tiết/Thêm <span className="text-red-500">*</span></Label>
                            <Textarea 
                                id="prompt" 
                                value={formData.prompt} 
                                onChange={handleInputChange} 
                                rows={6} 
                                placeholder="Mô tả chi tiết yêu cầu khác (nếu có)..." 
                                disabled={isGenerating} 
                            />
                        </div>
                        {/* ... */}
                    </div>
                            
                            <Card className="p-4 border-dashed border-primary/50 bg-primary/5">
                                <Label htmlFor="file-upload" className="flex items-center space-x-2 text-sm font-medium cursor-pointer">
                                    <Upload className="w-5 h-5 text-primary" />
                                    <span>Tải lên tài liệu tham khảo (Tùy chọn)</span>
                                </Label>
                                <input
                                    id="file-upload"
                                    type="file"
                                    className="hidden"
                                    onChange={handleFileChange}
                                    disabled={isGenerating}
                                />
                                {file && (
                                    <div className="mt-3 flex items-center justify-between p-2 bg-white rounded-md border border-gray-200">
                                        <span className="flex items-center gap-2 text-sm text-gray-700">
                                            <FileText className="w-4 h-4 text-primary" />
                                            {file.name}
                                        </span>
                                        <Button 
                                            type="button" 
                                            variant="ghost" 
                                            size="sm" 
                                            onClick={handleRemoveFile}
                                            disabled={isGenerating}
                                        >
                                            <X className="w-4 h-4 text-red-500" />
                                        </Button>
                                    </div>
                                )}
                            </Card>

                            <DialogFooter className="flex gap-3 pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="flex-1"
                                    onClick={handleCancel}
                                >
                                    {isGenerating ? 'Hủy Tạo' : 'Đóng'}
                                </Button>
                                <Button 
                                    type={downloadToken ? "button" : "submit"}
                                    className="flex-1 gap-2" 
                                    disabled={isGenerating && !downloadToken} 
                                    onClick={downloadToken ? handleDownload : undefined}
                                >
                                    {isGenerating ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            {streamOutput ? 'Đang hoàn thiện file...' : 'AI đang khởi tạo...'}
                                        </>
                                    ) : downloadToken ? (
                                        <>
                                            <Download className="w-4 h-4" />
                                            Tải xuống DOCX
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="w-4 h-4" />
                                            {formData.type === 'k12' && 'Tạo giáo án với AI'}
                                            {formData.type === 'kindergarten' && 'Tạo hoạt động với AI'}
                                            {formData.type === 'custom' && 'Tạo tài liệu với AI'}
                                        </>
                                    )}
                                </Button>
                            </DialogFooter>
                        </form>
                    </TabsContent>
                    
                    <TabsContent value="result" className="flex-1 flex flex-col mt-4 overflow-hidden">
                  <div 
                    className="flex-1 overflow-y-auto p-4 border rounded-lg bg-secondary/30 relative min-h-[400px] max-h-[calc(90vh-250px)]"
                      ref={(el) => {
                          if (el) {
                              el.scrollTop = el.scrollHeight;
                          }
                      }}
                      style={{
                          overflowY: 'auto',
                          scrollbarWidth: 'thin',
                          scrollbarColor: 'rgba(155, 155, 155, 0.5) transparent'
                      }}
                  >
                      {isGenerating && !streamOutput && (
                          <p className="text-center text-muted-foreground flex items-center justify-center gap-2 py-8">
                              <Loader2 className="w-5 h-5 animate-spin" /> 
                              Đang tạo nội dung, vui lòng chờ...
                          </p>
                      )}
                      <div 
                          className="prose max-w-none dark:prose-invert whitespace-pre-wrap" 
                          dangerouslySetInnerHTML={{ __html: streamOutput }} 
                      />
                      {isGenerating && streamOutput && (
                          <p className="text-center text-primary flex items-center justify-center gap-2 pt-4 sticky bottom-0 bg-secondary/30 py-2">
                              <Loader2 className="w-4 h-4 animate-spin" /> 
                              Đang hoàn thiện cấu trúc...
                          </p>
                      )}
                  </div>
                  <DialogFooter className="flex gap-3 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                className="flex-1"
                                onClick={() => setActiveTab("form")}
                                disabled={isGenerating && !downloadToken}
                            >
                                {downloadToken ? 'Chỉnh Sửa Input' : 'Quay lại'}
                            </Button>
                            <Button 
                                type="button"
                                className="flex-1 gap-2" 
                                disabled={!downloadToken}
                                onClick={handleDownload}
                            >
                                <Download className="w-4 h-4" />
                                Tải xuống DOCX
                            </Button>
                        </DialogFooter>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
};

export default LessonPlanDialog;