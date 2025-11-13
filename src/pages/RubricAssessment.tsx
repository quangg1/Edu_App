// RubricAssessment.tsx

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import RubricDialog from "../components/RubricDialog"; 
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Target, Plus, FileCheck, Users, TrendingUp, Eye, Trash2 } from "lucide-react";
import Layout from "../components/Layout";
import { fetchClient } from "../api/fetchClient";

// Định nghĩa Rubric type
interface Rubric {
  _id?: string;
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
  createdAt?: string;
  grade?: { name: string };
  assessmentType?: string;
}

interface RubricFromAPI {
  _id: string;
  title: string;
  subject?: { name: string };
  grade?: { name: string };
  assessmentType?: string;
  criteria?: any[];
  createdAt: string;
  status?: string;
}

const RubricAssessment = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const navigate = useNavigate();
  const [rubrics, setRubrics] = useState<Rubric[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Fetch rubrics from API
  useEffect(() => {
    const fetchRubrics = async () => {
      try {
        setLoading(true);
        const response = await fetchClient(`/api/v1/rubrics`, {
          method: 'GET',
          credentials: 'include'
        });
        
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            // Transform API data to component format
            const transformed = result.data.map((rubric: RubricFromAPI) => ({
              id: rubric._id,
              name: rubric.title || "Thang đánh giá không có tiêu đề",
              subject: rubric.subject?.name || "Không xác định",
              date: formatDate(rubric.createdAt),
              students: 0, // Not stored in DB yet
              progress: rubric.status === 'published' ? 100 : 75,
              type: rubric.assessmentType || 'presentation',
              criteriaCount: rubric.criteria?.length || 0,
              grade: rubric.grade?.name
            }));
            setRubrics(transformed);
          }
        } else {
          console.warn('Không thể tải danh sách thang đánh giá');
        }
      } catch (error) {
        console.error('Lỗi khi tải danh sách thang đánh giá:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRubrics();
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

  // Hàm xử lý khi tạo mới một Rubric thành công
  const handleRubricCreated = () => {
    // Reload rubrics after creation (the save happens automatically in RubricDialog)
    setTimeout(() => {
      const fetchRubrics = async () => {
        try {
          const response = await fetchClient(`/api/v1/rubrics`, {
            method: 'GET',
            credentials: 'include'
          });
          
          if (response.ok) {
            const result = await response.json();
            if (result.success && result.data) {
              const transformed = result.data.map((rubric: RubricFromAPI) => ({
                id: rubric._id,
                name: rubric.title || "Thang đánh giá không có tiêu đề",
                subject: rubric.subject?.name || "Không xác định",
                date: formatDate(rubric.createdAt),
                students: 0,
                progress: rubric.status === 'published' ? 100 : 75,
                type: rubric.assessmentType || 'presentation',
                criteriaCount: rubric.criteria?.length || 0,
                grade: rubric.grade?.name
              }));
              setRubrics(transformed);
            }
          }
        } catch (error) {
          console.error('Lỗi khi tải lại danh sách thang đánh giá:', error);
        }
      };
      
      fetchRubrics();
    }, 2000); // Wait 2 seconds for save to complete
  };

  const handleRubricClick = (rubric: Rubric) => {
    // Navigate to detail page
    navigate(`/rubric-assessment/${rubric.id}`);
  };

  const handleDeleteRubric = async (rubricId: string) => {
    if (!confirm('Bạn có chắc muốn xóa thang đánh giá này?')) return;

    try {
      const response = await fetchClient(`/api/v1/rubrics/${rubricId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        // Reload rubrics after deletion
        const result = await response.json();
        if (result.success) {
          setRubrics(rubrics.filter(r => r.id !== rubricId));
        }
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
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
            {loading ? (
              <div className="text-center py-4 text-muted-foreground">Đang tải...</div>
            ) : rubrics.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">Chưa có thang đánh giá nào</div>
            ) : (
              <div className="space-y-4">
                {rubrics.map((rubric) => (
                <div
                  key={rubric.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-secondary/5 transition-colors"
                >
                  <div 
                    className="flex items-center gap-3 flex-1 cursor-pointer"
                    onClick={() => handleRubricClick(rubric)}
                  >
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
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRubricClick(rubric)}
                      title="Xem chi tiết"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDeleteRubric(rubric.id)}
                      title="Xóa thang đánh giá"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                ))}
              </div>
            )}
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