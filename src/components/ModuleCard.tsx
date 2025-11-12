import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { ArrowRight } from "lucide-react";

interface ModuleCardProps {
  title: string;
  subtitle: string;
  description: string;
  icon: LucideIcon;
  iconColor: string;
  gradientFrom: string;
  gradientTo: string;
  features: string[];
  onAction: () => void;
  actionText: string;
}

const ModuleCard = ({
  title,
  subtitle,
  description,
  icon: Icon,
  iconColor,
  gradientFrom,
  gradientTo,
  features,
  onAction,
  actionText,
}: ModuleCardProps) => {
  return (
    <Card className="group card-elevated hover:border-primary/30 transition-all duration-300 overflow-hidden">
      <div
        className={`h-2 w-full bg-gradient-to-r ${gradientFrom} ${gradientTo}`}
      ></div>
      <CardContent className="p-6">
        <div className="flex items-start gap-4 mb-4">
          <div className={`p-3 rounded-xl ${iconColor} bg-opacity-10 group-hover:scale-110 transition-transform duration-300`}>
            <Icon className={`w-6 h-6 ${iconColor}`} />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg text-foreground mb-1">{title}</h3>
            <p className="text-sm text-primary font-medium">{subtitle}</p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
          {description}
        </p>

        <div className="space-y-2 mb-6">
          {features.map((feature, index) => (
            <div key={index} className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
              <span>{feature}</span>
            </div>
          ))}
        </div>

        <Button
          onClick={onAction}
          className="w-full group/btn"
          variant="default"
        >
          {actionText}
          <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
        </Button>
      </CardContent>
    </Card>
  );
};

export default ModuleCard;
