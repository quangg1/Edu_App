// RubricDetail.tsx

import { useParams, useNavigate, useLocation } from "react-router-dom"; 
import DashboardLayout from "../components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { ArrowLeft, Download, Share2, Target, Users, TrendingUp, CheckCircle2, Loader2, FileText } from "lucide-react";
import { useToast } from "../hooks/use-toast";
import Layout from "../components/Layout";

import React, { useMemo, useState, useEffect, useCallback, useRef } from "react";
// =========================================================================
// 1. INTERFACES (Đảm bảo đồng bộ với RubricDialog)
// =========================================================================

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

// Data trả về từ Stream
interface RubricStreamResponse {
  rubric_title?: string;
  subject?: string;
  grade_level?: string;
  assessment_type?: string;
  criteria?: RubricCriterionStream[];
  scale?: any; // RubricScale
  download_url?: string;
}

interface StudentResult {
  name: string;
  score: number | null;
  status: 'completed' | 'pending';
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
  criteria: { name: string; weight: number; description: string }[];
  rubricTable: { level: string; points: number; descriptions: string[] }[];
  studentResults: StudentResult[];
}

interface StreamProgress {
    isStreaming: boolean;
    currentStep: string;
    criteriaCount: number;
}

const RubricDetail = () => {
    // 2. HOOKS và DỮ LIỆU TỪ ROUTER
    const { id } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const location = useLocation();
    const hasStreamedRef = useRef(false);
    const isStreaming = location.state?.isStreaming as boolean || false;
    const streamParams = location.state?.streamParams as Record<string, string> | undefined;
    const initialRubricData = location.state?.initialRubricData as Rubric | undefined;
    const navigatedRubric = location.state?.newRubricData as Rubric | undefined; 
    const attachedFile = location.state?.attachedFile as File | null | undefined;

    // =========================================================================
    // 3. STATE VÀ REF MANAGEMENT
    // =========================================================================
    
    const mountedRef = useRef(true);
    const streamTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    
    const [rubricData, setRubricData] = useState<Rubric>(navigatedRubric || initialRubricData);
    const [isGenerating, setIsGenerating] = useState(() => isStreaming);
    const [streamProgress, setStreamProgress] = useState<StreamProgress>(() => ({ 
        isStreaming: isStreaming, 
        currentStep: isStreaming ? "Đang khởi tạo..." : "Sẵn sàng", 
        criteriaCount: 0 
    }));
    
    // Stream state management
    const finalRubricDataRef = useRef<Partial<RubricStreamResponse>>({});
    const abortControllerRef = useRef<AbortController | null>(null);
    const streamActiveRef = useRef(false);
    const [downloadToken, setDownloadToken] = useState<string | null>(null);

    // Cleanup effect
    useEffect(() => {
        // Set mounted flag
        mountedRef.current = true;
        // Cleanup function
        return () => {
            mountedRef.current = false;
            streamActiveRef.current = false;
            
            // Clear any pending timeouts
            if (streamTimeoutRef.current) {
                clearTimeout(streamTimeoutRef.current);
                streamTimeoutRef.current = null;
            }
            
            // Abort any active requests
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
                abortControllerRef.current = null;
            }
        };
    }, []);
    

    // =========================================================================
    // 4. UTILITY FUNCTIONS
    // =========================================================================
    
    const handleDownload = useCallback(() => {
      if (!downloadToken) return;
      
      const downloadUrl = `https://gemini.veronlabs.com/bot5/api/v1/rubrics/download/${downloadToken}`;
      
      const link = document.createElement('a');
      
      // 1. THỰC HIỆN FETCH ĐỂ LẤY BLOB
      fetch(downloadUrl, {
        method: 'GET',
        // Bạn có thể cần thêm các headers khác ở đây nếu backend yêu cầu xác thực.
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        }
      })
      .then(response => {
        if (!response.ok) {
          // Xử lý lỗi HTTP
          throw new Error(`Download failed: ${response.statusText}`);
        }
        return response.blob();
      })
      .then(blob => {
        // 2. TẠO URL CỤC BỘ TỪ BLOB VÀ KÍCH HOẠT DOWNLOAD
        const url = window.URL.createObjectURL(blob);
        link.href = url;
        // Đặt tên file
        link.download = `rubric_${downloadToken}.docx`; 
        document.body.appendChild(link);
        link.click();
        
        // 3. DỌN DẸP
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

    const generateRubricTable = useCallback((criteria: RubricCriterionStream[]): Rubric['rubricTable'] => {
      if (criteria.length === 0 || !criteria[0].levels) return [];
      
      const levels = criteria[0].levels;
      
      return levels.map(level => ({
          level: level.label,
          points: parseInt(level.score_range.split('-').pop() || '0'), 
          descriptions: criteria.map(c => 
              c.levels.find(l => l.label === level.label)?.description || 'N/A'
          ),
      }));
  }, []);


    // =========================================================================
    // 5. HÀM XỬ LÝ STREAM (handleStream) - ĐÃ SỬA LỖI JSON.parse
    // =========================================================================

const handleStream = useCallback(async (params: Record<string, string>, tempId: string, files: File | null) => {
    const streamEndpoint = "https://gemini.veronlabs.com/bot5/api/v1/rubrics/stream"; 
    
    // 1. Setup Controller & State - only if no active controller
    if (!abortControllerRef.current) {
        const controller = new AbortController();
        abortControllerRef.current = controller;
    }
    const signal = abortControllerRef.current.signal;
    
    setIsGenerating(true);
    setStreamProgress({ isStreaming: true, currentStep: "Đang kết nối...", criteriaCount: 0 });
    finalRubricDataRef.current = {}; 

    try {
        const form = new FormData();
        Object.entries(params).forEach(([key, value]) => {
            if (value) form.append(key, value);
        });
        if (files) {
            form.append("files", files, files.name); 
        }

        const response = await fetch(streamEndpoint, {
            method: "POST",
            body: form,
            credentials: 'include',
            signal: signal,
        });

        if (!response.ok || !response.body) {
            throw new Error(`Stream failed: ${response.statusText}`);
        }

        // 2. Xử lý Stream/SSE
        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = "";
        let eventBoundary = -1;
        // Danh sách các event gửi chuỗi thuần túy (gây lỗi JSON.parse)
        const simpleStringEvents = ['rubric_rubric_title', 'rubric_subject', 'rubric_grade_level', 'rubric_assessment_type'];

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });

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
                    let data: any;
                    let isSimpleString = false;
                  
                    if (simpleStringEvents.includes(eventType)) {
                        data = dataString; // Gán thẳng chuỗi văn bản
                        isSimpleString = true;
                    } else {
                        try {
                            data = JSON.parse(dataString); // Parse JSON
                        } catch (err) {
                            console.error('❌ Error parsing data for event:', eventType, err, dataString);
                            continue; 
                        }
                    }

                    // 3. Xử lý Event và Cập nhật Ref
                    if (eventType === 'error') {
                        toast({ title: "Lỗi Stream", description: (data as any)?.message || "Đã xảy ra lỗi không xác định.", variant: "destructive" });
                        setIsGenerating(false);
                        return;
                    } else if (eventType === 'status') {
                        setStreamProgress(prev => ({ ...prev, currentStep: (data as any)?.message }));
                    } else if (eventType.startsWith('rubric_')) {
                        const fieldName = eventType.substring('rubric_'.length);

                        if (isSimpleString) {
                            // Cập nhật các trường chuỗi đơn giản
                            const targetKey = fieldName.includes('title') ? 'rubric_title' : fieldName.replace('_level', ''); 
                            (finalRubricDataRef.current as any)[targetKey] = data; 
                        } 
                        else if (data && typeof data === 'object') { 
                            // Cập nhật các trường JSON phức tạp
                            if (fieldName === 'criteria') {
                                finalRubricDataRef.current.criteria = data as RubricCriterionStream[];
                            } else if (fieldName === 'scale') {
                                finalRubricDataRef.current.scale = data;
                            } else if (fieldName === 'download_url') {
                              console.log('📥 Processing download_url event:', data);
                              
                              // Extract URL from data
                              const downloadUrl = typeof data === 'string' ? data : 
                                                 (typeof data === 'object' && data?.url) ? data.url : null;
                              
                              if (downloadUrl) {
                                  // Get the last part after last /
                                  const token = downloadUrl.split('/').pop();
                                  
                                  if (token) {
                                      console.log('✅ Extracted token:', {
                                          downloadUrl,
                                          token
                                      });
                                      
                                      setDownloadToken(token);
                                      setIsGenerating(false);
                                      toast({
                                          title: "Thành công",
                                          description: "Đã tạo Rubric thành công!",
                                          variant: "default"
                                      });
                                  } else {
                                      console.error('❌ Failed to extract token from URL:', downloadUrl);
                                  }
                              } else {
                                  console.error('❌ Invalid download_url data:', data);
                              }
                            } else if (fieldName === 'json') {
                                finalRubricDataRef.current = { ...finalRubricDataRef.current, ...data };
                            }
                        }

                        if (finalRubricDataRef.current.criteria) {
                            if (streamTimeoutRef.current) {
                              clearTimeout(streamTimeoutRef.current);
                          }
                            const finalCriteria = finalRubricDataRef.current.criteria as RubricCriterionStream[];
                            console.log( finalCriteria.length);
                            const criteriaCountTarget = parseInt(params.number_of_criteria || "5") || 5;
                            streamTimeoutRef.current = setTimeout(() => {
                              setRubricData(prev => {
                                  const base = prev.id === tempId ? prev : (initialRubricData ) as Rubric; 
                                  
                                  const updatedRubric: Rubric = {
                                      ...base,
                                      name: finalRubricDataRef.current.rubric_title || base.name,
                                      subject: finalRubricDataRef.current.subject || base.subject,
                                      grade: finalRubricDataRef.current.grade || base.grade, 
                                      type: finalRubricDataRef.current.assessment_type || base.type,
                                      
                                      criteria: finalCriteria.map(c => ({ 
                                          name: c.name, 
                                          weight: c.weight_percent, 
                                          description: c.description || "" 
                                      })),
                                      rubricTable: finalCriteria.length > 0 ? generateRubricTable(finalCriteria) : [],
                                      progress: Math.min(100, Math.floor(finalCriteria.length / criteriaCountTarget * 80) + 10),
                                  };
                                  return updatedRubric;
                              });
                              
                              setStreamProgress(prev => ({ 
                                  ...prev, 
                                  criteriaCount: finalCriteria.length, 
                                  currentStep: `Đã nhận ${finalCriteria.length} tiêu chí đánh giá` 
                              }));
                              streamTimeoutRef.current = null;
                        }, 200);
                    }
                }
            }
        }
      }
    } catch (error) {
        if (!mountedRef.current) return;

        if (error instanceof Error) {
            if (error.name === 'AbortError') {
                console.log('Fetch aborted by user/cleanup.');
            } else {
                toast({ 
                    title: 'Lỗi kết nối', 
                    description: error.message || 'Không thể kết nối đến máy chủ AI.', 
                    variant: 'destructive' 
                });
            }
        } else {
            toast({ 
                title: 'Lỗi không xác định', 
                description: 'Đã xảy ra lỗi trong quá trình xử lý.', 
                variant: 'destructive' 
            });
        }
    } finally {
        if (!mountedRef.current) return;

        // Clear stream state
        streamActiveRef.current = false;
        abortControllerRef.current = null;
        
        // Update UI state
        setIsGenerating(false);
        setStreamProgress(prev => ({ 
            ...prev, 
            currentStep: "Hoàn thành.", 
            isStreaming: false 
        }));
        
        // Final rubric update
        setRubricData(prev => ({ 
            ...prev, 
            progress: 100, 
            id: id || tempId 
        }));
        
        // Only show success toast if we have received criteria
        if (finalRubricDataRef.current.criteria?.length) {
            toast({ 
                title: "Hoàn thành", 
                description: "Đã tạo Rubrics thành công!", 
                variant: "success" 
            });
        }
    }
},[
      id, 
      toast, 
      generateRubricTable,
      initialRubricData, // ⚠️ Cần thêm 'initialRubricData' vào dependencies
]);


    // =========================================================================
    // 6. USE EFFECT (Khởi chạy Stream)
    // =========================================================================

    // Monitor downloadToken changes
    useEffect(() => {
        console.log('downloadToken changed:', downloadToken);
    }, [downloadToken]);

    // Split the effects to avoid race conditions
    useEffect(() => {
        // Reset the stream flag when component unmounts
        return () => {
            hasStreamedRef.current = false;
        };
    }, []);

    useEffect(() => {
  
      const shouldStartStreaming = isStreaming && streamParams && !hasStreamedRef.current;
      
      if (!shouldStartStreaming) {
          // Log để debug khi nào useEffect KHÔNG chạy stream
          console.log('Stream check failed. isStreaming:', isStreaming, 'hasStreamedRef.current:', hasStreamedRef.current);
          return;
      }
  
      // Đặt cờ ngay lập tức để ngăn lần chạy tiếp theo (khi HMR xảy ra)
      hasStreamedRef.current = true; // <--- Cần đặt CỜ NÀY VĨNH VIỄN trong quá trình phát triển
  
      let isCurrentEffect = true;
      console.log('Starting stream with params:', streamParams);
      
      const startStreaming = async () => {
          const tempId = id || 'temp-' + Date.now();
  
          try {
              // ... (Phần cập nhật state ban đầu và gọi handleStream) ...
              await handleStream(streamParams, tempId, attachedFile || null);
          } catch (error) {
              console.error('Streaming error:', error);
              // hasStreamedRef.current = false; // Xóa dòng này nếu bạn muốn ngăn chạy lại sau HMR
          }
      };
  
      startStreaming();
  
      // Cleanup function - giữ nguyên để hủy fetch request
      return () => {
        isCurrentEffect = false;
          if (abortControllerRef.current) {
              console.log('Aborting current stream');
              abortControllerRef.current.abort();
              abortControllerRef.current = null;
          }
      };
  }, [id, handleStream, streamParams, attachedFile, isStreaming]);

    // =========================================================================
    // 7. RENDER LOGIC (JSX)
    // =========================================================================
    
    const renderCriteria = () => {
      if (rubricData.criteria.length === 0 && !isGenerating) {
          return <p className="text-center text-muted-foreground py-8">Chưa có tiêu chí đánh giá nào.</p>;
      }
      
      return (
          <div className="space-y-6">
              {rubricData.criteria.map((c, index) => (
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
                              {c.weight}%
                          </Badge>
                      </div>
                      <div className="border-l-4 border-primary/70 pl-4 py-2 bg-primary/5 rounded-r-lg">
                          <p className="text-sm text-muted-foreground italic">
                              Mô tả tổng quát:
                          </p>
                          <p className="text-sm text-foreground mt-1 leading-relaxed">
                              {c.description}
                          </p>
                      </div>
                  </div>
              ))}
              <p className="text-xs text-muted-foreground pt-2 text-right italic">
                  * Tổng trọng số: {rubricData.criteria.reduce((sum, c) => sum + c.weight, 0)}%
              </p>
          </div>
      );
  };

    // Hàm hiển thị bảng Rubric chi tiết
    const renderRubricTable = () => {
      if (rubricData.rubricTable.length === 0) {
          return <p className="text-center text-muted-foreground py-8">Chưa có bảng đánh giá chi tiết.</p>;
      }
      
      const firstRow = rubricData.rubricTable[0];
      const numCriteria = firstRow.descriptions.length;
      
      return (
          <div className="overflow-x-auto border rounded-xl shadow-lg">
              <Table className="min-w-full table-fixed">
                  {/* Header được làm nổi bật và dính (sticky) để cải thiện trải nghiệm cuộn ngang */}
                  <TableHeader className="sticky top-0 bg-muted/70 z-10 border-b">
                      <TableRow className="hover:bg-muted/70">
                          <TableHead className="w-[10%] min-w-[80px] font-extrabold text-primary border-r sticky left-0 z-20 bg-muted/70">Mức độ</TableHead>
                          <TableHead className="w-[5%] min-w-[50px] text-right font-extrabold text-primary border-r sticky left-[80px] z-20 bg-muted/70">Điểm</TableHead>
                          {/* Render tiêu đề các tiêu chí */}
                          {rubricData.criteria.map((c, idx) => (
                              <TableHead 
                                  key={idx} 
                                  className="w-[calc(85% / numCriteria)] font-bold text-foreground text-center"
                              >
                                  {c.name} ({c.weight}%)
                              </TableHead>
                          ))}
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {rubricData.rubricTable.map((row, rowIndex) => (
                          <TableRow 
                              key={rowIndex} 
                              className="align-top border-t transition-colors hover:bg-primary/5"
                          >
                              {/* Cột Mức độ và Điểm được cố định vị trí (sticky) */}
                              <TableCell className="font-extrabold text-foreground border-r p-4 sticky left-0 z-10 bg-background/90 backdrop-blur-sm">
                                  {row.level}
                              </TableCell>
                              <TableCell className="text-right font-extrabold text-lg text-primary border-r p-4 sticky left-[80px] z-10 bg-background/90 backdrop-blur-sm">
                                  {row.points}
                              </TableCell>
                              {row.descriptions.map((desc, colIndex) => (
                                  <TableCell 
                                      key={colIndex} 
                                      className="text-sm leading-relaxed p-4 border-l border-gray-200 dark:border-gray-700"
                                  >
                                      <div className="p-3 bg-secondary/30 rounded-lg h-full">
                                          {desc}
                                      </div>
                                  </TableCell>
                              ))}
                          </TableRow>
                      ))}
                  </TableBody>
              </Table>
          </div>
      );
  };


    return (
        <Layout>
            <DashboardLayout>
                <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
                    <div className="flex items-center justify-between mb-6">
                        <Button variant="ghost" onClick={() => navigate(-1)} className="flex items-center gap-2">
                            <ArrowLeft className="w-5 h-5" />
                            <span>Quay lại</span>
                        </Button>
                        <div className="space-x-2">
                            <Button variant="outline" disabled={isGenerating}>
                                <Share2 className="w-4 h-4 mr-2" />
                                Chia sẻ
                            </Button>
                            <Button
                                variant="outline"
                                onClick={downloadToken ? handleDownload : undefined}
                                className="flex items-center gap-2"
                                disabled={!downloadToken}
                            >
                                <Download className="w-4 h-4" />
                                Tải xuống
                            </Button>
                        </div>
                    </div>

                    {/* Tiêu đề và Tóm tắt Rubric */}
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle className="text-2xl font-bold">{rubricData.name}</CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                                **{rubricData.subject}** • {rubricData.grade} • {rubricData.type}
                            </p>
                            <div className="mt-2 flex items-center gap-2">
                                <Badge variant="secondary" className="flex items-center gap-1">
                                    <Users className="w-3 h-3" /> {rubricData.students} Học sinh
                                </Badge>
                                <Badge variant="secondary" className="flex items-center gap-1">
                                    <TrendingUp className="w-3 h-3" /> {rubricData.progress}% Hoàn thành
                                </Badge>
                                <Badge variant="secondary" className="flex items-center gap-1">
                                    <FileText className="w-3 h-3" /> {rubricData.criteria.length} Tiêu chí
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-foreground">{rubricData.description}</p>
                            
                            {/* Thanh tiến trình */}
                            {isGenerating && (
                                <div className="mt-4">
                                    <div className="flex justify-between items-center mb-1">
                                        <p className="text-sm font-medium text-primary">Đang tạo Rubrics...</p>
                                        <span className="text-sm text-primary">{rubricData.progress}%</span>
                                    </div>
                                    <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-primary transition-all duration-300"
                                            style={{ width: `${rubricData.progress}%` }}
                                        ></div>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">{streamProgress.currentStep}</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Tabs cho Chi tiết */}
                    <Tabs defaultValue="criteria" className="w-full">
                        <TabsList className="grid w-full grid-cols-3 max-w-lg">
                            <TabsTrigger value="criteria">Tiêu chí</TabsTrigger>
                            <TabsTrigger value="table">Bảng Đánh giá</TabsTrigger>
                            <TabsTrigger value="results">Kết quả</TabsTrigger>
                        </TabsList>

                        <TabsContent value="criteria" className="mt-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Tiêu chí Đánh giá ({rubricData.criteria.length})</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {renderCriteria()}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="table" className="mt-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Bảng Đánh giá Chi tiết</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {renderRubricTable()}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="results" className="mt-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Kết quả Đánh giá Học sinh ({rubricData.studentResults.length})</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {rubricData.studentResults.map((result, index) => (
                                            <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-lg ${
                                                        result.status === 'completed' ? 'bg-primary/10' : 'bg-muted'
                                                    }`}>
                                                        {result.status === 'completed' ? (
                                                            <CheckCircle2 className="w-5 h-5 text-primary" />
                                                        ) : (
                                                            <Target className="w-5 h-5 text-muted-foreground" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-semibold text-foreground">{result.name}</h4>
                                                        <p className="text-sm text-muted-foreground">
                                                            {result.status === 'completed' ? 'Đã hoàn thành' : 'Chưa đánh giá'}
                                                        </p>
                                                    </div>
                                                </div>
                                                {/* Đảm bảo hiển thị điểm 0 */}
                                                {result.score !== null && ( 
                                                    <div className="text-right">
                                                        <p className="text-2xl font-bold text-foreground">{result.score}</p>
                                                        <p className="text-xs text-muted-foreground">điểm</p>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </DashboardLayout>
        </Layout>
    );
};

export default RubricDetail;