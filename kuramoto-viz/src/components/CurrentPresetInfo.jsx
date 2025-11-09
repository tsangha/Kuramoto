import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

/**
 * CurrentPresetInfo Component
 * Displays information about the currently loaded preset
 */
export default function CurrentPresetInfo({ preset, onClear }) {
  if (!preset) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10, height: 0 }}
        animate={{ opacity: 1, y: 0, height: 'auto' }}
        exit={{ opacity: 0, y: -10, height: 0 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        className="rounded-lg border bg-gradient-to-br from-primary/10 to-accent/10 text-card-foreground shadow-sm p-4 relative overflow-hidden"
      >
        {/* Decorative background element */}
        <div className="absolute top-0 right-0 text-6xl opacity-5 pointer-events-none">
          {preset.icon}
        </div>

        {/* Close button */}
        <button
          onClick={onClear}
          className="absolute top-2 right-2 inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 hover:bg-accent hover:text-accent-foreground w-6 h-6 p-0 opacity-70 hover:opacity-100"
          title="Clear preset info"
        >
          <X size={14} />
        </button>

        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">{preset.icon}</span>
            <div>
              <h3 className="font-bold text-sm">{preset.name}</h3>
              <p className="text-xs text-muted-foreground">
                {preset.category === 'critical' && 'Critical Phenomena'}
                {preset.category === 'topology' && 'Network Effects'}
                {preset.category === 'complex' && 'Complex Dynamics'}
              </p>
            </div>
          </div>

          {/* Description */}
          <p className="text-xs text-muted-foreground leading-relaxed mb-3">
            {preset.description}
          </p>

          {/* Watch For */}
          {preset.watchFor && (
            <div className="mb-3 p-2 rounded-md bg-blue-500/10 border border-blue-500/20">
              <p className="text-xs text-blue-600 dark:text-blue-400">
                <span className="font-semibold">👁️ Watch for:</span> {preset.watchFor}
              </p>
            </div>
          )}

          {/* Note */}
          {preset.note && (
            <div className="p-2 rounded-md bg-primary/10 border border-primary/20">
              <p className="text-xs text-primary">
                <span className="font-semibold">💡 Tip:</span> {preset.note}
              </p>
            </div>
          )}

          {/* Parameters */}
          <div className="mt-3 pt-3 border-t border-border/50">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-muted-foreground">K:</span>{' '}
                <span className="font-mono font-semibold">{preset.parameters.K}</span>
              </div>
              <div>
                <span className="text-muted-foreground">N:</span>{' '}
                <span className="font-mono font-semibold">{preset.parameters.N}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Noise:</span>{' '}
                <span className="font-mono font-semibold">{preset.parameters.noiseLevel}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Network:</span>{' '}
                <span className="font-mono font-semibold text-xs">
                  {preset.network.type === 'all-to-all' && 'All-to-All'}
                  {preset.network.type === 'ring' && 'Ring'}
                  {preset.network.type === 'small-world' && 'Small-World'}
                  {preset.network.type === 'scale-free' && 'Scale-Free'}
                  {preset.network.type === 'random' && 'Random'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
