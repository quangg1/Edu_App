import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import ShareDialog from "../components/ShareDialog";
import ExportDialog from "../components/ExportDialog";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { ArrowLeft, Download, Share2, FileText, Clock, Target, CheckCircle2, Loader2 } from "lucide-react";
import { fetchClient } from "../api/fetchClient";
import { useToast } from "../hooks/use-toast";
import Layout from "../components/Layout";
import MarkdownRenderer from '../components/MarkdownRenderer';
interface Quiz {
  _id: string;
  title: string;
  subject?: { name: string; code: string };
  grade?: { level: number; name: string };
  questions: any[];
  settings?: { timeLimit: number };
  createdAt: string;
  difficulty?: string;
  downloadUrl?: string;
  downloadToken?: string;
}

const TestDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuiz = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const response = await fetchClient(`/api/v1/quizzes/${id}`, {
          method: 'GET',
          credentials: 'include'
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            setQuiz(result.data);
          } else {
            setError('Không tìm thấy đề thi');
          }
        } else {
          setError('Không thể tải đề thi');
        }
      } catch (err) {
        console.error('Error fetching quiz:', err);
        setError('Lỗi khi tải đề thi');
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [id]);

  if (loading) {
    return (
      <Layout>
        <DashboardLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </DashboardLayout>
      </Layout>
    );
  }

  if (error || !quiz) {
    return (
      <Layout>
        <DashboardLayout>
          <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
            <p className="text-muted-foreground">{error || 'Không tìm thấy đề thi'}</p>
            <Button onClick={() => navigate("/test-builder")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Quay lại
            </Button>
          </div>
        </DashboardLayout>
      </Layout>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return date.toLocaleDateString('vi-VN');
  };

  // Transform questions from database format to display format
  const transformQuestions = () => {
    if (!quiz.questions || quiz.questions.length === 0) return [];

    const sections: any[] = [];
    const multipleChoice: any[] = [];
    const essay: any[] = [];

    quiz.questions.forEach((q: any, index: number) => {
      const questionItem = {
        id: q.questionNumber || index + 1,
        question: q.questionText || '',
        options: q.options?.map((opt: any) => {
          if (typeof opt === 'object' && opt.optionKey && opt.optionText) {
            return `${opt.optionKey}. ${opt.optionText}`;
          }
          return String(opt);
        }) || [],
        correctAnswer: q.correctAnswer,
        explanation: q.explanation || '',
        points: 1,
        difficulty: q.difficulty || 'medium'
      };

      if (q.questionType === 'multiple-choice' || q.questionType === 'true-false') {
        multipleChoice.push(questionItem);
      } else {
        essay.push(questionItem);
      }
    });

    if (multipleChoice.length > 0) {
      sections.push({
        section: `Phần I: Trắc nghiệm (${multipleChoice.length} câu)`,
        items: multipleChoice
      });
    }

    if (essay.length > 0) {
      sections.push({
        section: `Phần II: Tự luận (${essay.length} câu)`,
        items: essay.map(item => ({
          ...item,
          rubric: item.explanation || 'Chưa có hướng dẫn chấm'
        }))
      });
    }

    return sections;
  };

  const questions = transformQuestions();
  const test = {
    id: quiz._id,
    title: quiz.title,
    subject: quiz.subject?.name || "Không xác định",
    grade: quiz.grade?.name || "Không xác định",
    type: "Trắc nghiệm",
    questionCount: quiz.questions?.length || 0,
    duration: quiz.settings?.timeLimit || 45,
    difficulty: quiz.difficulty || "Trung bình",
    createdAt: formatDate(quiz.createdAt),
    downloadUrl: quiz.downloadUrl
  };

  // Generate answer key from questions
  const answerKey = questions.flatMap(section => 
    section.items
      .filter((item: any) => item.correctAnswer)
      .map((item: any) => ({
        question: item.id,
        answer: item.correctAnswer,
        explanation: item.explanation || 'Chưa có giải thích'
      }))
  );

  return (
    <Layout>
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/test-builder")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-foreground mb-2">{test.title}</h1>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{test.subject}</Badge>
              <Badge variant="secondary">{test.grade}</Badge>
              <Badge variant="secondary">{test.type}</Badge>
              <Badge variant="outline">{test.difficulty}</Badge>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              className="gap-2"
              onClick={() => setShareDialogOpen(true)}
            >
              <Share2 className="w-4 h-4" />
              Chia sẻ
            </Button>
            <Button 
              className="gap-2"
              onClick={() => {
                if (test.downloadUrl) {
                  window.open(test.downloadUrl, '_blank');
                } else {
                  setExportDialogOpen(true);
                }
              }}
            >
              <Download className="w-4 h-4" />
              {test.downloadUrl ? 'Tải xuống' : 'Xuất PDF'}
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Số câu hỏi</p>
                  <p className="text-2xl font-bold text-foreground">{test.questionCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-accent/10">
                  <Clock className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Thời gian</p>
                  <p className="text-2xl font-bold text-foreground">{test.duration}'</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary-light/10">
                  <Target className="w-5 h-5 text-primary-light" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Tổng điểm</p>
                  <p className="text-2xl font-bold text-foreground">10.0</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-accent-light/10">
                  <CheckCircle2 className="w-5 h-5 text-accent-light" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Trạng thái</p>
                  <p className="text-sm font-semibold text-foreground">Sẵn sàng</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Content Tabs */}
        <Tabs defaultValue="questions" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="questions">Câu hỏi</TabsTrigger>
            <TabsTrigger value="answer-key">Đáp án</TabsTrigger>
            <TabsTrigger value="info">Thông tin</TabsTrigger>
          </TabsList>

          <TabsContent value="questions" className="space-y-6">
            {questions.map((section, idx) => (
              <Card key={idx}>
                <CardHeader>
                  <CardTitle className="text-lg">{section.section}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {section.items.map((item) => (
                    <div key={item.id} className="pb-6 border-b border-border last:border-0 last:pb-0">
                      <div className="flex items-start gap-3 mb-3">
                        <Badge variant="outline">Câu {item.id}</Badge>
                        <Badge variant="secondary">{item.points} điểm</Badge>
                      </div>
                      <MarkdownRenderer content={item.question} className="font-medium text-foreground mb-3" />
                      {'options' in item && (
                        <div className="space-y-2 ml-6">
                          {item.options.map((option, i) => (
                            <p key={i} className="text-sm text-muted-foreground">
                            <MarkdownRenderer content={option} className="inline" inline={true} />
                            </p>
                          ))}
                        </div>
                      )}
                      {'rubric' in item && (
                        <div className="ml-6 p-3 bg-secondary/50 rounded-lg">
                          <p className="text-sm text-muted-foreground">
                          <span className="font-semibold text-foreground">Hướng dẫn chấm:</span>
                          <MarkdownRenderer content={item.rubric} className="inline" inline={true} />
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="answer-key">
            <Card>
              <CardHeader>
                <CardTitle>Đáp án chi tiết</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {answerKey.map((item) => (
                  <div key={item.question} className="p-4 rounded-lg border border-border">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge>Câu {item.question}</Badge>
                      <Badge variant="default">Đáp án: {item.answer}</Badge>
                    </div>
                    <MarkdownRenderer 
                      content={item.explanation} 
                      className="text-sm text-muted-foreground" 
                      inline={true} 
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="info">
            <Card>
              <CardHeader>
                <CardTitle>Thông tin đề kiểm tra</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Môn học</p>
                    <p className="font-semibold text-foreground">{test.subject}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Khối lớp</p>
                    <p className="font-semibold text-foreground">{test.grade}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Loại đề</p>
                    <p className="font-semibold text-foreground">{test.type}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Độ khó</p>
                    <p className="font-semibold text-foreground">{test.difficulty}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground mb-1">Chủ đề kiểm tra</p>
                    <p className="font-semibold text-foreground">{test.topics}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Ngày tạo</p>
                    <p className="font-semibold text-foreground">{test.createdAt}</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-border">
                  <h4 className="font-semibold text-foreground mb-3">Ma trận đề</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between p-2 rounded bg-secondary/50">
                      <span className="text-sm text-muted-foreground">Nhận biết (40%)</span>
                      <span className="text-sm font-medium text-foreground">10 câu - 4 điểm</span>
                    </div>
                    <div className="flex justify-between p-2 rounded bg-secondary/50">
                      <span className="text-sm text-muted-foreground">Thông hiểu (30%)</span>
                      <span className="text-sm font-medium text-foreground">8 câu - 3 điểm</span>
                    </div>
                    <div className="flex justify-between p-2 rounded bg-secondary/50">
                      <span className="text-sm text-muted-foreground">Vận dụng (30%)</span>
                      <span className="text-sm font-medium text-foreground">7 câu - 3 điểm</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <ShareDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        testTitle={test.title}
        testId={test.id || ""}
      />

      <ExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        testTitle={test.title}
      />
    </DashboardLayout>
    </Layout>
  );
};

export default TestDetail;
