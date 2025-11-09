import { Info, Sparkles } from 'lucide-react';

/**
 * InfoPanel Component
 * Quick reference guide in the sidebar
 */
export default function InfoPanel() {
  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6 space-y-5">
      <div className="flex items-center gap-3 mb-2">
        <Info className="text-primary" size={24} />
        <h2 className="text-xl font-bold">Quick Reference</h2>
      </div>

      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-primary">What to Watch</h3>
        <div className="text-xs text-muted-foreground space-y-1.5 leading-relaxed">
          <p><strong className="text-foreground">Phase Circle:</strong> Colored dots show oscillator phases. Clustering = synchronization!</p>
          <p><strong className="text-foreground">Network Topology:</strong> Node colors indicate phase. Watch patterns emerge.</p>
          <p><strong className="text-foreground">Order Parameter r(t):</strong> Measures sync strength (0 = chaos, 1 = perfect sync).</p>
        </div>
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-primary">Keyboard Shortcuts</h3>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Play/Pause</span>
            <kbd className="px-2 py-0.5 rounded bg-secondary text-secondary-foreground font-mono border">Space</kbd>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Reset</span>
            <kbd className="px-2 py-0.5 rounded bg-secondary text-secondary-foreground font-mono border">R</kbd>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Presets & Docs</span>
            <kbd className="px-2 py-0.5 rounded bg-secondary text-secondary-foreground font-mono border">P</kbd>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Export</span>
            <kbd className="px-2 py-0.5 rounded bg-secondary text-secondary-foreground font-mono border">E</kbd>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Adjust K</span>
            <kbd className="px-2 py-0.5 rounded bg-secondary text-secondary-foreground font-mono border">+/-</kbd>
          </div>
        </div>
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-primary">Tips for Exploration</h3>
        <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside leading-relaxed">
          <li>Start with "Critical Point" preset</li>
          <li>Use +/- keys to explore phase transitions</li>
          <li>Watch r(t) jump at critical coupling</li>
          <li>Compare different network topologies</li>
        </ul>
      </section>

      <div className="pt-3 border-t">
        <button
          onClick={() => {
            // Trigger preset menu open via keyboard event
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'p' }));
          }}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Sparkles size={16} />
          Open Presets & Guide
        </button>
      </div>
    </div>
  );
}
