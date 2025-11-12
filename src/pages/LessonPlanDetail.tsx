import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Separator } from "../components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { ArrowLeft, Download, Edit, Share2, CheckCircle, Clock, Target, BookOpen, Lightbulb, Users } from "lucide-react";
import { useToast } from "../components/ui/use-toast";

const LessonPlanDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");

  // Mock data - in real app, fetch based on id
  const lessonPlan = {
    id: id || "1",
    title: "Phân số - Các phép tính với phân số",
    subtitle: "Chương 2 - Toán học THCS",
    grade: "Lớp 6",
    subject: "Toán học",
    method: "CTGDPT 2018",
    duration: "45 phút",
    createdAt: "2 giờ trước",
    status: "Hoàn thành",
    objectives: [
      "Hiểu được khái niệm phân số và ý nghĩa của phân số trong thực tế",
      "Biết cách thực hiện các phép tính cộng, trừ, nhân, chia phân số",
      "Vận dụng được kiến thức về phân số vào giải quyết các bài toán thực tế",
    ],
    competencies: [
      { name: "Năng lực tính toán", level: "Tốt" },
      { name: "Năng lực giải quyết vấn đề", level: "Khá" },
      { name: "Năng lực tư duy logic", level: "Tốt" },
    ],
    activities: [
      {
        phase: "Khởi động (5 phút)",
        icon: Lightbulb,
        color: "text-primary",
        description: "Giới thiệu tình huống thực tế về chia bánh, chia đồ vật",
        activities: [
          "Đặt câu hỏi kích thích tư duy: 'Làm thế nào chia đều 3 chiếc bánh cho 4 bạn?'",
          "Quan sát, lắng nghe ý kiến của học sinh",
        ],
      },
      {
        phase: "Hình thành kiến thức (25 phút)",
        icon: BookOpen,
        color: "text-accent",
        description: "Xây dựng khái niệm phân số và các phép tính",
        activities: [
          "Hoạt động nhóm: Thảo luận về cách biểu diễn phân số",
          "Thực hành: Thực hiện các phép tính cơ bản với phân số",
          "Giáo viên hướng dẫn, chốt kiến thức trọng tâm",
        ],
      },
      {
        phase: "Luyện tập (10 phút)",
        icon: Target,
        color: "text-primary-light",
        description: "Củng cố kiến thức qua bài tập",
        activities: [
          "Bài tập cá nhân: 3 bài tập từ dễ đến khó",
          "Bài tập nhóm: Giải quyết tình huống thực tế",
        ],
      },
      {
        phase: "Vận dụng & Tổng kết (5 phút)",
        icon: Users,
        color: "text-accent",
        description: "Liên hệ thực tế và tổng kết bài học",
        activities: [
          "Chia sẻ ứng dụng của phân số trong đời sống",
          "Nhận xét, đánh giá quá trình học tập",
          "Giao bài tập về nhà",
        ],
      },
    ],
    materials: [
      "Bảng phụ về biểu diễn phân số",
      "Mô hình trực quan (hình tròn, hình vuông chia phần)",
      "Phiếu học tập cho học sinh",
      "Máy chiếu và slide bài giảng",
    ],
    assessment: [
      "Đánh giá quá trình: Quan sát thái độ học tập, tham gia hoạt động nhóm",
      "Đánh giá kết quả: Bài tập trên lớp và bài tập về nhà",
      "Tự đánh giá: Học sinh tự nhận xét mức độ hiểu bài",
    ],
  };

  const handleDownload = () => {
    toast({
      title: "Đang tải xuống",
      description: "Giáo án sẽ được tải xuống dạng PDF...",
    });
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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Tổng quan</TabsTrigger>
            <TabsTrigger value="activities">Hoạt động học tập</TabsTrigger>
            <TabsTrigger value="materials">Tài liệu & Đánh giá</TabsTrigger>
            <TabsTrigger value="competencies">Năng lực</TabsTrigger>
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
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default LessonPlanDetail;
