import { useState } from 'react';
import { Sliders } from 'lucide-react';
import * as SliderPrimitive from '@radix-ui/react-slider';
import { cn } from '../lib/utils';

/**
 * Slider Component (shadcn-style)
 */
function Slider({ className, value, onValueChange, min = 0, max = 100, step = 1, ...props }) {
  return (
    <SliderPrimitive.Root
      className={cn(
        "relative flex w-full touch-none select-none items-center",
        className
      )}
      value={[value]}
      onValueChange={(vals) => onValueChange(vals[0])}
      min={min}
      max={max}
      step={step}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
        <SliderPrimitive.Range className="absolute h-full bg-primary" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
    </SliderPrimitive.Root>
  );
}

/**
 * ControlPanel Component
 * Interactive controls for Kuramoto model parameters
 */
export default function ControlPanel({
  parameters,
  onParameterChange,
  onNetworkChange,
  onPlayPause,
  onReset,
  isPlaying
}) {
  const [networkType, setNetworkType] = useState('all-to-all');
  const [networkParams, setNetworkParams] = useState({
    probability: 0.1,
    k: 4,
    rewiringProb: 0.1,
    m: 2
  });

  const handleNetworkTypeChange = (e) => {
    const type = e.target.value;
    setNetworkType(type);
    onNetworkChange(type, networkParams);
  };

  const handleNetworkParamChange = (param, value) => {
    const newParams = { ...networkParams, [param]: value };
    setNetworkParams(newParams);
    onNetworkChange(networkType, newParams);
  };

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6 space-y-6">
      <div className="flex items-center gap-3 mb-4">
        <Sliders className="text-primary" size={24} />
        <h2 className="text-2xl font-bold">Controls</h2>
      </div>

      {/* Model Parameters */}
      <div className="space-y-5">
        <h3 className="text-md font-semibold flex items-center gap-2">
          Model Parameters
        </h3>

        {/* Number of Oscillators */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <label className="text-sm font-medium">
              Oscillators (N)
            </label>
            <span className="px-3 py-1 text-sm font-bold bg-secondary text-secondary-foreground rounded-md">
              {parameters.N}
            </span>
          </div>
          <Slider
            value={parameters.N}
            onValueChange={(value) => onParameterChange('N', value)}
            min={10}
            max={100}
            step={5}
          />
        </div>

        {/* Coupling Strength */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <label className="text-sm font-medium">
              Coupling (K)
            </label>
            <span className="px-3 py-1 text-sm font-bold bg-secondary text-secondary-foreground rounded-md">
              {parameters.K.toFixed(1)}
            </span>
          </div>
          <Slider
            value={parameters.K}
            onValueChange={(value) => onParameterChange('K', value)}
            min={0}
            max={10}
            step={0.1}
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>Weak</span>
            <span>Strong</span>
          </div>
        </div>

        {/* Noise Level */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <label className="text-sm font-medium">
              Noise Level
            </label>
            <span className="px-3 py-1 text-sm font-bold bg-secondary text-secondary-foreground rounded-md">
              {parameters.noiseLevel.toFixed(2)}
            </span>
          </div>
          <Slider
            value={parameters.noiseLevel}
            onValueChange={(value) => onParameterChange('noiseLevel', value)}
            min={0}
            max={2}
            step={0.05}
          />
        </div>

        {/* Phase Lag */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <label className="text-sm font-medium">
              Phase Lag (α)
            </label>
            <span className="px-3 py-1 text-sm font-bold bg-secondary text-secondary-foreground rounded-md">
              {parameters.phaseLag.toFixed(2)}
            </span>
          </div>
          <Slider
            value={parameters.phaseLag}
            onValueChange={(value) => onParameterChange('phaseLag', value)}
            min={0}
            max={2}
            step={0.1}
          />
        </div>
      </div>

      {/* Network Topology */}
      <div className="space-y-4 pt-4 border-t border-border">
        <h3 className="text-md font-semibold">Network Topology</h3>

        <div>
          <label className="block text-sm font-medium mb-2">
            Network Type
          </label>
          <select
            value={networkType}
            onChange={handleNetworkTypeChange}
            className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="all-to-all">All-to-All</option>
            <option value="random">Random</option>
            <option value="small-world">Small-World</option>
            <option value="scale-free">Scale-Free</option>
            <option value="ring">Ring Lattice</option>
          </select>
        </div>

        {/* Network-specific parameters */}
        {networkType === 'random' && (
          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="text-sm font-medium">
                Connection Prob
              </label>
              <span className="px-3 py-1 text-sm font-bold bg-secondary text-secondary-foreground rounded-md">
                {networkParams.probability.toFixed(2)}
              </span>
            </div>
            <Slider
              value={networkParams.probability}
              onValueChange={(value) => handleNetworkParamChange('probability', value)}
              min={0.01}
              max={0.5}
              step={0.01}
            />
          </div>
        )}

        {networkType === 'small-world' && (
          <>
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-medium">
                  Neighbors (k)
                </label>
                <span className="px-3 py-1 text-sm font-bold bg-secondary text-secondary-foreground rounded-md">
                  {networkParams.k}
                </span>
              </div>
              <Slider
                value={networkParams.k}
                onValueChange={(value) => handleNetworkParamChange('k', value)}
                min={2}
                max={10}
                step={2}
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-medium">
                  Rewiring Prob
                </label>
                <span className="px-3 py-1 text-sm font-bold bg-secondary text-secondary-foreground rounded-md">
                  {networkParams.rewiringProb.toFixed(2)}
                </span>
              </div>
              <Slider
                value={networkParams.rewiringProb}
                onValueChange={(value) => handleNetworkParamChange('rewiringProb', value)}
                min={0}
                max={1}
                step={0.05}
              />
            </div>
          </>
        )}

        {networkType === 'scale-free' && (
          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="text-sm font-medium">
                Edges per Node (m)
              </label>
              <span className="px-3 py-1 text-sm font-bold bg-secondary text-secondary-foreground rounded-md">
                {networkParams.m}
              </span>
            </div>
            <Slider
              value={networkParams.m}
              onValueChange={(value) => handleNetworkParamChange('m', value)}
              min={1}
              max={5}
              step={1}
            />
          </div>
        )}

        {networkType === 'ring' && (
          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="text-sm font-medium">
                Neighbors (k)
              </label>
              <span className="px-3 py-1 text-sm font-bold bg-secondary text-secondary-foreground rounded-md">
                {networkParams.k}
              </span>
            </div>
            <Slider
              value={networkParams.k}
              onValueChange={(value) => handleNetworkParamChange('k', value)}
              min={1}
              max={6}
              step={1}
            />
          </div>
        )}
      </div>
    </div>
  );
}
