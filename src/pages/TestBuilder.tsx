import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import TestDialog, { TestFormData } from "../components/TestDialog";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { FileText, Plus, BookOpen, CheckSquare, Download, Clock, Target } from "lucide-react";
import { useToast } from "../hooks/use-toast";
import Layout from "../components/Layout";

interface Quiz {
  _id: string;
  id?: string;
  title: string;
  subject?: { name: string; code: string };
  grade?: { level: number; name: string };
  questions: any[];
  settings?: { timeLimit: number };
  createdAt: string;
  difficulty?: string;
}

const TestBuilder = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [tests, setTests] = useState<
  {
    id: string;
    name: string;
    subject: string;
    grade: string;
    type: string;
    difficulty: string;
    questions: any[];
    duration: number;
    questionCount: number;
    downloadUrl?: string;
    date?: string;
  }[]
>([]);
  const [loading, setLoading] = useState(true);
  
  const FRONTEND_API = 'https://gemini.veronlabs.com/bot5';
  
  // Fetch quizzes from API
  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${FRONTEND_API}/api/v1/quizzes`, {
          credentials: 'include'
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            // Transform API data to component format
            const transformed = result.data.map((quiz: Quiz) => ({
              id: quiz._id || quiz.id,
              name: quiz.title || "Đề thi không có tiêu đề",
              subject: quiz.subject?.name || "Không xác định",
              grade: quiz.grade?.name || "Không xác định",
              type: "Trắc nghiệm",
              difficulty: quiz.difficulty || "Medium",
              questions: quiz.questions || [],
              duration: quiz.settings?.timeLimit || 45,
              questionCount: quiz.questions?.length || 0,
              date: formatDate(quiz.createdAt)
            }));
            setTests(transformed);
          }
        } else {
          console.warn('Không thể tải danh sách đề thi');
        }
      } catch (error) {
        console.error('Lỗi khi tải danh sách đề thi:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchQuizzes();
  }, []);
  
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

  const handleCreateTest = () => {
    setDialogOpen(true);
  };

  const handleSubmitTest = async (data: TestFormData) => {
    // Reload quizzes after creation (the save happens automatically in TestDialog)
    setTimeout(() => {
      const fetchQuizzes = async () => {
        try {
          const response = await fetch(`${FRONTEND_API}/api/v1/quizzes`, {
            credentials: 'include'
          });
          
          if (response.ok) {
            const result = await response.json();
            if (result.success && result.data) {
              const transformed = result.data.map((quiz: Quiz) => ({
                id: quiz._id || quiz.id,
                name: quiz.title || "Đề thi không có tiêu đề",
                subject: quiz.subject?.name || "Không xác định",
                grade: quiz.grade?.name || "Không xác định",
                type: "Trắc nghiệm",
                difficulty: quiz.difficulty || "Medium",
                questions: quiz.questions || [],
                duration: quiz.settings?.timeLimit || 45,
                questionCount: quiz.questions?.length || 0,
                date: formatDate(quiz.createdAt)
              }));
              setTests(transformed);
            }
          }
        } catch (error) {
          console.error('Lỗi khi tải lại danh sách đề thi:', error);
        }
      };
      
      fetchQuizzes();
    }, 2000); // Wait 2 seconds for save to complete
    
    toast({ title: "Đề kiểm tra đã được tạo thành công!" });
  };

  const testTypes = [
    {
      title: "Trắc nghiệm tự động",
      description: "AI tạo câu hỏi trắc nghiệm theo ma trận đề, phù hợp chuẩn đầu ra",
      icon: CheckSquare,
      color: "text-accent",
    },
    {
      title: "Tự luận có cấu trúc",
      description: "Câu hỏi tự luận với gợi ý rubrics đánh giá",
      icon: FileText,
      color: "text-primary",
    },
    {
      title: "Đề kiểm tra kết hợp",
      description: "Mix trắc nghiệm + tự luận, xuất PDF chuyên nghiệp",
      icon: BookOpen,
      color: "text-primary-light",
    },
  ];

  const stats = [
    { label: "Đề đã tạo", value: tests.length, icon: FileText, color: "text-primary" },
    { label: "Tổng câu hỏi", value: tests.reduce((sum, t) => sum + t.questions, 0), icon: Target, color: "text-accent" },
  ];

  return (
    <Layout>
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Tạo Đề Kiểm Tra
            </h1>
            <p className="text-muted-foreground">
              AI tự động tạo câu hỏi theo ma trận đề và chuẩn đầu ra
            </p>
          </div>
          <Button onClick={handleCreateTest} size="lg" className="gap-2">
            <Plus className="w-5 h-5" />
            Tạo đề mới
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stats.map((stat, idx) => (
            <Card key={idx}>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${stat.color} bg-opacity-10`}>
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Test Types */}
        <div>
          <h2 className="text-xl font-bold text-foreground mb-4">
            Loại đề kiểm tra
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {testTypes.map((type, index) => (
              <Card 
                key={index} 
                className="card-elevated hover:border-primary/30 transition-all cursor-pointer"
                onClick={handleCreateTest}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`p-2 rounded-lg ${type.color} bg-opacity-10`}>
                      <type.icon className={`w-6 h-6 ${type.color}`} />
                    </div>
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{type.title}</h3>
                  <p className="text-sm text-muted-foreground">{type.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent Tests */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-accent" />
              Đề kiểm tra gần đây
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-4 text-muted-foreground">Đang tải...</div>
            ) : tests.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">Chưa có đề thi nào</div>
            ) : (
              <div className="space-y-3">
                {tests.map((test) => (
                <div
                  key={test.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-secondary/50 transition-all cursor-pointer"
                  onClick={() => navigate(`/test-builder/${test.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-accent/10">
                      <FileText className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">{test.name}</h4>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Target className="w-3 h-3" />
                          {test.questions} câu
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {test.duration} phút
                        </span>
                        <span>• {test.date}</span>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={(e) => {
                    e.stopPropagation();
                    toast({ title: "Đang chuẩn bị file PDF..." });
                  }}>
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <TestDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmitTest}
      />
    </DashboardLayout>
    </Layout>
  );
};

export default TestBuilder;
