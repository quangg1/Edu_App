import { useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import CourseDialog from "../components/CourseDialog";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { GraduationCap, BookOpen, Lightbulb, Award, TrendingUp, Clock, Plus } from "lucide-react";

const LearningHub = () => {
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [learningPaths, setLearningPaths] = useState([
    {
      id: "1",
      title: "Thiết kế bài học theo 5E",
      description: "Phương pháp dạy học khám phá từ BSCS",
      icon: Lightbulb,
      color: "text-accent-light",
      modules: 6,
      duration: "4 giờ",
    },
    {
      id: "2",
      title: "Đánh giá theo năng lực",
      description: "Cách xây dựng rubrics và đánh giá chân thực",
      icon: Award,
      color: "text-primary",
      modules: 8,
      duration: "5 giờ",
    },
    {
      id: "3",
      title: "AI trong giáo dục",
      description: "Ứng dụng AI để cá nhân hóa học tập",
      icon: GraduationCap,
      color: "text-accent",
      modules: 5,
      duration: "3 giờ",
    },
  ]);

  const handleCourseCreated = (newCourse: any) => {
    const courseWithIcon = {
      ...newCourse,
      id: Date.now().toString(),
      icon: GraduationCap,
      color: "text-primary",
    };
    setLearningPaths([courseWithIcon, ...learningPaths]);
    navigate(`/learning-hub/${courseWithIcon.id}`);
  };


  const resources = [
    {
      title: "PISA 2025 Framework",
      type: "Tài liệu OECD",
      icon: BookOpen,
      color: "text-primary",
      date: "Mới cập nhật",
    },
    {
      title: "UNESCO OER cho STEM",
      type: "Học liệu mở",
      icon: BookOpen,
      color: "text-accent-light",
      date: "Tuần trước",
    },
    {
      title: "Xu hướng EdTech 2024",
      type: "Nghiên cứu",
      icon: TrendingUp,
      color: "text-accent",
      date: "3 ngày trước",
    },
  ];

  const recentActivity = [
    {
      title: "Hoàn thành: Phương pháp dạy học tích cực",
      description: "Khóa học 5 modules",
      icon: GraduationCap,
      date: "2 ngày trước",
      progress: 100,
    },
    {
      title: "Đang học: Đánh giá năng lực STEM",
      description: "Module 3/8",
      icon: BookOpen,
      date: "Hôm nay",
      progress: 37,
    },
  ];

  return (
    <DashboardLayout>
      <CourseDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCourseCreated={handleCourseCreated}
      />
      
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Phát Triển Năng Lực
            </h1>
            <p className="text-muted-foreground">
              Không gian học tập và nghiên cứu sư phạm cá nhân hóa
            </p>
          </div>
          <Button onClick={() => setDialogOpen(true)} size="lg" className="gap-2">
            <Plus className="w-5 h-5" />
            Tạo lộ trình mới
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="card-elevated">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent-light/10">
                <GraduationCap className="w-5 h-5 text-accent-light" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">8</p>
                <p className="text-xs text-muted-foreground">Khóa học đã hoàn thành</p>
              </div>
            </CardContent>
          </Card>
          <Card className="card-elevated">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <BookOpen className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">24</p>
                <p className="text-xs text-muted-foreground">Tài liệu đã lưu</p>
              </div>
            </CardContent>
          </Card>
          <Card className="card-elevated">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-accent/10">
                <Clock className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">32h</p>
                <p className="text-xs text-muted-foreground">Thời gian học tập</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Learning Paths */}
        <div>
          <h2 className="text-xl font-bold text-foreground mb-4">
            Lộ trình phát triển đề xuất
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {learningPaths.map((path) => (
              <Card 
                key={path.id} 
                className="card-elevated hover:border-primary/30 transition-all cursor-pointer" 
                onClick={() => navigate(`/learning-hub/${path.id}`)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`p-2 rounded-lg ${path.color} bg-opacity-10`}>
                      <path.icon className={`w-6 h-6 ${path.color}`} />
                    </div>
                  </div>
                  <h3 className="font-semibold text-foreground mb-2">{path.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{path.description}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{path.modules} modules</span>
                    <span>•</span>
                    <span>{path.duration}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Resources */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              Tài liệu & Nghiên cứu mới
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              {resources.map((resource, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-secondary/50 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${resource.color} bg-opacity-10`}>
                      <resource.icon className={`w-5 h-5 ${resource.color}`} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">{resource.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {resource.type} • {resource.date}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    Xem
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-accent" />
              Hoạt động gần đây
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.map((activity, index) => (
                <div
                  key={index}
                  className="p-4 rounded-lg border border-border"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-accent-light/10">
                      <activity.icon className="w-5 h-5 text-accent-light" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground">{activity.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {activity.description} • {activity.date}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-14">
                    <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent-light transition-all"
                        style={{ width: `${activity.progress}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-muted-foreground">{activity.progress}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default LearningHub;
