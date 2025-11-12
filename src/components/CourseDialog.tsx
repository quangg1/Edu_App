import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { useToast } from "../hooks/use-toast";
import { Loader2 } from "lucide-react";

interface CourseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCourseCreated: (course: any) => void;
}

const CourseDialog = ({ open, onOpenChange, onCourseCreated }: CourseDialogProps) => {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    level: "",
    duration: "",
    description: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);

    toast({
      title: "Đang tạo khóa học",
      description: "AI đang tổ chức nội dung học tập...",
    });

    // Simulate AI generation
    setTimeout(() => {
      const newCourse = {
        id: Date.now().toString(),
        title: formData.title,
        category: formData.category,
        level: formData.level,
        duration: formData.duration,
        description: formData.description,
        modules: parseInt(formData.duration) || 5,
        progress: 0,
        date: "Vừa tạo",
      };

      onCourseCreated(newCourse);
      setIsGenerating(false);
      onOpenChange(false);

      toast({
        title: "Tạo thành công!",
        description: "Khóa học đã sẵn sàng để bắt đầu",
      });

      // Reset form
      setFormData({
        title: "",
        category: "",
        level: "",
        duration: "",
        description: "",
      });
    }, 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tạo lộ trình học tập mới</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Tên khóa học *</Label>
            <Input
              id="title"
              placeholder="VD: Phương pháp dạy học tích cực"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Danh mục *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn danh mục" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Phương pháp dạy học">Phương pháp dạy học</SelectItem>
                  <SelectItem value="Đánh giá năng lực">Đánh giá năng lực</SelectItem>
                  <SelectItem value="Công nghệ giáo dục">Công nghệ giáo dục</SelectItem>
                  <SelectItem value="Quản lý lớp học">Quản lý lớp học</SelectItem>
                  <SelectItem value="Nghiên cứu giáo dục">Nghiên cứu giáo dục</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="level">Cấp độ *</Label>
              <Select
                value={formData.level}
                onValueChange={(value) => setFormData({ ...formData, level: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn cấp độ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cơ bản">Cơ bản</SelectItem>
                  <SelectItem value="Trung cấp">Trung cấp</SelectItem>
                  <SelectItem value="Nâng cao">Nâng cao</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">Số module *</Label>
            <Select
              value={formData.duration}
              onValueChange={(value) => setFormData({ ...formData, duration: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn số module" />
              </SelectTrigger>
              <SelectContent>
                {[3, 4, 5, 6, 7, 8, 10, 12].map((num) => (
                  <SelectItem key={num} value={num.toString()}>
                    {num} modules
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Mô tả khóa học</Label>
            <Textarea
              id="description"
              placeholder="Mô tả ngắn gọn về nội dung và mục tiêu của khóa học..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isGenerating}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={isGenerating}>
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang tạo...
                </>
              ) : (
                "Tạo khóa học"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CourseDialog;
