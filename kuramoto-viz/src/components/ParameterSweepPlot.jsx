import { useState, useMemo } from 'react';

/**
 * ParameterSweepPlot Component
 * Interactive scatter plot showing parameter vs final r relationship
 */
export default function ParameterSweepPlot({ runs, xParam = 'K', title }) {
  const [hoveredRun, setHoveredRun] = useState(null);

  // Plot dimensions
  const width = 600;
  const height = 400;
  const margin = { top: 40, right: 40, bottom: 60, left: 60 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;

  // Extract data
  const data = useMemo(() => {
    return runs.map(run => ({
      x: xParam === 'K' ? run.parameters.K :
         xParam === 'N' ? run.parameters.N :
         xParam === 'noise' ? run.parameters.noiseLevel :
         run.parameters.phaseLag,
      y: run.metrics.finalR,
      network: run.network.type,
      name: run.name,
      run
    }));
  }, [runs, xParam]);

  // Calculate scales
  const xExtent = useMemo(() => {
    const values = data.map(d => d.x);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const padding = (max - min) * 0.1 || 0.5;
    return [Math.max(0, min - padding), max + padding];
  }, [data]);

  const yExtent = [0, 1];

  const xScale = (value) => {
    return margin.left + ((value - xExtent[0]) / (xExtent[1] - xExtent[0])) * plotWidth;
  };

  const yScale = (value) => {
    return height - margin.bottom - ((value - yExtent[0]) / (yExtent[1] - yExtent[0])) * plotHeight;
  };

  // Network colors
  const networkColors = {
    'all-to-all': '#3b82f6',
    'ring': '#ef4444',
    'small-world': '#10b981',
    'scale-free': '#f59e0b',
    'random': '#8b5cf6'
  };

  // Axis labels
  const xLabel = xParam === 'K' ? 'Coupling Strength K' :
                 xParam === 'N' ? 'Number of Oscillators N' :
                 xParam === 'noise' ? 'Noise Level' :
                 'Phase Lag α';

  // Generate tick marks
  const xTicks = useMemo(() => {
    const range = xExtent[1] - xExtent[0];
    const step = range / 5;
    return Array.from({ length: 6 }, (_, i) => xExtent[0] + i * step);
  }, [xExtent]);

  const yTicks = [0, 0.2, 0.4, 0.6, 0.8, 1.0];

  // Critical coupling line (for K plots)
  const criticalK = 0.64;

  return (
    <div className="relative">
      <svg
        width={width}
        height={height}
        className="bg-background rounded-lg border"
        style={{ maxWidth: '100%', height: 'auto' }}
        viewBox={`0 0 ${width} ${height}`}
      >
        {/* Title */}
        <text
          x={width / 2}
          y={margin.top / 2}
          textAnchor="middle"
          className="fill-foreground font-semibold text-base"
        >
          {title || `${xLabel} vs Synchronization`}
        </text>

        {/* Grid lines */}
        <g className="opacity-20">
          {xTicks.map((tick, i) => (
            <line
              key={`x-grid-${i}`}
              x1={xScale(tick)}
              y1={margin.top}
              x2={xScale(tick)}
              y2={height - margin.bottom}
              className="stroke-muted-foreground"
              strokeWidth="1"
            />
          ))}
          {yTicks.map((tick, i) => (
            <line
              key={`y-grid-${i}`}
              x1={margin.left}
              y1={yScale(tick)}
              x2={width - margin.right}
              y2={yScale(tick)}
              className="stroke-muted-foreground"
              strokeWidth="1"
            />
          ))}
        </g>

        {/* Critical coupling line (only for K plots) */}
        {xParam === 'K' && criticalK >= xExtent[0] && criticalK <= xExtent[1] && (
          <g>
            <line
              x1={xScale(criticalK)}
              y1={margin.top}
              x2={xScale(criticalK)}
              y2={height - margin.bottom}
              className="stroke-primary"
              strokeWidth="2"
              strokeDasharray="5,5"
            />
            <text
              x={xScale(criticalK) + 5}
              y={margin.top + 15}
              className="fill-primary text-xs font-semibold"
            >
              K_c ≈ {criticalK}
            </text>
          </g>
        )}

        {/* X axis */}
        <line
          x1={margin.left}
          y1={height - margin.bottom}
          x2={width - margin.right}
          y2={height - margin.bottom}
          className="stroke-foreground"
          strokeWidth="2"
        />
        {xTicks.map((tick, i) => (
          <g key={`x-tick-${i}`}>
            <line
              x1={xScale(tick)}
              y1={height - margin.bottom}
              x2={xScale(tick)}
              y2={height - margin.bottom + 6}
              className="stroke-foreground"
              strokeWidth="2"
            />
            <text
              x={xScale(tick)}
              y={height - margin.bottom + 20}
              textAnchor="middle"
              className="fill-foreground text-xs"
            >
              {tick.toFixed(1)}
            </text>
          </g>
        ))}
        <text
          x={width / 2}
          y={height - 10}
          textAnchor="middle"
          className="fill-foreground text-sm font-medium"
        >
          {xLabel}
        </text>

        {/* Y axis */}
        <line
          x1={margin.left}
          y1={margin.top}
          x2={margin.left}
          y2={height - margin.bottom}
          className="stroke-foreground"
          strokeWidth="2"
        />
        {yTicks.map((tick, i) => (
          <g key={`y-tick-${i}`}>
            <line
              x1={margin.left - 6}
              y1={yScale(tick)}
              x2={margin.left}
              y2={yScale(tick)}
              className="stroke-foreground"
              strokeWidth="2"
            />
            <text
              x={margin.left - 10}
              y={yScale(tick)}
              textAnchor="end"
              dominantBaseline="middle"
              className="fill-foreground text-xs"
            >
              {tick.toFixed(1)}
            </text>
          </g>
        ))}
        <text
          x={15}
          y={margin.top + plotHeight / 2}
          textAnchor="middle"
          transform={`rotate(-90, 15, ${margin.top + plotHeight / 2})`}
          className="fill-foreground text-sm font-medium"
        >
          Order Parameter r
        </text>

        {/* Data points */}
        {data.map((point, i) => (
          <circle
            key={i}
            cx={xScale(point.x)}
            cy={yScale(point.y)}
            r={hoveredRun === point.run.id ? 8 : 6}
            fill={networkColors[point.network] || '#666'}
            className="cursor-pointer transition-all"
            opacity={hoveredRun === null || hoveredRun === point.run.id ? 0.8 : 0.3}
            stroke={hoveredRun === point.run.id ? '#fff' : 'none'}
            strokeWidth={2}
            onMouseEnter={() => setHoveredRun(point.run.id)}
            onMouseLeave={() => setHoveredRun(null)}
          />
        ))}
      </svg>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-3 justify-center text-xs">
        {Object.entries(networkColors).map(([type, color]) => {
          const hasData = data.some(d => d.network === type);
          if (!hasData) return null;

          const label = type === 'all-to-all' ? 'All-to-All' :
                       type === 'small-world' ? 'Small-World' :
                       type === 'scale-free' ? 'Scale-Free' :
                       type.charAt(0).toUpperCase() + type.slice(1);

          return (
            <div key={type} className="flex items-center gap-1.5">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className="text-muted-foreground">{label}</span>
            </div>
          );
        })}
      </div>

      {/* Tooltip */}
      {hoveredRun && (
        <div className="absolute top-2 right-2 p-3 rounded-lg border bg-card shadow-lg text-xs max-w-xs z-10">
          {(() => {
            const point = data.find(d => d.run.id === hoveredRun);
            if (!point) return null;

            return (
              <>
                <div className="font-semibold mb-1">{point.name}</div>
                <div className="space-y-0.5 text-muted-foreground">
                  <div>{xLabel}: {point.x.toFixed(2)}</div>
                  <div>Final r: {point.y.toFixed(3)}</div>
                  <div>Mean r: {point.run.metrics.meanR.toFixed(3)}</div>
                  <div className="capitalize">Network: {point.network.replace('-', ' ')}</div>
                </div>
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}
