import { useParams, useNavigate } from "react-router-dom";
import DashboardLayout from "../components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { ArrowLeft, Download, Share2, Target, Loader2, FileText } from "lucide-react";
import { useToast } from "../hooks/use-toast";
import Layout from "../components/Layout";
import { useState, useEffect, useCallback } from "react";
interface Rubric {
  _id?: string;
  id?: string;
  title?: string;
  name?: string;
  subject?: { name: string; code?: string } | string;
  grade?: { level?: number; name: string } | string;
  assessment_type?: string;
  assessmentType?: string;
  description?: string;
  criteria?: Array<{
    name: string;
    weight?: number;
    weightPercent?: number;
    weight_percent?: number;
    description?: string;
    levels?: Array<{
      label: string;
      scoreRange?: string;
      score_range?: string;
      description: string;
    }>;
  }>;
  downloadToken?: string;
}

const RubricDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();

    const [rubricData, setRubricData] = useState<Rubric | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [downloadToken, setDownloadToken] = useState<string | null>(null);

    useEffect(() => {
        if (!id) {
            setIsLoading(false);
            return;
        }

        const fetchRubric = async () => {
            try {
                setIsLoading(true);
                
                const response = await fetch(`/api/v1/rubrics/${id}`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                });

                if (!response.ok) {
                    throw new Error(`Failed to fetch: ${response.status}`);
                }

                const result = await response.json();
                if (result.success && result.data) {
                    setRubricData(result.data);
                    if (result.data.downloadToken) {
                        setDownloadToken(result.data.downloadToken);
                    }
                } else {
                    throw new Error(result.message || 'Failed to load rubric');
                }
            } catch (error) {
                const errorMsg = error instanceof Error ? error.message : 'Không thể tải rubric';
                toast({
                    title: 'Lỗi tải dữ liệu',
                    description: errorMsg,
                    variant: 'destructive'
                });
            } finally {
                setIsLoading(false);
            }
        };

        fetchRubric();
    }, [id, toast]);

    const handleDownload = useCallback(() => {
        if (!downloadToken) {
            toast({
                title: 'Không có file download',
                description: 'Rubric này chưa có file sẵn sàng để tải.',
                variant: 'destructive'
            });
            return;
        }
        
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://gemini.veronlabs.com/bot5';
        const downloadUrl = `${API_BASE_URL}/api/v1/rubrics/download/${downloadToken}`;
        
        fetch(downloadUrl, { method: 'GET' })
            .then(response => response.blob())
            .then(blob => {
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `rubric_${downloadToken}.docx`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
                
                toast({
                    title: "Tải xuống thành công",
                    description: "Tài liệu rubric đang được tải xuống.",
                    variant: "default",
                });
            })
            .catch(error => {
                const errorMsg = error instanceof Error ? error.message : String(error);
                toast({
                    title: "Lỗi tải xuống",
                    description: errorMsg,
                    variant: "destructive",
                });
            });
    }, [downloadToken, toast]);

    const renderCriteria = () => {
        if (!rubricData?.criteria || rubricData.criteria.length === 0) {
            return <p className="text-center text-muted-foreground py-8">Không có tiêu chí nào.</p>;
        }
        
        return (
            <div className="space-y-6">
                {rubricData.criteria.map((c, index) => (
                    <div 
                        key={index} 
                        className="border p-4 rounded-xl shadow-md hover:shadow-lg transition-shadow bg-card/70"
                    >
                        <div className="flex justify-between items-start mb-3">
                            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                                <Target className="w-5 h-5 text-primary" />
                                {c.name}
                            </h3>
                            <Badge variant="default" className="text-base font-extrabold">
                                {c.weightPercent || c.weight_percent || c.weight || 0}%
                            </Badge>
                        </div>
                        {c.description && (
                            <div className="border-l-4 border-primary/70 pl-4 py-2 bg-primary/5">
                                <p className="text-sm text-muted-foreground italic">Mô tả:</p>
                                <p className="text-sm text-foreground mt-1">{c.description}</p>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        );
    };

    const renderDetailTable = () => {
        if (!rubricData?.criteria || rubricData.criteria.length === 0) {
            return <p className="text-center text-muted-foreground py-8">Không có dữ liệu chi tiết.</p>;
        }

        // Get all unique levels from all criteria
        const allLevels = rubricData.criteria[0]?.levels ?? [];
        if (allLevels.length === 0) {
            return <p className="text-center text-muted-foreground py-8">Không có mức độ được định nghĩa.</p>;
        }

        return (
            <div className="w-full overflow-x-auto">
                <table className="w-full border-collapse bg-card">
                    <thead>
                        <tr className="border-b bg-muted/50">
                            <th className="p-4 text-left font-semibold text-muted-foreground" style={{ width: '30%' }}>Tiêu chí đánh giá</th>
                            <th className="p-4 text-center font-semibold text-muted-foreground" style={{ width: '10%' }}>Trọng số</th>
                            <th className="p-4 font-semibold text-muted-foreground" colSpan={allLevels.length}>Mức độ đạt được & Thang điểm</th>
                        </tr>
                        <tr className="border-b bg-muted/30">
                            <th className="p-4"></th>
                            <th className="p-4"></th>
                            {allLevels.map((level, idx) => (
                                <th key={idx} className="p-4 text-center font-medium text-muted-foreground whitespace-nowrap">
                                    {level.label}
                                    <div className="text-xs text-primary/70">{level.scoreRange || level.score_range || ''}</div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {rubricData.criteria.map((c, index) => (
                            <tr key={`table-${index}`} className="hover:bg-muted/30 transition-colors">
                                <td className="p-4">
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 w-2 rounded-full bg-primary/70"></div>
                                        <span className="font-medium">{c.name}</span>
                                    </div>
                                </td>
                                <td className="p-4 text-center font-semibold text-primary">
                                    {c.weightPercent || c.weight_percent || c.weight || 0}%
                                </td>
                                {c.levels?.map((level, idx) => (
                                    <td key={idx} className="p-4 text-sm">
                                        <div className="text-muted-foreground text-justify line-clamp-4">
                                            {level.description}
                                        </div>
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    if (isLoading) {
        return (
            <Layout>
                <DashboardLayout>
                    <div className="flex items-center justify-center py-16">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                </DashboardLayout>
            </Layout>
        );
    }

    if (!rubricData) {
        return (
            <Layout>
                <DashboardLayout>
                    <div className="flex flex-col items-center justify-center py-16">
                        <FileText className="w-8 h-8 text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">Không tìm thấy rubric</p>
                        <Button onClick={() => navigate(-1)} className="mt-4">Quay lại</Button>
                    </div>
                </DashboardLayout>
            </Layout>
        );
    }

    return (
        <Layout>
            <DashboardLayout>
                <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
                    <div className="flex items-center justify-between mb-6">
                        <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2">
                            <ArrowLeft className="w-5 h-5" />
                            Quay lại
                        </Button>
                        <div className="space-x-2">
                            <Button variant="outline">
                                <Share2 className="w-4 h-4 mr-2" />
                                Chia sẻ
                            </Button>
                            <Button
                                variant="outline"
                                onClick={handleDownload}
                                disabled={!downloadToken}
                            >
                                <Download className="w-4 h-4 mr-2" />
                                Tải xuống
                            </Button>
                        </div>
                    </div>

                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle className="text-2xl font-bold">{rubricData.title || rubricData.name}</CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                                {typeof rubricData.subject === 'object' ? rubricData.subject?.name : rubricData.subject}
                                {' • '}
                                {typeof rubricData.grade === 'object' ? rubricData.grade?.name : rubricData.grade}
                                {' • '}
                                {rubricData.assessmentType || rubricData.assessment_type}
                            </p>
                            <div className="mt-4 flex items-center gap-2">
                                {rubricData.criteria && (
                                    <Badge variant="secondary">
                                        <Target className="w-3 h-3 mr-1" /> {rubricData.criteria.length} Tiêu chí
                                    </Badge>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-foreground">{rubricData.description || 'Không có mô tả'}</p>
                        </CardContent>
                    </Card>

                    <Tabs defaultValue="criteria" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="criteria">Tiêu chí</TabsTrigger>
                            <TabsTrigger value="details">Chi tiết</TabsTrigger>
                        </TabsList>

                        <TabsContent value="criteria" className="mt-6">
                            <Card>
                                <CardContent className="pt-6">
                                    {renderCriteria()}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="details" className="mt-6">
                            <Card>
                                <CardContent className="pt-6">
                                    {renderDetailTable()}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </DashboardLayout>
        </Layout>
    );
};

export default RubricDetail;
