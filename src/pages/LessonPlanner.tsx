import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { BookOpen, Plus, Sparkles, BookMarked, FileCheck, Clock } from "lucide-react";
import { useToast } from "../components/ui/use-toast";
import { Badge } from "../components/ui/badge";
import  Layout  from "../components/Layout";
import LessonPlanDialog, { LessonPlanFormData } from "../components/LessonPlanDialog";

interface TeachingMethod {
    id: string;
    title: string;
    description: string;
    example: string;
}

interface LessonPlan {
  _id: string;
  id?: string;
  title: string;
  chapter?: string;
  grade?: { level: number; name: string };
  subject?: { name: string; code: string };
  status: string;
  createdAt: string;
  progress?: number;
}

const LessonPlanner = () => {
  const { toast } = useToast();
  const [selectedMethod, setSelectedMethod] = useState<TeachingMethod | null>(null);
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [lessons, setLessons] = useState<LessonPlan[]>([]);
  const [loading, setLoading] = useState(true);
  
  const FRONTEND_API = 'https://gemini.veronlabs.com/bot5';
  
  // Fetch lesson plans from API
  useEffect(() => {
    const fetchLessonPlans = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${FRONTEND_API}/api/v1/lesson-plans`, {
          credentials: 'include'
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            // Transform API data to component format
            const transformed = result.data.map((lp: LessonPlan) => ({
              id: lp._id || lp.id,
              title: lp.title || "Giáo án không có tiêu đề",
              subtitle: lp.chapter ? `Chương ${lp.chapter}` : "",
              grade: lp.grade?.name || "Không xác định",
              subject: lp.subject?.name || "Không xác định",
              date: formatDate(lp.createdAt),
              status: lp.status === 'completed' ? 'Hoàn thành' : 'Đang soạn',
              progress: lp.status === 'completed' ? 100 : 75,
            }));
            setLessons(transformed);
          }
        } else {
          console.warn('Không thể tải danh sách giáo án');
        }
      } catch (error) {
        console.error('Lỗi khi tải danh sách giáo án:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchLessonPlans();
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
  const teachingMethods = [
    {
      id: "ctgdpt",
      title: "CTGDPT 2018",
      description: "Định hướng phát triển năng lực, lấy học sinh làm trung tâm. Chú trọng hoạt động trải nghiệm và năng lực vận dụng thực tế.",
      example: "Ví dụ: Học sinh tự khám phá kiến thức qua hoạt động nhóm, thảo luận tình huống thực tế."
    },
    {
      id: "5e",
      title: "Phương pháp 5E",
      description: "Gồm 5 giai đoạn: Engage, Explore, Explain, Elaborate, Evaluate. Giúp học sinh hình thành kiến thức qua trải nghiệm.",
      example: "Ví dụ: Giáo viên khởi động bằng câu hỏi mở, sau đó để học sinh tự tìm hiểu và trình bày."
    },
    {
      id: "stem",
      title: "Tích hợp STEM",
      description: "Tích hợp kiến thức Khoa học, Công nghệ, Kỹ thuật, Toán học vào bài học, gắn với đời sống thực tiễn.",
      example: "Ví dụ: Học sinh chế tạo mô hình máy lọc nước mini để hiểu nguyên lý lọc."
    },
    {
      id: "pbl",
      title: "Project-Based Learning (PBL)",
      description: "Học sinh học qua dự án, giải quyết vấn đề thực tế bằng hợp tác nhóm, sáng tạo và trình bày kết quả.",
      example: "Ví dụ: Dự án thiết kế kế hoạch tiết kiệm năng lượng cho trường học."
    },
    {
      id: "bloom",
      title: "Phân loại Bloom",
      description: "Xây dựng mục tiêu học tập dựa trên 6 cấp độ nhận thức: Nhớ, Hiểu, Vận dụng, Phân tích, Đánh giá, Sáng tạo.",
      example: "Ví dụ: Mục tiêu cấp cao là học sinh có thể phân tích và đánh giá giải pháp thay thế."
    }
  ];

  const handleCreateLesson = () => {
    setDialogOpen(true);
  };
  const handleSelectMethod = (method: TeachingMethod) => {
    setSelectedMethod(method);
    setDialogOpen(true);
  };

  const handleSubmitLesson = (data: LessonPlanFormData) => {
    // Reload lesson plans after creation (the save happens automatically in LessonPlanDialog)
    setTimeout(() => {
      const fetchLessonPlans = async () => {
        try {
          const response = await fetch(`${FRONTEND_API}/api/v1/lesson-plans`, {
            credentials: 'include'
          });
          
          if (response.ok) {
            const result = await response.json();
            if (result.success && result.data) {
              const transformed = result.data.map((lp: LessonPlan) => ({
                id: lp._id || lp.id,
                title: lp.title || "Giáo án không có tiêu đề",
                subtitle: lp.chapter ? `Chương ${lp.chapter}` : "",
                grade: lp.grade?.name || "Không xác định",
                subject: lp.subject?.name || "Không xác định",
                date: formatDate(lp.createdAt),
                status: lp.status === 'completed' ? 'Hoàn thành' : 'Đang soạn',
                progress: lp.status === 'completed' ? 100 : 75,
              }));
              setLessons(transformed);
            }
          }
        } catch (error) {
          console.error('Lỗi khi tải lại danh sách giáo án:', error);
        }
      };
      
      fetchLessonPlans();
    }, 2000); // Wait 2 seconds for save to complete
    
    toast({
      title: "Tạo giáo án thành công!",
      description: `AI đã tạo giáo án "${data.title}" cho bạn.`,
    });
  };

  const lessonTypes = [
    {
      title: "Theo chuẩn CTGDPT 2018",
      description: "Giáo án định hướng phát triển năng lực và phẩm chất",
      icon: BookOpen,
      color: "text-primary",
      badge: "Phổ biến",
    },
    {
      title: "Theo phương pháp 5E",
      description: "Engage - Explore - Explain - Elaborate - Evaluate",
      icon: Sparkles,
      color: "text-accent",
      badge: "Khám phá",
    },
    {
      title: "Dạy học tích hợp STEM",
      description: "Tích hợp khoa học, công nghệ, kỹ thuật, toán học",
      icon: BookMarked,
      color: "text-primary-light",
      badge: "Sáng tạo",
    },
  ];


  const quickTemplates = [
    { name: "Toán - THCS", count: 12, icon: BookOpen },
    { name: "Văn - THPT", count: 8, icon: BookMarked },
    { name: "Khoa học tự nhiên", count: 15, icon: Sparkles },
    { name: "Lịch sử - Địa lý", count: 6, icon: FileCheck },
  ];

  return (
    <Layout>
      <DashboardLayout>
        <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Soạn Giáo Án
            </h1>
            <p className="text-muted-foreground">
              AI tự động tạo giáo án theo chuẩn năng lực và phương pháp dạy học hiện đại
            </p>
          </div>
          <Button onClick={handleCreateLesson} size="lg" className="gap-2">
            <Plus className="w-5 h-5" />
            Tạo giáo án mới
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="card-elevated">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <BookOpen className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">12</p>
                <p className="text-xs text-muted-foreground">Giáo án đã tạo</p>
              </div>
            </CardContent>
          </Card>
          <Card className="card-elevated">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/10">
                <FileCheck className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">8</p>
                <p className="text-xs text-muted-foreground">Hoàn thành tuần này</p>
              </div>
            </CardContent>
          </Card>
          <Card className="card-elevated">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary-light/10">
                <Clock className="w-5 h-5 text-primary-light" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">18h</p>
                <p className="text-xs text-muted-foreground">Tiết kiệm thời gian</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lesson Types */}
        <div>
          <h2 className="text-xl font-bold text-foreground mb-4">
            Chọn phương pháp dạy học
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {teachingMethods.map((method, index) => (
              <Card
                key={index}
                className="card-elevated hover:border-primary/30 transition-all cursor-pointer"
                onClick={() => handleSelectMethod(method)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Sparkles className="w-6 h-6 text-primary" />
                    </div>
                    <Badge variant="secondary" className="text-xs">Chi tiết</Badge>
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{method.title}</h3>
                  <p className="text-sm text-muted-foreground">{method.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Quick Templates */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookMarked className="w-5 h-5 text-primary" />
              Mẫu giáo án nhanh
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {quickTemplates.map((template, index) => (
                <div
                  key={index}
                  className="p-4 rounded-lg border border-border hover:bg-secondary/50 transition-all cursor-pointer text-center"
                  onClick={handleCreateLesson}
                >
                  <template.icon className="w-8 h-8 text-primary mx-auto mb-2" />
                  <h4 className="font-semibold text-sm text-foreground mb-1">{template.name}</h4>
                  <p className="text-xs text-muted-foreground">{template.count} mẫu</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Lessons */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Giáo án gần đây
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-4 text-muted-foreground">Đang tải...</div>
            ) : lessons.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">Chưa có giáo án nào</div>
            ) : (
              <div className="space-y-3">
                {lessons.map((lesson) => (
                  <div
                    key={lesson.id}
                    className="p-4 rounded-lg border border-border hover:bg-secondary/50 transition-all cursor-pointer"
                    onClick={() => navigate(`/lesson-planner/${lesson.id}`)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <BookOpen className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground">{lesson.title}</h4>
                          <p className="text-sm text-muted-foreground">{lesson.subtitle}</p>
                        </div>
                      </div>
                      <Badge variant={lesson.status === "Hoàn thành" ? "default" : "secondary"}>
                        {lesson.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground ml-14 mb-2">
                      <span>{lesson.grade}</span>
                      <span>•</span>
                      <span>{lesson.subject}</span>
                      <span>•</span>
                      <span>{lesson.date}</span>
                    </div>
                    {lesson.progress < 100 && (
                      <div className="flex items-center gap-2 ml-14">
                        <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all"
                            style={{ width: `${lesson.progress}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-muted-foreground">{lesson.progress}%</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI Assistant Info */}
        <Card className="card-elevated border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl gradient-primary">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-foreground mb-2">
                  💡 Mẹo sử dụng AI Lesson Planner
                </h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Nhập rõ chủ đề, lớp học và yêu cầu cụ thể</li>
                  <li>• Chọn mức độ Bloom phù hợp với năng lực học sinh</li>
                  <li>• AI sẽ gợi ý hoạt động học tập phù hợp với từng giai đoạn</li>
                  <li>• Bạn có thể chỉnh sửa và tùy chỉnh sau khi AI tạo xong</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        <LessonPlanDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onSubmit={handleSubmitLesson}
          selectedMethod={selectedMethod}
        />
        </div>
      </DashboardLayout>
    </Layout>
  );
};

export default LessonPlanner;
