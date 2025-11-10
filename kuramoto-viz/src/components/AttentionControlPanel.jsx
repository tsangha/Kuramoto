import { useState } from 'react';
import { Plus, Trash2, Play, Pause, RotateCcw, Eye, Layers } from 'lucide-react';

export default function AttentionControlPanel({
  parameters,
  onParameterChange,
  onNetworkChange,
  onAddObject,
  onClearObjects,
  onPlayPause,
  onReset,
  isPlaying,
  state
}) {
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [newObject, setNewObject] = useState({
    radius: 3,
    intensity: 1.0,
    vx: 1.0,
    vy: 0.5,
    hue: 0.5,
    brightness: 0.8,
    feature3: 0.5
  });

  const handleAddObject = () => {
    const gridSize = state?.gridSize || 32;

    // Random position
    const x = Math.random() * gridSize;
    const y = Math.random() * gridSize;

    // Convert HSB to RGB for features
    const hue = newObject.hue;
    const sat = 1.0;
    const bri = newObject.brightness;

    const color = hslToRgb(hue, sat, bri);

    onAddObject({
      x,
      y,
      vx: newObject.vx,
      vy: newObject.vy,
      radius: newObject.radius,
      intensity: newObject.intensity,
      features: [color[0], color[1], color[2]] // RGB as first 3 features
    });

    setShowAddPanel(false);
  };

  // Helper to convert HSL to RGB
  function hslToRgb(h, s, l) {
    let r, g, b;

    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }

    return [r, g, b];
  }

  const trackedCount = state?.trackedObjects?.length || 0;
  const totalObjects = state?.objects?.length || 0;

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4">
      <h3 className="text-lg font-semibold mb-4">Attention Controls</h3>

      {/* Play/Pause/Reset */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={onPlayPause}
          className="flex-1 inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 gap-2"
        >
          {isPlaying ? <Pause size={16} /> : <Play size={16} />}
          {isPlaying ? 'Pause' : 'Play'}
        </button>
        <button
          onClick={onReset}
          className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4"
          title="Reset"
        >
          <RotateCcw size={16} />
        </button>
      </div>

      {/* Tracking Stats */}
      <div className="mb-6 p-3 rounded bg-muted/50">
        <div className="text-sm font-medium mb-2">Tracking Status</div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-muted-foreground">Objects:</span>
            <span className="ml-2 font-mono">{totalObjects}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Tracked:</span>
            <span className="ml-2 font-mono text-green-500">{trackedCount}</span>
          </div>
        </div>
      </div>

      {/* Network Topology */}
      <div className="mb-6">
        <label className="text-sm font-medium mb-2 block">Network Topology</label>
        <select
          className="w-full px-3 py-2 rounded-md border bg-background text-sm"
          onChange={(e) => onNetworkChange(e.target.value, {})}
          defaultValue="spatial"
        >
          <option value="spatial">Spatial (Distance-based)</option>
          <option value="all-to-all">All-to-All</option>
          <option value="ring">Ring</option>
          <option value="small-world">Small-World</option>
          <option value="scale-free">Scale-Free</option>
          <option value="random">Random</option>
        </select>
        <p className="text-xs text-muted-foreground mt-1">
          Controls which grid cells can couple
        </p>
      </div>

      {/* Base Kuramoto Parameters */}
      <div className="space-y-4 mb-6">
        <div className="text-sm font-medium mb-2">Base Kuramoto Parameters</div>

        <div>
          <label className="text-sm font-medium mb-1 block">
            Coupling Strength (K): {(parameters.K ?? 2.0).toFixed(2)}
          </label>
          <input
            type="range"
            min="0"
            max="10"
            step="0.1"
            value={parameters.K ?? 2.0}
            onChange={(e) => onParameterChange('K', parseFloat(e.target.value))}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Base coupling strength (shared with Network mode)
          </p>
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block">
            Noise Level: {(parameters.noiseLevel ?? 0.0).toFixed(2)}
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={parameters.noiseLevel ?? 0.0}
            onChange={(e) => onParameterChange('noiseLevel', parseFloat(e.target.value))}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Shared with Network mode
          </p>
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block">
            Phase Lag (α): {(parameters.phaseLag ?? 0.0).toFixed(2)}
          </label>
          <input
            type="range"
            min="-3.14"
            max="3.14"
            step="0.1"
            value={parameters.phaseLag ?? 0.0}
            onChange={(e) => onParameterChange('phaseLag', parseFloat(e.target.value))}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Shared with Network mode
          </p>
        </div>
      </div>

      {/* Stimulus Parameters */}
      <div className="space-y-4 mb-6">
        <div className="text-sm font-medium mb-2">Stimulus Parameters</div>

        <div>
          <label className="text-sm font-medium mb-1 block">
            Stimulus Coupling (K_stim): {parameters.K_stim?.toFixed(2)}
          </label>
          <input
            type="range"
            min="0"
            max="5"
            step="0.1"
            value={parameters.K_stim || 1.5}
            onChange={(e) => onParameterChange('K_stim', parseFloat(e.target.value))}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Multiplier for stimulus-driven coupling
          </p>
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block">
            Feature Coupling (K_feat): {parameters.K_feat?.toFixed(2)}
          </label>
          <input
            type="range"
            min="0"
            max="5"
            step="0.1"
            value={parameters.K_feat || 2.0}
            onChange={(e) => onParameterChange('K_feat', parseFloat(e.target.value))}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Multiplier for feature binding coupling
          </p>
        </div>

        <div>
          <label className="text-sm font-medium mb-1 block">
            Spatial Range: {parameters.spatialRange?.toFixed(1)}
          </label>
          <input
            type="range"
            min="2"
            max="10"
            step="0.5"
            value={parameters.spatialRange || 4}
            onChange={(e) => onParameterChange('spatialRange', parseFloat(e.target.value))}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Only used in Spatial mode
          </p>
        </div>
      </div>

      {/* Object Management */}
      <div className="space-y-3">
        <div className="text-sm font-medium">Stimulus Objects</div>

        {!showAddPanel ? (
          <button
            onClick={() => setShowAddPanel(true)}
            className="w-full inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 gap-2"
          >
            <Plus size={16} />
            Add Object
          </button>
        ) : (
          <div className="p-3 rounded border bg-muted/30 space-y-3">
            <div>
              <label className="text-xs font-medium mb-1 block">
                Radius: {newObject.radius.toFixed(1)}
              </label>
              <input
                type="range"
                min="1"
                max="8"
                step="0.5"
                value={newObject.radius}
                onChange={(e) => setNewObject({...newObject, radius: parseFloat(e.target.value)})}
                className="w-full"
              />
            </div>

            <div>
              <label className="text-xs font-medium mb-1 block">
                Intensity: {newObject.intensity.toFixed(2)}
              </label>
              <input
                type="range"
                min="0.1"
                max="2"
                step="0.1"
                value={newObject.intensity}
                onChange={(e) => setNewObject({...newObject, intensity: parseFloat(e.target.value)})}
                className="w-full"
              />
            </div>

            <div>
              <label className="text-xs font-medium mb-1 block">
                Velocity X: {newObject.vx.toFixed(2)}
              </label>
              <input
                type="range"
                min="-3"
                max="3"
                step="0.1"
                value={newObject.vx}
                onChange={(e) => setNewObject({...newObject, vx: parseFloat(e.target.value)})}
                className="w-full"
              />
            </div>

            <div>
              <label className="text-xs font-medium mb-1 block">
                Velocity Y: {newObject.vy.toFixed(2)}
              </label>
              <input
                type="range"
                min="-3"
                max="3"
                step="0.1"
                value={newObject.vy}
                onChange={(e) => setNewObject({...newObject, vy: parseFloat(e.target.value)})}
                className="w-full"
              />
            </div>

            <div>
              <label className="text-xs font-medium mb-1 block">
                Hue: {newObject.hue.toFixed(2)}
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={newObject.hue}
                onChange={(e) => setNewObject({...newObject, hue: parseFloat(e.target.value)})}
                className="w-full"
              />
              <div
                className="mt-1 h-6 rounded"
                style={{
                  backgroundColor: `hsl(${newObject.hue * 360}, 100%, ${newObject.brightness * 50}%)`
                }}
              />
            </div>

            <div>
              <label className="text-xs font-medium mb-1 block">
                Brightness: {newObject.brightness.toFixed(2)}
              </label>
              <input
                type="range"
                min="0.2"
                max="1"
                step="0.05"
                value={newObject.brightness}
                onChange={(e) => setNewObject({...newObject, brightness: parseFloat(e.target.value)})}
                className="w-full"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleAddObject}
                className="flex-1 inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-3"
              >
                Add
              </button>
              <button
                onClick={() => setShowAddPanel(false)}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {totalObjects > 0 && (
          <button
            onClick={onClearObjects}
            className="w-full inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground h-10 px-4 gap-2"
          >
            <Trash2 size={16} />
            Clear All Objects
          </button>
        )}
      </div>

      {/* Info */}
      <div className="mt-6 p-3 rounded bg-muted/30 text-xs text-muted-foreground">
        <p className="mb-2">
          <strong>How it works:</strong>
        </p>
        <ul className="list-disc list-inside space-y-1">
          <li>Kuramoto oscillators on each grid cell</li>
          <li><strong>K:</strong> Base coupling strength (shared with Network mode)</li>
          <li><strong>Network:</strong> Controls which cells can couple</li>
          <li><strong>K_stim:</strong> Stimulus modulates coupling strength</li>
          <li><strong>K_feat:</strong> Similar features strengthen coupling</li>
          <li>Green reticles = tracked objects (&gt;60% attention)</li>
        </ul>
        <p className="mt-2 text-xs">
          Try different networks and base parameters to see how topology affects attention spread and tracking!
        </p>
      </div>
    </div>
  );
}
