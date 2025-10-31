// RubricAssessment.tsx

import { useState } from "react";
import DashboardLayout from "../components/DashboardLayout";
import RubricDialog from "../components/RubricDialog"; 
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Target, Plus, FileCheck, Users, TrendingUp } from "lucide-react";
import Layout from "../components/Layout";

// Định nghĩa Rubric type
interface Rubric {
  id: string;
  name: string;
  subject: string;
  date: string;
  students: number;
  progress: number;
  type?: string; 
  description?: string;
  criteriaCount?: number;
  criteria?: any[];
  rubricTable?: any;
}

const RubricAssessment = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Dữ liệu mock ban đầu
  const [rubrics, setRubrics] = useState<Rubric[]>([
    {
      id: "1",
      name: "Rubrics: Đánh giá dự án STEM lớp 8",
      subject: "Khoa học tự nhiên",
      date: "3 ngày trước",
      students: 45,
      progress: 100,
    },
    {
      id: "2",
      name: "Rubrics: Bài kiểm tra Hóa học 11",
      subject: "Hóa học",
      date: "1 tuần trước",
      students: 30,
      progress: 100,
    },
    {
      id: "3",
      name: "Rubrics: Thuyết trình Lịch sử địa phương",
      subject: "Lịch sử",
      date: "1 tháng trước",
      students: 50,
      progress: 100,
    },
  ]);

  // Hàm xử lý khi tạo mới một Rubric thành công
  const handleRubricCreated = (newRubric: Rubric) => {
    // Thêm Rubric mới vào danh sách
    setRubrics(prev => [newRubric, ...prev]);
  };

  const handleRubricClick = (rubric: Rubric) => {
    // TODO: Implement view details modal or expand functionality
    console.log('View rubric details:', rubric);
  };

  // ... (Phần JSX giữ nguyên) ...
  return (
    <Layout>
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Quản lý Rubrics</h1>
          <Button onClick={() => setDialogOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Tạo Rubrics mới
          </Button>
        </div>

        {/* Thống kê nhanh */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="flex items-center p-4">
            <div className="p-3 mr-4 rounded-full bg-blue-100 dark:bg-blue-900">
              <FileCheck className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Tổng số Rubrics</p>
              <h2 className="text-2xl font-bold">{rubrics.length}</h2>
            </div>
          </Card>
          <Card className="flex items-center p-4">
            <div className="p-3 mr-4 rounded-full bg-green-100 dark:bg-green-900">
              <Users className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Tổng Học sinh</p>
              <h2 className="text-2xl font-bold">125+</h2>
            </div>
          </Card>
          <Card className="flex items-center p-4">
            <div className="p-3 mr-4 rounded-full bg-yellow-100 dark:bg-yellow-900">
              <TrendingUp className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Tỉ lệ hoàn thành trung bình</p>
              <h2 className="text-2xl font-bold">95%</h2>
            </div>
          </Card>
        </div>

        {/* Danh sách Rubrics */}
        <Card>
          <CardHeader>
            <CardTitle>Danh sách Rubrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {rubrics.map((rubric) => (
                <div
                  key={rubric.id}
                  className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-secondary/5 transition-colors"
                  onClick={() => handleRubricClick(rubric)}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Target className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground">{rubric.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {rubric.subject} • {rubric.students} học sinh • {rubric.date}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all"
                            style={{ width: `${rubric.progress}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-muted-foreground">{rubric.progress}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <RubricDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen} 
        onRubricCreated={handleRubricCreated} 
      />
    </DashboardLayout>
    </Layout>
  );
};

export default RubricAssessment;