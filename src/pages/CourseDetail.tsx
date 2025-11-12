import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Progress } from "../components/ui/progress";
import { 
  ArrowLeft, 
  Download, 
  Share2, 
  GraduationCap, 
  BookOpen, 
  Video, 
  FileText,
  CheckCircle2,
  Circle,
  Clock
} from "lucide-react";
import { useToast } from "../hooks/use-toast";

const CourseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Mock data
  const course = {
    id,
    title: "Phương pháp dạy học tích cực",
    category: "Phương pháp dạy học",
    level: "Trung cấp",
    duration: "5 giờ",
    modules: 5,
    progress: 37,
    description: "Khám phá các phương pháp dạy học tích cực hiện đại để tăng cường sự tham gia của học sinh và nâng cao hiệu quả học tập",
    instructor: "TS. Nguyễn Văn A",
    enrolled: 1234,
    rating: 4.8,
    moduleList: [
      {
        id: 1,
        title: "Module 1: Tổng quan về học tập tích cực",
        duration: "45 phút",
        completed: true,
        lessons: [
          { title: "Giới thiệu khóa học", type: "video", duration: "10 phút", completed: true },
          { title: "Lý thuyết về học tập tích cực", type: "video", duration: "25 phút", completed: true },
          { title: "Bài tập thực hành", type: "document", duration: "10 phút", completed: true },
        ],
      },
      {
        id: 2,
        title: "Module 2: Think-Pair-Share",
        duration: "60 phút",
        completed: false,
        lessons: [
          { title: "Giới thiệu phương pháp", type: "video", duration: "15 phút", completed: true },
          { title: "Ví dụ thực tế", type: "video", duration: "20 phút", completed: true },
          { title: "Hướng dẫn áp dụng", type: "document", duration: "15 phút", completed: false },
          { title: "Bài tập", type: "document", duration: "10 phút", completed: false },
        ],
      },
      {
        id: 3,
        title: "Module 3: Jigsaw Classroom",
        duration: "70 phút",
        completed: false,
        lessons: [
          { title: "Nguyên lý hoạt động", type: "video", duration: "20 phút", completed: false },
          { title: "Thiết kế hoạt động Jigsaw", type: "video", duration: "30 phút", completed: false },
          { title: "Tài liệu tham khảo", type: "document", duration: "20 phút", completed: false },
        ],
      },
      {
        id: 4,
        title: "Module 4: Problem-Based Learning",
        duration: "80 phút",
        completed: false,
        lessons: [
          { title: "Lý thuyết PBL", type: "video", duration: "25 phút", completed: false },
          { title: "Thiết kế bài toán", type: "video", duration: "35 phút", completed: false },
          { title: "Case study", type: "document", duration: "20 phút", completed: false },
        ],
      },
      {
        id: 5,
        title: "Module 5: Đánh giá và tổng kết",
        duration: "50 phút",
        completed: false,
        lessons: [
          { title: "Đánh giá hiệu quả", type: "video", duration: "20 phút", completed: false },
          { title: "Tổng kết và chia sẻ", type: "video", duration: "20 phút", completed: false },
          { title: "Bài kiểm tra cuối khóa", type: "document", duration: "10 phút", completed: false },
        ],
      },
    ],
    resources: [
      { title: "Sách: Active Learning - David W. Johnson", type: "PDF", size: "5.2 MB" },
      { title: "Bài viết: Research on Active Learning", type: "PDF", size: "1.8 MB" },
      { title: "Template: Thiết kế hoạt động nhóm", type: "DOCX", size: "0.5 MB" },
    ],
  };

  const handleExport = () => {
    toast({
      title: "Đang xuất file",
      description: "Tài liệu khóa học đang được tải xuống...",
    });
  };

  const handleShare = () => {
    toast({
      title: "Chia sẻ",
      description: "Link chia sẻ đã được sao chép!",
    });
  };

  const completedModules = course.moduleList.filter(m => m.completed).length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate("/learning-hub")}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">{course.title}</h1>
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="outline">{course.category}</Badge>
                <Badge variant="outline">{course.level}</Badge>
                <span>• {course.modules} modules</span>
                <span>• {course.duration}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleShare}>
              <Share2 className="w-4 h-4 mr-2" />
              Chia sẻ
            </Button>
            <Button onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Tải tài liệu
            </Button>
          </div>
        </div>

        {/* Progress Card */}
        <Card className="card-elevated">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-foreground mb-1">Tiến độ học tập</h3>
                <p className="text-sm text-muted-foreground">
                  {completedModules}/{course.modules} modules hoàn thành
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-foreground">{course.progress}%</p>
              </div>
            </div>
            <Progress value={course.progress} className="h-3" />
          </CardContent>
        </Card>

        {/* Main Content */}
        <Tabs defaultValue="curriculum" className="space-y-4">
          <TabsList>
            <TabsTrigger value="curriculum">Nội dung khóa học</TabsTrigger>
            <TabsTrigger value="overview">Tổng quan</TabsTrigger>
            <TabsTrigger value="resources">Tài liệu</TabsTrigger>
          </TabsList>

          <TabsContent value="curriculum" className="space-y-4">
            {course.moduleList.map((module) => (
              <Card key={module.id} className="card-elevated">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {module.completed ? (
                        <CheckCircle2 className="w-6 h-6 text-primary" />
                      ) : (
                        <Circle className="w-6 h-6 text-muted-foreground" />
                      )}
                      <div>
                        <CardTitle className="text-lg">{module.title}</CardTitle>
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <Clock className="w-3 h-3" />
                          {module.duration}
                        </p>
                      </div>
                    </div>
                    {module.completed && (
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                        Hoàn thành
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {module.lessons.map((lesson, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-secondary/50 transition-all cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          {lesson.type === "video" ? (
                            <div className="p-2 rounded-lg bg-accent/10">
                              <Video className="w-4 h-4 text-accent" />
                            </div>
                          ) : (
                            <div className="p-2 rounded-lg bg-primary-light/10">
                              <FileText className="w-4 h-4 text-primary-light" />
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-medium text-foreground">{lesson.title}</p>
                            <p className="text-xs text-muted-foreground">{lesson.duration}</p>
                          </div>
                        </div>
                        {lesson.completed && (
                          <CheckCircle2 className="w-5 h-5 text-primary" />
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="overview" className="space-y-4">
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle>Về khóa học này</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">{course.description}</p>
                
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Giảng viên</p>
                    <p className="font-semibold text-foreground">{course.instructor}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Học viên</p>
                    <p className="font-semibold text-foreground">{course.enrolled.toLocaleString()} người</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Đánh giá</p>
                    <p className="font-semibold text-foreground">{course.rating} ⭐</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Thời lượng</p>
                    <p className="font-semibold text-foreground">{course.duration}</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-border">
                  <h4 className="font-semibold text-foreground mb-2">Bạn sẽ học được gì</h4>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-primary mt-0.5" />
                      <span className="text-sm text-muted-foreground">Hiểu rõ các nguyên lý của học tập tích cực</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-primary mt-0.5" />
                      <span className="text-sm text-muted-foreground">Áp dụng được 5+ phương pháp dạy học tích cực</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-primary mt-0.5" />
                      <span className="text-sm text-muted-foreground">Thiết kế được hoạt động học tập phù hợp</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-5 h-5 text-primary mt-0.5" />
                      <span className="text-sm text-muted-foreground">Đánh giá hiệu quả của phương pháp giảng dạy</span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="resources" className="space-y-4">
            <Card className="card-elevated">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-primary" />
                  Tài liệu tham khảo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {course.resources.map((resource, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-secondary/50 transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <FileText className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground">{resource.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {resource.type} • {resource.size}
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Tải về
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default CourseDetail;
