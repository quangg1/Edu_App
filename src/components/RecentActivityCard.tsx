import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Clock, MoreVertical } from "lucide-react";
import { LucideIcon } from "lucide-react";

interface RecentActivityCardProps {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  iconColor: string;
  timeAgo: string;
  progress?: number;
  onContinue: () => void;
}

const RecentActivityCard = ({
  title,
  subtitle,
  icon: Icon,
  iconColor,
  timeAgo,
  progress,
  onContinue,
}: RecentActivityCardProps) => {
  return (
    <Card className="card-elevated hover:border-primary/20 transition-all">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg ${iconColor} bg-opacity-10`}>
            <Icon className={`w-4 h-4 ${iconColor}`} />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm text-foreground mb-1 truncate">
              {title}
            </h4>
            <p className="text-xs text-muted-foreground mb-2">{subtitle}</p>
            
            {progress !== undefined && (
              <div className="mb-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                  <span>Tiến độ</span>
                  <span className="font-medium">{progress}%</span>
                </div>
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span>{timeAgo}</span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={onContinue}
                className="h-7 text-xs"
              >
                Tiếp tục
              </Button>
            </div>
          </div>
          <Button size="icon" variant="ghost" className="h-8 w-8">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentActivityCard;
