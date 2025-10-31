import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../components/ui/dialog";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Card, CardContent } from "../components/ui/card";
import { Copy, Mail, Link2, QrCode, Check, Download } from "lucide-react";
import { useToast } from "../hooks/use-toast";

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  testTitle: string;
  testId: string;
}

const ShareDialog = ({ open, onOpenChange, testTitle, testId }: ShareDialogProps) => {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState(`Xin chào,\n\nTôi muốn chia sẻ đề kiểm tra "${testTitle}" với bạn.\n\nVui lòng truy cập link bên dưới để xem chi tiết.`);

  const shareUrl = `${window.location.origin}/test-builder/${testId}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast({
      title: "Đã sao chép",
      description: "Link đã được sao chép vào clipboard",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendEmail = () => {
    if (!email) {
      toast({
        title: "Vui lòng nhập email",
        variant: "destructive",
      });
      return;
    }

    // Simulate sending email
    toast({
      title: "Email đã được gửi",
      description: `Đề kiểm tra đã được gửi tới ${email}`,
    });
    setEmail("");
    setMessage("");
    onOpenChange(false);
  };

  const handleDownloadQR = () => {
    toast({
      title: "Đang tải QR code",
      description: "QR code sẽ được tải xuống ngay",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">Chia sẻ đề kiểm tra</DialogTitle>
          <DialogDescription>
            Chia sẻ "{testTitle}" với đồng nghiệp hoặc học sinh
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="link" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="link">
              <Link2 className="w-4 h-4 mr-2" />
              Link
            </TabsTrigger>
            <TabsTrigger value="email">
              <Mail className="w-4 h-4 mr-2" />
              Email
            </TabsTrigger>
            <TabsTrigger value="qr">
              <QrCode className="w-4 h-4 mr-2" />
              QR Code
            </TabsTrigger>
          </TabsList>

          <TabsContent value="link" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Link chia sẻ</Label>
              <div className="flex gap-2">
                <Input value={shareUrl} readOnly className="flex-1" />
                <Button onClick={handleCopyLink} className="gap-2">
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      Đã sao chép
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Sao chép
                    </>
                  )}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Bất kỳ ai có link này đều có thể xem đề kiểm tra
              </p>
            </div>

            <Card className="bg-secondary/50">
              <CardContent className="p-4">
                <h4 className="font-semibold text-sm mb-2">Cách sử dụng:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Sao chép link và gửi qua email, tin nhắn</li>
                  <li>• Chia sẻ trên các nền tảng mạng xã hội</li>
                  <li>• Đăng lên website hoặc hệ thống quản lý học tập</li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="email" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email người nhận</Label>
              <Input
                id="email"
                type="email"
                placeholder="example@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Nội dung email</Label>
              <textarea
                id="message"
                className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>

            <div className="p-3 rounded-lg bg-secondary/50">
              <p className="text-sm text-muted-foreground">
                <strong>Link đề kiểm tra:</strong> {shareUrl}
              </p>
            </div>

            <Button onClick={handleSendEmail} className="w-full gap-2">
              <Mail className="w-4 h-4" />
              Gửi Email
            </Button>
          </TabsContent>

          <TabsContent value="qr" className="space-y-4 mt-4">
            <div className="flex flex-col items-center justify-center py-6">
              <div className="w-64 h-64 bg-white rounded-lg border-2 border-border p-4 flex items-center justify-center mb-4">
                <div className="text-center">
                  <QrCode className="w-32 h-32 mx-auto text-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">QR Code Preview</p>
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground text-center mb-4">
                Quét mã QR để truy cập đề kiểm tra
              </p>

              <Button onClick={handleDownloadQR} className="gap-2">
                <Download className="w-4 h-4" />
                Tải xuống QR Code
              </Button>
            </div>

            <Card className="bg-secondary/50">
              <CardContent className="p-4">
                <h4 className="font-semibold text-sm mb-2">Sử dụng QR Code:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• In QR code và dán lên bảng tin lớp học</li>
                  <li>• Thêm vào slide bài giảng hoặc tài liệu</li>
                  <li>• Học sinh quét mã để truy cập ngay lập tức</li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default ShareDialog;
