import { useMemo } from 'react';
import { detectInsights } from '../utils/insightDetection';
import InsightCard from './InsightCard';
import ParameterSweepPlot from './ParameterSweepPlot';
import { TrendingUp, Lightbulb } from 'lucide-react';

/**
 * JourneyView Component
 * Educational journey through parameter space with visualizations and insights
 */
export default function JourneyView({ runs }) {
  // Detect insights from runs
  const insights = useMemo(() => detectInsights(runs), [runs]);

  // Determine which plots to show based on available data
  const hasKVariation = useMemo(() => {
    const kValues = runs.map(r => r.parameters.K);
    return new Set(kValues).size > 1;
  }, [runs]);

  const hasNoiseVariation = useMemo(() => {
    const noiseValues = runs.map(r => r.parameters.noiseLevel);
    return noiseValues.some(n => n > 0);
  }, [runs]);

  const hasNVariation = useMemo(() => {
    const nValues = runs.map(r => r.parameters.N);
    return new Set(nValues).size > 1;
  }, [runs]);

  return (
    <div className="space-y-8">
      {/* Insights Section */}
      {insights.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="text-primary" size={24} />
            <h3 className="text-lg font-semibold">Discovered Insights</h3>
          </div>
          <div className="space-y-3">
            {insights.map((insight, i) => (
              <InsightCard key={i} insight={insight} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* Parameter Sweep Plots */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="text-primary" size={24} />
          <h3 className="text-lg font-semibold">Parameter Relationships</h3>
        </div>

        <div className="space-y-6">
          {/* K vs r plot - most important */}
          {hasKVariation && (
            <div className="p-4 rounded-lg border bg-card">
              <ParameterSweepPlot
                runs={runs}
                xParam="K"
                title="Coupling Strength vs Synchronization"
              />
              <div className="mt-3 text-xs text-muted-foreground">
                This plot shows the phase transition from chaos (low r) to order (high r) as coupling K increases.
                The dashed line marks the theoretical critical coupling K_c for all-to-all networks.
              </div>
            </div>
          )}

          {/* Noise vs r plot */}
          {hasNoiseVariation && (
            <div className="p-4 rounded-lg border bg-card">
              <ParameterSweepPlot
                runs={runs}
                xParam="noise"
                title="Noise Level vs Synchronization"
              />
              <div className="mt-3 text-xs text-muted-foreground">
                Stochastic noise disrupts synchronization. Near the critical point, even small noise can have dramatic effects.
              </div>
            </div>
          )}

          {/* N vs r plot */}
          {hasNVariation && (
            <div className="p-4 rounded-lg border bg-card">
              <ParameterSweepPlot
                runs={runs}
                xParam="N"
                title="System Size vs Synchronization"
              />
              <div className="mt-3 text-xs text-muted-foreground">
                Larger systems (more oscillators) can show different collective behavior. For some networks, size affects critical coupling.
              </div>
            </div>
          )}

          {/* No variation message */}
          {!hasKVariation && !hasNoiseVariation && !hasNVariation && (
            <div className="p-6 border-2 border-dashed rounded-lg bg-muted/30 text-center">
              <TrendingUp size={48} className="mx-auto text-muted-foreground/50 mb-3" />
              <h4 className="font-semibold mb-2">Start Exploring Parameter Space</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Try different values of K, noise, or N and save runs to see patterns emerge!
              </p>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>• Use <kbd className="px-1 py-0.5 rounded bg-secondary">+/-</kbd> keys to adjust K</p>
                <p>• Change parameters in the control panel</p>
                <p>• Press <kbd className="px-1 py-0.5 rounded bg-secondary">S</kbd> to save each configuration</p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Quick Stats */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-lg border bg-card">
          <div className="text-2xl font-bold text-primary">
            {runs.length}
          </div>
          <div className="text-xs text-muted-foreground">Total Runs</div>
        </div>

        <div className="p-4 rounded-lg border bg-card">
          <div className="text-2xl font-bold text-primary">
            {new Set(runs.map(r => r.network.type)).size}
          </div>
          <div className="text-xs text-muted-foreground">Network Types Explored</div>
        </div>

        <div className="p-4 rounded-lg border bg-card">
          <div className="text-2xl font-bold text-primary">
            {insights.length}
          </div>
          <div className="text-xs text-muted-foreground">Insights Discovered</div>
        </div>
      </section>

      {/* Educational Tips */}
      {runs.length > 0 && runs.length < 5 && (
        <section className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <h4 className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-2">
            💡 Build Your Understanding
          </h4>
          <p className="text-xs text-blue-600 dark:text-blue-400">
            You have {runs.length} runs so far. Try saving 5-10 runs across different K values to see the full phase transition curve!
            Load the "Critical Phenomena" presets to experience the transition from chaos to order.
          </p>
        </section>
      )}
    </div>
  );
}
