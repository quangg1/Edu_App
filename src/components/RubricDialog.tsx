// RubricDialog.tsx

import { useRef, useCallback, useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Card } from "../components/ui/card";
import { useToast } from "../hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Badge } from "../components/ui/badge";
import { Loader2, Upload, FileText, X, Target, Download } from "lucide-react";

// Định nghĩa Interface Rubric (nên đồng bộ với RubricDetail.tsx)
interface RubricLevel {
  label: string;
  score_range: string;
  description: string;
}

interface RubricCriterionStream {
  name: string;
  weight_percent: number;
  levels: RubricLevel[];
  description?: string;
}

interface RubricStreamResponse {
  rubric_title?: string;
  subject?: string;
  grade_level?: string;
  assessment_type?: string;
  criteria?: RubricCriterionStream[];
  download_url?: string;
}

interface Rubric {
  id: string;
  name: string;
  subject: string;
  grade?: string;
  type?: string;
  date: string;
  students: number;
  progress: number;
  description: string;
  criteriaCount: number;
  criteria: { name: string; weight: number; description: string }[];
  rubricTable: { level: string; points: number; descriptions: string[] }[];
  studentResults: { name: string; score: number | null; status: 'completed' | 'pending' }[];
  statistics: {
    averageScore: number;
    highestScore: number;
    lowestScore: number;
    completionRate: number;
  };
}

interface RubricDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRubricCreated?: (rubric: Rubric) => void;
}

