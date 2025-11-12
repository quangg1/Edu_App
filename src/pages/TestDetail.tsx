import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import ShareDialog from "../components/ShareDialog";
import ExportDialog from "../components/ExportDialog";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { ArrowLeft, Download, Share2, FileText, Clock, Target, CheckCircle2 } from "lucide-react";

const TestDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  // Mock data - in real app, fetch based on id
  const test = {
    id,
    title: "Đề kiểm tra Toán học lớp 10 - HK1",
    subject: "Toán học",
    grade: "Lớp 10",
    type: "Kết hợp",
    questionCount: 25,
    duration: 90,
    difficulty: "Trung bình",
    topics: "Phương trình bậc hai, Hàm số bậc nhất, Đồ thị hàm số",
    createdAt: "2 ngày trước",
  };

  const questions = [
    {
      section: "Phần I: Trắc nghiệm (15 câu - 6 điểm)",
      items: [
        {
          id: 1,
          question: "Nghiệm của phương trình x² - 5x + 6 = 0 là:",
          options: ["A. x = 2, x = 3", "B. x = 1, x = 6", "C. x = -2, x = -3", "D. x = 2, x = -3"],
          correctAnswer: "A",
          points: 0.4,
        },
        {
          id: 2,
          question: "Tập xác định của hàm số y = √(x - 2) là:",
          options: ["A. (-∞, 2]", "B. [2, +∞)", "C. (-∞, 2)", "D. (2, +∞)"],
          correctAnswer: "B",
          points: 0.4,
        },
        {
          id: 3,
          question: "Đồ thị hàm số y = 2x + 1 đi qua điểm nào sau đây?",
          options: ["A. (0, 1)", "B. (1, 2)", "C. (-1, 1)", "D. (2, 4)"],
          correctAnswer: "A",
          points: 0.4,
        },
      ],
    },
    {
      section: "Phần II: Tự luận (5 câu - 4 điểm)",
      items: [
        {
          id: 16,
          question: "Giải phương trình: x² - 4x + 3 = 0",
          rubric: "Viết công thức nghiệm (0.5đ), Tính delta (0.5đ), Tìm nghiệm (1đ)",
          points: 2,
        },
        {
          id: 17,
          question: "Vẽ đồ thị hàm số y = -x + 2 trên mặt phẳng tọa độ Oxy",
          rubric: "Tìm điểm đặc biệt (0.5đ), Vẽ đồ thị chính xác (1đ), Kết luận (0.5đ)",
          points: 2,
        },
      ],
    },
  ];

  const answerKey = [
    { question: 1, answer: "A", explanation: "Phân tích x² - 5x + 6 = (x-2)(x-3) = 0" },
    { question: 2, answer: "B", explanation: "Căn bậc hai xác định khi x - 2 ≥ 0" },
    { question: 3, answer: "A", explanation: "Thay x=0 vào y = 2x + 1, ta được y = 1" },
  ];

  return (
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
              onClick={() => setExportDialogOpen(true)}
            >
              <Download className="w-4 h-4" />
              Xuất PDF
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
                      <p className="font-medium text-foreground mb-3">{item.question}</p>
                      {'options' in item && (
                        <div className="space-y-2 ml-6">
                          {item.options.map((option, i) => (
                            <p key={i} className="text-sm text-muted-foreground">{option}</p>
                          ))}
                        </div>
                      )}
                      {'rubric' in item && (
                        <div className="ml-6 p-3 bg-secondary/50 rounded-lg">
                          <p className="text-sm text-muted-foreground">
                            <span className="font-semibold text-foreground">Hướng dẫn chấm:</span> {item.rubric}
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
                    <p className="text-sm text-muted-foreground">{item.explanation}</p>
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
  );
};

export default TestDetail;
