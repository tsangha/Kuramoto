import { motion } from 'framer-motion';
import { Lightbulb, AlertCircle, TrendingUp } from 'lucide-react';

/**
 * InsightCard Component
 * Displays educational insights discovered from run analysis
 */
export default function InsightCard({ insight, index }) {
  const getPriorityColors = (priority) => {
    switch (priority) {
      case 'high':
        return {
          border: 'border-l-4 border-l-primary',
          bg: 'bg-primary/5',
          icon: 'text-primary'
        };
      case 'medium':
        return {
          border: 'border-l-4 border-l-blue-500',
          bg: 'bg-blue-500/5',
          icon: 'text-blue-500'
        };
      case 'low':
        return {
          border: 'border-l-4 border-l-muted-foreground',
          bg: 'bg-muted/30',
          icon: 'text-muted-foreground'
        };
      default:
        return {
          border: 'border-l-4 border-l-accent',
          bg: 'bg-accent/10',
          icon: 'text-accent'
        };
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'phase-transition':
      case 'hysteresis':
        return <AlertCircle size={20} />;
      case 'topology-effect':
      case 'noise-effect':
        return <TrendingUp size={20} />;
      default:
        return <Lightbulb size={20} />;
    }
  };

  const colors = getPriorityColors(insight.priority);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`rounded-lg border ${colors.border} ${colors.bg} p-4 sm:p-5`}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className="flex-shrink-0">
          <div className="flex items-center justify-center">
            <span className="text-3xl sm:text-4xl">{insight.icon}</span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <h4 className="font-bold text-base sm:text-lg">{insight.title}</h4>
            <div className={`flex-shrink-0 ${colors.icon}`}>
              {getTypeIcon(insight.type)}
            </div>
          </div>

          {/* Description */}
          <p className="text-sm text-foreground mb-3 leading-relaxed">
            {insight.description}
          </p>

          {/* Details */}
          {insight.details && (
            <div className="mb-3 p-3 rounded-md bg-background/50 border border-border/50">
              <p className="text-xs text-muted-foreground leading-relaxed">
                {insight.details}
              </p>
            </div>
          )}

          {/* Action */}
          {insight.action && (
            <div className={`flex items-start gap-2 p-3 rounded-md ${
              insight.priority === 'high'
                ? 'bg-primary/10 border border-primary/20'
                : 'bg-blue-500/10 border border-blue-500/20'
            }`}>
              <Lightbulb size={16} className={`flex-shrink-0 mt-0.5 ${
                insight.priority === 'high' ? 'text-primary' : 'text-blue-500'
              }`} />
              <p className={`text-xs font-medium ${
                insight.priority === 'high'
                  ? 'text-primary'
                  : 'text-blue-600 dark:text-blue-400'
              }`}>
                <span className="font-semibold">Next step:</span> {insight.action}
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