const RubricDialog = ({ open, onOpenChange, onRubricCreated }: RubricDialogProps) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("form");
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamOutput, setStreamOutput] = useState("");
  const [downloadToken, setDownloadToken] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const finalRubricDataRef = useRef<Partial<RubricStreamResponse>>({});
  const streamTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);
  const [streamProgress, setStreamProgress] = useState({ 
    isStreaming: false, 
    currentStep: "Sẵn sàng", 
    criteriaCount: 0 
  });

  const [formData, setFormData] = useState({
    title: "",
    subject: "",
    grade: "",
    type: "",
    criteria: "5", 
    description: "",
  });
  const [attachedFile, setAttachedFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
        const file = e.target.files[0];
        const MAX_SIZE_MB = 1000;
        if (file.size > MAX_SIZE_MB * 1024 * 1024) { 
            toast({
                title: "Lỗi file",
                description: `Kích thước file không được vượt quá ${MAX_SIZE_MB}MB.`,
                variant: "destructive",
            });
            e.target.value = ''; 
            setAttachedFile(null);
            return;
        }
        // 💡 FIX: Cập nhật state attachedFile khi thành công
        setAttachedFile(file);
    }
};

  const handleRemoveFile = () => {
    setAttachedFile(null);
    const fileInput = document.getElementById("file-upload") as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Download handling
  const handleDownload = useCallback(() => {
    if (!downloadToken) return;
    
    const downloadUrl = `https://gemini.veronlabs.com/bot5/api/v1/rubrics/download/${downloadToken}`;
    const link = document.createElement('a');
    
    // 1. THỰC HIỆN FETCH ĐỂ LẤY BLOB
    fetch(downloadUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      }
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`);
      }
      return response.blob();
    })
    .then(blob => {
      const url = window.URL.createObjectURL(blob);
      link.href = url;
      link.download = `rubric_${downloadToken}.docx`; 
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Tải xuống thành công",
        description: "Tài liệu rubric đang được tải xuống.",
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
  }, [downloadToken, toast]);

  // Stream processing
  // Add cleanup effect for stream state
  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      if (streamTimeoutRef.current) {
        clearTimeout(streamTimeoutRef.current);
        streamTimeoutRef.current = null;
      }
    };
  }, []);

  interface StreamEventData {
    message?: string;
    url?: string;
  }

  const processStreamEvent = useCallback((eventType: string, data: StreamEventData | RubricCriterionStream[] | string) => {
    if (!mountedRef.current) return;

    switch (eventType) {
      case 'status': {
        if (typeof data === 'object' && (data as any).message) {
          setStreamOutput(prev => prev + `\n[Trạng thái] ${(data as any).message}\n`);
          setStreamProgress(prev => ({ ...prev, currentStep: (data as any).message }));
        }
        break;
      }
      case 'rubric_criteria': {
        if (Array.isArray(data)) {
          finalRubricDataRef.current.criteria = data;
          const count = data.length;
          setStreamProgress(prev => ({ 
            ...prev, 
            criteriaCount: count,
            currentStep: `Đã nhận ${count} tiêu chí đánh giá`
          }));
        }
        break;
      }
      case 'download_url': {
        const downloadUrl = typeof data === 'string' ? data : 
                          (typeof data === 'object' && (data as any)?.url) ? (data as any).url : null;
        
        if (downloadUrl) {
          const token = downloadUrl.split('/').pop();
          if (token) {
            setDownloadToken(token);
            setIsGenerating(false);
            
            // Tự động lưu vào database
            if (finalRubricDataRef.current.criteria && finalRubricDataRef.current.criteria.length > 0) {
              const FRONTEND_API = 'https://gemini.veronlabs.com/bot5';
              fetch(`${FRONTEND_API}/api/v1/rubrics/save`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                  title: formData.title,
                  subject: formData.subject,
                  grade: formData.grade,
                  assessmentType: formData.type,
                  criteria: finalRubricDataRef.current.criteria,
                  description: formData.description,
                  downloadToken: token
                })
              })
              .then(res => res.json())
              .then(result => {
                if (result.success) {
                  console.log('✅ Thang đánh giá đã được lưu vào database:', result.data.rubricId);
                } else {
                  console.warn('⚠️ Không thể lưu thang đánh giá:', result.message);
                }
              })
              .catch(err => {
                console.error('❌ Lỗi khi lưu thang đánh giá:', err);
              });
            }
            
            // Update the generated rubric data and notify parent
            if (onRubricCreated && finalRubricDataRef.current.criteria) {
              const newRubric: Rubric = {
                id: Date.now().toString(),
                name: formData.title,
                subject: formData.subject,
                grade: formData.grade,
                type: formData.type,
                date: new Date().toLocaleDateString("vi-VN"),
                students: 0,
                progress: 100,
                description: formData.description,
                criteria: finalRubricDataRef.current.criteria.map(c => ({
                  name: c.name,
                  weight: c.weight_percent,
                  description: c.description || ""
                })),
                rubricTable: [],
                studentResults: [],
                criteriaCount: finalRubricDataRef.current.criteria?.length || 0,
                statistics: {
                  averageScore: 0,
                  highestScore: 0,
                  lowestScore: 0,
                  completionRate: 0
                }
              };
              onRubricCreated(newRubric);
            }

            toast({ title: "Thành công", description: "Đã tạo Rubric thành công!", variant: "default" });
          }
        }
        break;
      }
      case 'error': {
        if (typeof data === 'object') {
          toast({ 
            title: "Lỗi Stream", 
            description: (data as any).message || "Đã xảy ra lỗi không xác định.", 
            variant: "destructive" 
          });
          setIsGenerating(false);
        }
        break;
      }
    }
  }, [formData, onRubricCreated, toast]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  
    if (!formData.title || !formData.subject || !formData.criteria) {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng điền tiêu đề, môn học và số tiêu chí.",
        variant: "destructive",
      });
      return;
    }
  
    setIsGenerating(true);
    setActiveTab("result");
    setStreamOutput("");
    setDownloadToken(null);
    finalRubricDataRef.current = {};
    
    // Setup abort controller
    const controller = new AbortController();
    abortControllerRef.current = controller;
  
    try {
      // Prepare form data
      const form = new FormData();
      form.append("rubric_title", formData.title);
      form.append("subject", formData.subject);
      if (formData.grade) form.append("grade_level", formData.grade);
      if (formData.type) form.append("assessment_type", formData.type);
      form.append("number_of_criteria", formData.criteria);
      if (formData.description) form.append("user_prompt", formData.description);
      if (attachedFile) form.append("files", attachedFile, attachedFile.name);

      const response = await fetch("https://gemini.veronlabs.com/bot5/api/v1/rubrics/stream", {
        method: "POST",
        body: form,
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error(`Stream failed: ${response.statusText}`);
      }

      // Process the stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        let eventBoundary;
        
        while ((eventBoundary = buffer.indexOf('\n\n')) !== -1) {
          const eventBlock = buffer.substring(0, eventBoundary).trim();
          buffer = buffer.substring(eventBoundary + 2);

          if (!eventBlock) continue;

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
              processStreamEvent(eventType, data);
            } catch (err) {
              console.error('❌ Error parsing data for event:', eventType, err);
            }
          }
        }
      }
      
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          console.log('Stream was cancelled');
        } else {
          toast({
            title: "Tạo Rubrics thất bại",
            description: error.message || "Đã xảy ra lỗi trong quá trình xử lý.",
            variant: "destructive",
          });
        }
      }
      setIsGenerating(false);
    } finally {
      // Clean up the stream state and toast success if we received criteria
      if (!abortControllerRef.current) {
        if (finalRubricDataRef.current.criteria?.length) {
          toast({ title: "Hoàn thành", description: "Đã tạo Rubrics thành công!", variant: "default" });
        }
      }
      abortControllerRef.current = null;
      handleRemoveFile();
      
      // Reset form if we got our results or there was an error
      if (!isGenerating) {
        setFormData({
          title: "",
          subject: "",
          grade: "",
          type: "",
          criteria: "5",
          description: ""
        });
      }
    }
  };

  // Helper functions to render rubric details
  const renderCriteria = useCallback(() => {
    if (!finalRubricDataRef.current?.criteria?.length && !isGenerating) {
      return <p className="text-center text-muted-foreground py-8">Chưa có tiêu chí đánh giá nào.</p>;
    }
    
    return (
      <div className="space-y-6">
        {/* Card View */}
        {finalRubricDataRef.current.criteria?.map((c, index) => (
          <div 
            key={index} 
            className="border p-4 rounded-xl shadow-md hover:shadow-lg transition-shadow bg-card/70 backdrop-blur-sm"
          >
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Target className="w-5 h-5 text-primary flex-shrink-0" />
                {c.name}
              </h3>
              <Badge variant="default" className="text-base font-extrabold px-3 py-1">
                {c.weight_percent}%
              </Badge>
            </div>
            <div className="border-l-4 border-primary/70 pl-4 py-2 bg-primary/5 rounded-r-lg">
              {c.description && <>
                <p className="text-sm text-muted-foreground italic">Mô tả tổng quát:</p>
                <p className="text-sm text-foreground mt-1 leading-relaxed">{c.description}</p>
              </>}
            </div>
          </div>
        ))}

        {/* Table View of Criteria */}
        {(finalRubricDataRef.current.criteria?.length ?? 0) > 0 && (
          <div className="mt-8 overflow-x-auto rounded-lg border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="p-4 text-left font-semibold text-muted-foreground" style={{width: '30%'}}>Tiêu chí đánh giá</th>
                  <th className="p-4 text-center font-semibold text-muted-foreground" style={{width: '10%'}}>Trọng số</th>
                  <th className="p-4 font-semibold text-muted-foreground" colSpan={4}>Mức độ đạt được & Thang điểm</th>
                </tr>
                <tr className="border-b bg-muted/30">
                  <th className="p-4"></th>
                  <th className="p-4"></th>
                  { (finalRubricDataRef.current.criteria?.[0]?.levels ?? []).map((level, idx) => (
                    <th key={idx} className="p-4 text-center font-medium text-muted-foreground whitespace-nowrap">
                      {level.label}
                      <div className="text-xs text-primary/70">{level.score_range} điểm</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {(finalRubricDataRef.current.criteria ?? []).map((c, index) => (
                  <tr key={`table-${index}`} className="hover:bg-muted/30 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-primary/70"></div>
                        <span className="font-medium">{c.name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-center font-semibold text-primary">
                      {c.weight_percent}%
                    </td>
                    {c.levels?.map((level, idx) => (
                      <td key={idx} className="p-4 text-sm">
                        <div className="text-muted-foreground text-justify line-clamp-4">
                          {level.description}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }, [isGenerating]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] p-0 gap-0 flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>Tạo Rubrics tự động bằng AI</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="form" value={activeTab} onValueChange={setActiveTab} className="flex-1 min-h-0 flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="form" disabled={isGenerating && !downloadToken}>
              Nhập Liệu
            </TabsTrigger>
            <TabsTrigger value="result" disabled={!streamOutput && !isGenerating}>
              Kết Quả {isGenerating && !downloadToken && ' (Đang tạo...)'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="form" className="flex-1 min-h-0 overflow-y-auto">
            <form onSubmit={handleSubmit} className="space-y-4 px-4 pb-6 pt-4">
        <div className="space-y-2">
            <Label htmlFor="title">Tiêu đề Rubrics <span className="text-red-500">*</span></Label>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Ví dụ: Đánh giá dự án STEM lớp 8"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Môn học <span className="text-red-500">*</span></Label>
              <Input
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                placeholder="Ví dụ: Khoa học tự nhiên"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="grade">Khối/Lớp</Label>
              <Select
                value={formData.grade}
                onValueChange={(val) => handleSelectChange("grade", val)}
              >
                <SelectTrigger id="grade">
                  <SelectValue placeholder="Chọn khối/lớp" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Lớp 6">Lớp 6</SelectItem>
                  <SelectItem value="Lớp 7">Lớp 7</SelectItem>
                  <SelectItem value="Lớp 8">Lớp 8</SelectItem>
                  <SelectItem value="Lớp 9">Lớp 9</SelectItem>
                  <SelectItem value="Lớp 10">Lớp 10</SelectItem>
                  <SelectItem value="Lớp 11">Lớp 11</SelectItem>
                  <SelectItem value="Lớp 12">Lớp 12</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Loại hình đánh giá</Label>
              <Select
                value={formData.type}
                onValueChange={(val) => handleSelectChange("type", val)}
              >
                <SelectTrigger id="type">
                  <SelectValue placeholder="Chọn loại hình" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Thuyết trình">Thuyết trình</SelectItem>
                  <SelectItem value="Báo cáo">Báo cáo</SelectItem>
                  <SelectItem value="Dự án">Dự án</SelectItem>
                  <SelectItem value="Bài kiểm tra">Bài kiểm tra</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="criteria">Số tiêu chí <span className="text-red-500">*</span></Label>
              <Select
                value={formData.criteria}
                onValueChange={(val) => handleSelectChange("criteria", val)}
              >
                <SelectTrigger id="criteria">
                  <SelectValue placeholder="Chọn số tiêu chí" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 tiêu chí</SelectItem>
                  <SelectItem value="4">4 tiêu chí</SelectItem>
                  <SelectItem value="5">5 tiêu chí</SelectItem>
                  <SelectItem value="6">6 tiêu chí</SelectItem>
                  <SelectItem value="7">7 tiêu chí</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Mô tả/Yêu cầu bổ sung (Prompt)</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Thêm các yêu cầu cụ thể về nội dung, kĩ năng..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
                    <Label>Tài liệu đính kèm (Tùy chọn)</Label>
                    <Card className="p-4 border-dashed bg-secondary/20">
                        {/* ⚠️ FIX: ĐOẠN CODE NÀY PHẢI ĐẢM BẢO HIỂN THỊ KHI attachedFile TỒN TẠI */}
                        {attachedFile ? (
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2 text-sm">
                                    <FileText className="w-5 h-5 text-primary" />
                                    <span className="truncate max-w-[200px]">{attachedFile.name}</span>
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={handleRemoveFile}
                                    disabled={isGenerating}
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        ) : (
                            // ⚠️ FIX: KHI KHÔNG CÓ FILE, HIỂN THỊ INPUT CHỌN FILE
                            <div className="flex flex-col items-center justify-center">
                                <label
                                    htmlFor="file-upload"
                                    className="flex flex-col items-center justify-center w-full h-16 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 dark:hover:bg-gray-600 dark:bg-gray-700 dark:border-gray-600 dark:hover:border-gray-500"
                                >
                                    <div className="flex items-center justify-center pt-2 pb-3 space-x-2">
                                        <Upload className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            Kéo thả file hoặc click để chọn 
                                        </p>
                                    </div>
                                    <input
                                        id="file-upload"
                                        type="file"
                                        accept=".pdf,.doc,.docx"
                                        className="hidden"
                                        onChange={handleFileChange}
                                    />
                                </label>
                            </div>
                        )}
                    </Card>
                </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isGenerating}>
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang tạo Rubrics...
                </>
              ) : (
                "Tạo Rubrics"
              )}
            </Button>
          </div>
        </form>
          </TabsContent>

          <TabsContent value="result" className="flex-1 flex flex-col mt-4 overflow-hidden">
            <div 
              className="flex-1 overflow-y-auto p-4 border rounded-lg bg-secondary/30 relative min-h-[400px] max-h-[calc(90vh-12rem)]"
              ref={(el) => {
                if (el) {
                  el.scrollTop = el.scrollHeight;
                }
              }}
              style={{
                overflowY: 'auto',
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(155, 155, 155, 0.5) transparent',
                WebkitOverflowScrolling: 'touch'
              }}
            >
              {isGenerating && !streamOutput && (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              )}

              <div className="prose max-w-none dark:prose-invert">
                {/* Progress info */}
                {isGenerating && (
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-sm font-medium text-primary">
                        {streamProgress.currentStep}
                      </p>
                      {streamProgress.criteriaCount > 0 && (
                        <span className="text-sm text-primary">
                          {streamProgress.criteriaCount} tiêu chí
                        </span>
                      )}
                    </div>
                    <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all duration-300"
                        style={{
                          width: `${Math.min(100, (streamProgress.criteriaCount / 5) * 100)}%`
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Criteria list */}
                {renderCriteria()}
              </div>
            </div>

            {/* Result actions */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setActiveTab("form")}
                disabled={isGenerating && !downloadToken}
              >
                Quay lại chỉnh sửa
              </Button>

              <Button 
                onClick={handleDownload}
                disabled={!downloadToken}
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                Tải xuống DOCX
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default RubricDialog;