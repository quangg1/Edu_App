import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Separator } from "../components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { ArrowLeft, Download, Edit, Share2, CheckCircle, Clock, Target, BookOpen, Lightbulb, Users, Loader2 } from "lucide-react";
import { useToast } from "../components/ui/use-toast";
import { fetchClient } from "../api/fetchClient";
import Layout from "../components/Layout";

interface LessonPlan {
  _id: string;
  title: string;
  chapter?: string;
  subject?: { name: string; code: string };
  grade?: { level: number; name: string };
  status: string;
  createdAt: string;
  notes?: string;
  objectives?: {
    knowledge?: string[];
    skills?: string[];
    attitude?: string[];
    competence?: string[];
  };
  activities?: any[];
  materials?: string[];
  assessmentCriteria?: any[];
  downloadToken?: string;
  downloadUrl?: string;
}

const LessonPlanDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [lessonPlanData, setLessonPlanData] = useState<LessonPlan | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLessonPlan = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const response = await fetchClient(`/api/v1/lesson-plans/${id}`, {
          method: 'GET',
          credentials: 'include'
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            setLessonPlanData(result.data);
          } else {
            setError('Không tìm thấy giáo án');
          }
        } else {
          setError('Không thể tải giáo án');
        }
      } catch (err) {
        console.error('Error fetching lesson plan:', err);
        setError('Lỗi khi tải giáo án');
      } finally {
        setLoading(false);
      }
    };

    fetchLessonPlan();
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

  if (error || !lessonPlanData) {
    return (
      <Layout>
        <DashboardLayout>
          <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
            <p className="text-muted-foreground">{error || 'Không tìm thấy giáo án'}</p>
            <Button onClick={() => navigate("/lesson-planner")}>
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

  // Transform data from API to display format
  const allObjectives = [
    ...(lessonPlanData.objectives?.knowledge || []),
    ...(lessonPlanData.objectives?.skills || []),
    ...(lessonPlanData.objectives?.attitude || []),
    ...(lessonPlanData.objectives?.competence || [])
  ];

  const transformActivities = () => {
    if (lessonPlanData.activities && lessonPlanData.activities.length > 0) {
      const icons = [Lightbulb, BookOpen, Target, Users];
      const colors = ["text-primary", "text-accent", "text-primary-light", "text-accent"];
      return lessonPlanData.activities.map((activity: any, index: number) => ({
        phase: activity.name || `Hoạt động ${index + 1}`,
        icon: icons[index % icons.length],
        color: colors[index % colors.length],
        description: activity.goal || '',
        activities: activity.steps ? [
          activity.steps.assign,
          activity.steps.perform,
          activity.steps.report,
          activity.steps.conclude
        ].filter(Boolean) : []
      }));
    }
    // Fallback: parse from notes if activities not structured
    return [];
  };

  const lessonPlan = {
    id: lessonPlanData._id,
    title: lessonPlanData.title || "Giáo án",
    subtitle: lessonPlanData.chapter || "",
    grade: lessonPlanData.grade?.name || "Không xác định",
    subject: lessonPlanData.subject?.name || "Không xác định",
    method: "CTGDPT 2018",
    duration: `${lessonPlanData.num_periods || 1} tiết`,
    createdAt: formatDate(lessonPlanData.createdAt),
    status: lessonPlanData.status === 'completed' ? 'Hoàn thành' : 
            lessonPlanData.status === 'draft' ? 'Nháp' : 
            lessonPlanData.status === 'approved' ? 'Đã duyệt' : 'Lưu trữ',
    objectives: allObjectives.length > 0 ? allObjectives : [
      "Mục tiêu sẽ được cập nhật từ nội dung giáo án"
    ],
    competencies: lessonPlanData.learningOutcomes?.general?.map((comp: string) => ({
      name: comp,
      level: "Tốt"
    })) || [
      { name: "Năng lực tính toán", level: "Tốt" },
      { name: "Năng lực giải quyết vấn đề", level: "Khá" }
    ],
    activities: transformActivities(),
    materials: lessonPlanData.materials || [],
    assessment: lessonPlanData.assessmentCriteria?.map((crit: any) => 
      `${crit.criterion}: ${crit.method} (${crit.level})`
    ) || [
      "Đánh giá quá trình: Quan sát thái độ học tập",
      "Đánh giá kết quả: Bài tập trên lớp"
    ],
    notes: lessonPlanData.notes || '',
    downloadToken: lessonPlanData.downloadToken,
    downloadUrl: lessonPlanData.downloadUrl
  };

  const handleDownload = () => {
    if (lessonPlan.downloadToken) {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
      const downloadUrl = `${API_BASE_URL}/api/v1/lesson-plans/download/${lessonPlan.downloadToken}`;
      window.open(downloadUrl, '_blank');
    } else if (lessonPlan.downloadUrl) {
      window.open(lessonPlan.downloadUrl, '_blank');
    } else {
      toast({
        title: "Đang tải xuống",
        description: "Giáo án sẽ được tải xuống dạng PDF...",
      });
    }
  };

  const handleShare = () => {
    toast({
      title: "Chia sẻ giáo án",
      description: "Liên kết chia sẻ đã được sao chép!",
    });
  };

  const handleEdit = () => {
    toast({
      title: "Chức năng chỉnh sửa",
      description: "Tính năng đang phát triển...",
    });
  };

  return (
    <Layout>
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <Button
              variant="ghost"
              onClick={() => navigate("/lesson-planner")}
              className="mb-4 -ml-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Quay lại
            </Button>
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <BookOpen className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  {lessonPlan.title}
                </h1>
                <p className="text-muted-foreground mb-3">{lessonPlan.subtitle}</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{lessonPlan.grade}</Badge>
                  <Badge variant="secondary">{lessonPlan.subject}</Badge>
                  <Badge variant="secondary">{lessonPlan.method}</Badge>
                  <Badge variant="default" className="gap-1">
                    <CheckCircle className="w-3 h-3" />
                    {lessonPlan.status}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleEdit} className="gap-2">
              <Edit className="w-4 h-4" />
              Chỉnh sửa
            </Button>
            <Button variant="outline" onClick={handleShare} className="gap-2">
              <Share2 className="w-4 h-4" />
              Chia sẻ
            </Button>
            <Button onClick={handleDownload} className="gap-2">
              <Download className="w-4 h-4" />
              Tải xuống PDF
            </Button>
          </div>
        </div>

        {/* Quick Info */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="card-elevated">
            <CardContent className="p-4 flex items-center gap-3">
              <Clock className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Thời lượng</p>
                <p className="font-semibold text-foreground">{lessonPlan.duration}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="card-elevated">
            <CardContent className="p-4 flex items-center gap-3">
              <Target className="w-5 h-5 text-accent" />
              <div>
                <p className="text-sm text-muted-foreground">Mục tiêu</p>
                <p className="font-semibold text-foreground">{lessonPlan.objectives.length} mục tiêu</p>
              </div>
            </CardContent>
          </Card>
          <Card className="card-elevated">
            <CardContent className="p-4 flex items-center gap-3">
              <Users className="w-5 h-5 text-primary-light" />
              <div>
                <p className="text-sm text-muted-foreground">Hoạt động</p>
                <p className="font-semibold text-foreground">{lessonPlan.activities.length} giai đoạn</p>
              </div>
            </CardContent>
          </Card>
          <Card className="card-elevated">
            <CardContent className="p-4 flex items-center gap-3">
              <BookOpen className="w-5 h-5 text-accent" />
              <div>
                <p className="text-sm text-muted-foreground">Tạo lúc</p>
                <p className="font-semibold text-foreground">{lessonPlan.createdAt}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className={`grid w-full ${lessonPlan.notes ? 'grid-cols-5' : 'grid-cols-4'}`}>
            <TabsTrigger value="overview">Tổng quan</TabsTrigger>
            <TabsTrigger value="activities">Hoạt động học tập</TabsTrigger>
            <TabsTrigger value="materials">Tài liệu & Đánh giá</TabsTrigger>
            <TabsTrigger value="competencies">Năng lực</TabsTrigger>
            {lessonPlan.notes && <TabsTrigger value="content">Nội dung</TabsTrigger>}
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle>Mục tiêu bài học</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {lessonPlan.objectives.map((objective, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-foreground">{objective}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="card-elevated">
              <CardHeader>
                <CardTitle>Năng lực hướng tới</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {lessonPlan.competencies.map((comp, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                      <span className="font-medium text-foreground">{comp.name}</span>
                      <Badge variant="default">{comp.level}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activities" className="space-y-4">
            {lessonPlan.activities.map((activity, index) => (
              <Card key={index} className="card-elevated">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${activity.color} bg-opacity-10`}>
                      <activity.icon className={`w-5 h-5 ${activity.color}`} />
                    </div>
                    {activity.phase}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">{activity.description}</p>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {activity.activities.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span className="text-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="materials" className="space-y-6">
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle>Tài liệu & Thiết bị</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {lessonPlan.materials.map((material, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                      <span className="text-foreground">{material}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="card-elevated">
              <CardHeader>
                <CardTitle>Phương pháp đánh giá</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {lessonPlan.assessment.map((item, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Target className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                      <span className="text-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="competencies">
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle>Phát triển năng lực học sinh</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {lessonPlan.competencies.map((comp, index) => (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-foreground">{comp.name}</span>
                      <Badge variant="default">{comp.level}</Badge>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{
                          width: comp.level === "Tốt" ? "85%" : comp.level === "Khá" ? "70%" : "50%",
                        }}
                      />
                    </div>
                    {index < lessonPlan.competencies.length - 1 && <Separator className="mt-6" />}
                  </div>
                ))}

                <div className="mt-6 p-4 rounded-lg bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/20">
                  <p className="text-sm text-muted-foreground">
                    💡 <strong>Gợi ý:</strong> Bài học này phát triển tốt năng lực tính toán và tư duy logic. 
                    Để tăng cường năng lực giải quyết vấn đề, hãy bổ sung thêm các tình huống thực tế phức tạp hơn.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {lessonPlan.notes && (
            <TabsContent value="content">
              <Card className="card-elevated">
                <CardHeader>
                  <CardTitle>Nội dung giáo án</CardTitle>
                </CardHeader>
                <CardContent>
                  <div 
                    className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{ __html: lessonPlan.notes }}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </DashboardLayout>
    </Layout>
  );
};

export default LessonPlanDetail;
