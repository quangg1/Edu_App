import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Card } from "../components/ui/card";
import { useToast } from "../hooks/use-toast";
import { Loader2, Upload, FileText, X } from "lucide-react";

// Định nghĩa Interface Rubric (nên đồng bộ với RubricDetail.tsx)
interface Rubric {
  id: string;
  name: string;
  subject: string;
  grade?: string;
  type?: string;
  date: string;
  students: number;
  progress: number;
  description: string;
  criteriaCount: number;
  criteria: { name: string; weight: number; description: string }[];
  rubricTable: { level: string; points: number; descriptions: string[] }[];
  studentResults: { name: string; score: number | null; status: 'completed' | 'pending' }[];
  statistics: {
    averageScore: number;
    highestScore: number;
    lowestScore: number;
    completionRate: number;
  };
}

interface RubricDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRubricCreated: (rubric: Rubric) => void;
}

const RubricDialog = ({ open, onOpenChange, onRubricCreated }: RubricDialogProps) => {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    subject: "",
    grade: "",
    type: "",
    criteria: "",
    description: "",
  });
  const [attachedFile, setAttachedFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachedFile(file);
    }
    e.target.value = '';
  };

  const handleRemoveFile = () => {
    setAttachedFile(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: keyof typeof formData) => (value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  
    if (!formData.title || !formData.subject || !formData.criteria) {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng điền tiêu đề, môn học và số tiêu chí.",
        variant: "destructive",
      });
      return;
    }
  
    setIsGenerating(true);
  
    try {
      // 1️⃣ Tạo FormData
      const form = new FormData();
      form.append("rubric_title", formData.title);
      form.append("subject", formData.subject);
      form.append("grade_level", formData.grade);
      form.append("assessment_type", formData.type);
      form.append("number_of_criteria", formData.criteria);
      form.append("user_prompt", formData.description);
      if (attachedFile) form.append("files", attachedFile);
  
      const FRONTEND_API = "https://gemini.veronlabs.com/bot5";
  
      // 2️⃣ Gửi yêu cầu tạo job với timeout và CORS
      let createRes;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

      try {
        createRes = await fetch(`${FRONTEND_API}/api/v1/rubrics/generate`, {
          method: "POST",
          body: form,
          credentials: 'include',
          signal: controller.signal,
          headers: {
            'Accept': 'application/json'
          }
        });
        clearTimeout(timeoutId);
      } catch (error: any) {
        if (error.name === 'AbortError') {
          throw new Error('Quá thời gian tạo job, vui lòng thử lại.');
        }
        throw error;
      }
  
      if (!createRes.ok) {
        const errorData = await createRes.json().catch(() => ({ message: "Không thể khởi tạo job" }));
        throw new Error(errorData.message || "Không thể khởi tạo job.");
      }

      const createData = await createRes.json();
      if (!createData.jobId) {
        throw new Error("Không nhận được jobId từ server");
      }
  
      // 3️⃣ Polling kết quả mỗi 3 giây
      let resultData = null;
      const pollInterval = 3000;
      const maxWait = 10 * 60 * 1000; // 10 phút
      const startTime = Date.now();
  
      while (Date.now() - startTime < maxWait) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        try {
          const res = await fetch(`${FRONTEND_API}/api/v1/rubrics/status/${createData.jobId}`, {
            credentials: 'include',
            signal: controller.signal,
            headers: {
              'Accept': 'application/json'
            }
          });
          clearTimeout(timeoutId);

          if (!res.ok) {
            const errorData = await res.json().catch(() => ({ message: "Lỗi kiểm tra trạng thái" }));
            throw new Error(errorData.message || "Lỗi kiểm tra trạng thái");
          }

          const data = await res.json();

          if (data.status === "completed") {
            resultData = data.data;
            break;
          } else if (data.status === "failed") {
            throw new Error(data.error || "Job thất bại.");
          }
        } catch (error: any) {
          if (error.name === 'AbortError') {
            console.log("Request timeout, continuing to poll...");
            continue;
          } else {
            throw error;
          }
        }

        await new Promise((resolve) => setTimeout(resolve, pollInterval));
      }
  
      if (!resultData) throw new Error("Hết thời gian chờ kết quả từ AI.");
  
      const json = resultData.rubric_json || resultData;

      const newRubric = {
        id: resultData.id || `rubric-${Date.now()}`,
        name: json.rubric_title || resultData.name || formData.title,
        subject: json.subject || resultData.subject || formData.subject,
        grade: json.grade_level || resultData.grade || formData.grade,
        type: json.assessment_type || resultData.type || formData.type,
        date: resultData.date || new Date().toLocaleDateString("vi-VN"),
        description: resultData.description || json.description || "",
        criteriaCount: Array.isArray(json.criteria)
          ? json.criteria.length
          : resultData.criteriaCount || parseInt(formData.criteria || "0"),
        criteria:
          (json.criteria || resultData.criteria || []).map((c: any) => ({
            name: c.name,
            weight: c.weight_percent || c.weight || 0,
            description: c.description || "",
          })),
        rubricTable: json.rubric_table || resultData.rubricTable || [],
        students: 0,
        progress: 0,
        studentResults: [],
        statistics: resultData.statistics || {
          averageScore: 0,
          highestScore: 0,
          lowestScore: 0,
          completionRate: 0,
        },
      };
  
      toast({
        title: "Tạo Rubrics thành công!",
        description: `Đã tạo Rubrics cho: ${newRubric.name}.`,
      });
  
      onRubricCreated(newRubric);
      onOpenChange(false);
    } catch (err: any) {
      console.error("❌ Lỗi:", err);
      toast({
        title: "Tạo Rubrics thất bại",
        description: err.message || "Đã xảy ra lỗi trong quá trình xử lý.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Tạo Rubrics tự động bằng AI</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Tiêu đề Rubrics (*)</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="VD: Đánh giá bài thuyết trình"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Môn học (*)</Label>
                <Input
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="VD: Ngữ văn"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="grade">Khối lớp</Label>
                <Input
                  id="grade"
                  name="grade"
                  value={formData.grade}
                  onChange={handleChange}
                  placeholder="VD: Lớp 10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Loại đánh giá</Label>
              <Select name="type" value={formData.type} onValueChange={handleSelectChange("type")}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn loại đánh giá" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="presentation">Thuyết trình</SelectItem>
                  <SelectItem value="essay">Bài luận</SelectItem>
                  <SelectItem value="project">Dự án</SelectItem>
                  <SelectItem value="performance">Kỹ năng thực hành</SelectItem>
                  <SelectItem value="other">Khác</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="criteria">Số tiêu chí đánh giá (*)</Label>
              <Input
                id="criteria"
                name="criteria"
                type="number"
                min={1}
                max={10}
                value={formData.criteria}
                onChange={handleChange}
                placeholder="VD: 5"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Mô tả thêm (nếu có)</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Thêm thông tin về yêu cầu đánh giá..."
                className="h-20"
              />
            </div>

            <div className="space-y-2">
              <Label>File tham khảo (nếu có)</Label>
              {attachedFile ? (
                <Card className="p-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4" />
                      <span className="text-sm">{attachedFile.name}</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={handleRemoveFile}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              ) : (
                <div className="flex items-center justify-center w-full">
                  <label
                    htmlFor="file-upload"
                    className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-bray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600"
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-2 text-gray-500 dark:text-gray-400" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Kéo thả file hoặc click để chọn
                      </p>
                    </div>
                    <input
                      id="file-upload"
                      type="file"
                      accept=".pdf,.doc,.docx"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </label>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isGenerating}>
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang tạo...
                </>
              ) : (
                "Tạo Rubrics"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RubricDialog;