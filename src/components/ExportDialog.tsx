import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../components/ui/dialog";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import { Checkbox } from "../components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import { Card, CardContent } from "../components/ui/card";
import { Download, FileText, Printer, Eye, Loader2 } from "lucide-react";
import { useToast } from "../hooks/use-toast";

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  testTitle: string;
}

const ExportDialog = ({ open, onOpenChange, testTitle }: ExportDialogProps) => {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [exportOptions, setExportOptions] = useState({
    includeQuestions: true,
    includeAnswerKey: false,
    includeRubric: false,
    includeHeader: true,
    includeStudentInfo: true,
  });
  const [paperSize, setPaperSize] = useState("a4");
  const [layout, setLayout] = useState("single");

  const handleExport = async (action: "download" | "print" | "preview") => {
    setIsExporting(true);

    // Simulate export process
    await new Promise(resolve => setTimeout(resolve, 2000));

    if (action === "download") {
      toast({
        title: "✅ Xuất PDF thành công",
        description: `File "${testTitle}.pdf" đã được tải xuống`,
      });
    } else if (action === "print") {
      toast({
        title: "🖨️ Đang chuẩn bị in",
        description: "Hộp thoại in sẽ mở ra ngay...",
      });
      // In real app: window.print()
    } else {
      toast({
        title: "👁️ Xem trước PDF",
        description: "Đang mở PDF trong tab mới...",
      });
      // In real app: window.open(pdfUrl)
    }

    setIsExporting(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary" />
            Xuất đề kiểm tra
          </DialogTitle>
          <DialogDescription>
            Tùy chỉnh cách xuất file PDF cho "{testTitle}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Content Options */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Nội dung xuất file</Label>
            <Card>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="questions"
                    checked={exportOptions.includeQuestions}
                    onCheckedChange={(checked) =>
                      setExportOptions({ ...exportOptions, includeQuestions: checked as boolean })
                    }
                  />
                  <Label htmlFor="questions" className="cursor-pointer">
                    Câu hỏi đề thi
                  </Label>
                </div>

                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="answerKey"
                    checked={exportOptions.includeAnswerKey}
                    onCheckedChange={(checked) =>
                      setExportOptions({ ...exportOptions, includeAnswerKey: checked as boolean })
                    }
                  />
                  <Label htmlFor="answerKey" className="cursor-pointer">
                    Đáp án chi tiết
                  </Label>
                </div>

                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="rubric"
                    checked={exportOptions.includeRubric}
                    onCheckedChange={(checked) =>
                      setExportOptions({ ...exportOptions, includeRubric: checked as boolean })
                    }
                  />
                  <Label htmlFor="rubric" className="cursor-pointer">
                    Hướng dẫn chấm điểm
                  </Label>
                </div>

                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="header"
                    checked={exportOptions.includeHeader}
                    onCheckedChange={(checked) =>
                      setExportOptions({ ...exportOptions, includeHeader: checked as boolean })
                    }
                  />
                  <Label htmlFor="header" className="cursor-pointer">
                    Tiêu đề và thông tin đề thi
                  </Label>
                </div>

                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="studentInfo"
                    checked={exportOptions.includeStudentInfo}
                    onCheckedChange={(checked) =>
                      setExportOptions({ ...exportOptions, includeStudentInfo: checked as boolean })
                    }
                  />
                  <Label htmlFor="studentInfo" className="cursor-pointer">
                    Phần điền thông tin học sinh
                  </Label>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Paper Size */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Khổ giấy</Label>
            <RadioGroup value={paperSize} onValueChange={setPaperSize}>
              <div className="grid grid-cols-3 gap-3">
                <Card className={paperSize === "a4" ? "border-primary" : ""}>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="a4" id="a4" />
                      <Label htmlFor="a4" className="cursor-pointer">
                        A4 (210×297mm)
                      </Label>
                    </div>
                  </CardContent>
                </Card>

                <Card className={paperSize === "a5" ? "border-primary" : ""}>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="a5" id="a5" />
                      <Label htmlFor="a5" className="cursor-pointer">
                        A5 (148×210mm)
                      </Label>
                    </div>
                  </CardContent>
                </Card>

                <Card className={paperSize === "letter" ? "border-primary" : ""}>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="letter" id="letter" />
                      <Label htmlFor="letter" className="cursor-pointer">
                        Letter (8.5×11")
                      </Label>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </RadioGroup>
          </div>

          {/* Layout */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Bố cục trang</Label>
            <RadioGroup value={layout} onValueChange={setLayout}>
              <div className="grid grid-cols-2 gap-3">
                <Card className={layout === "single" ? "border-primary" : ""}>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="single" id="single" />
                      <Label htmlFor="single" className="cursor-pointer">
                        Một đề / trang
                      </Label>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 ml-6">
                      Tiêu chuẩn, dễ đọc
                    </p>
                  </CardContent>
                </Card>

                <Card className={layout === "double" ? "border-primary" : ""}>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="double" id="double" />
                      <Label htmlFor="double" className="cursor-pointer">
                        Hai đề / trang
                      </Label>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 ml-6">
                      Tiết kiệm giấy
                    </p>
                  </CardContent>
                </Card>
              </div>
            </RadioGroup>
          </div>

          {/* Preview Info */}
          <Card className="bg-secondary/50">
            <CardContent className="p-4">
              <h4 className="font-semibold text-sm mb-2">Thông tin xuất file:</h4>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>• Định dạng: PDF</p>
                <p>• Khổ giấy: {paperSize.toUpperCase()}</p>
                <p>• Bố cục: {layout === "single" ? "Một đề/trang" : "Hai đề/trang"}</p>
                <p>• Nội dung: {Object.values(exportOptions).filter(Boolean).length} mục đã chọn</p>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="grid grid-cols-3 gap-3 pt-4">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => handleExport("preview")}
              disabled={isExporting}
            >
              <Eye className="w-4 h-4" />
              Xem trước
            </Button>

            <Button
              variant="outline"
              className="gap-2"
              onClick={() => handleExport("print")}
              disabled={isExporting}
            >
              <Printer className="w-4 h-4" />
              In ngay
            </Button>

            <Button
              className="gap-2"
              onClick={() => handleExport("download")}
              disabled={isExporting}
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang xuất...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Tải xuống
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExportDialog;
