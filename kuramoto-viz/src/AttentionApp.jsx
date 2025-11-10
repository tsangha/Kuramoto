import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, RotateCcw, Eye, Layers, Sparkles } from 'lucide-react';
import { AttentionFieldModel } from './core/attentionField';
import AttentionField3D from './components/AttentionField3D';
import AttentionHeatMap from './components/AttentionHeatMap';
import AttentionControlPanel from './components/AttentionControlPanel';
import './index.css';

function AttentionApp() {
  const [parameters, setParameters] = useState({
    gridSize: 32,
    K_stim: 1.5,
    K_feat: 2.0,
    noiseLevel: 0.1,
    spatialRange: 4,
    dt: 0.05
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [state, setState] = useState(null);
  const [viewMode, setViewMode] = useState('3d'); // '3d', 'heatmap', 'phase'
  const [showPhase, setShowPhase] = useState(false);

  const modelRef = useRef(null);
  const animationRef = useRef(null);

  // Initialize model
  useEffect(() => {
    modelRef.current = new AttentionFieldModel(parameters);

    // Add a few initial objects for demo
    modelRef.current.addStimulusObject({
      x: 8,
      y: 16,
      vx: 1.2,
      vy: 0.8,
      radius: 3,
      intensity: 1.0,
      features: [1.0, 0.2, 0.2] // Red
    });

    modelRef.current.addStimulusObject({
      x: 24,
      y: 16,
      vx: -0.8,
      vy: 1.0,
      radius: 3,
      intensity: 1.0,
      features: [0.2, 0.2, 1.0] // Blue
    });

    setState(modelRef.current.getState());

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Animation loop
  useEffect(() => {
    if (!isPlaying || !modelRef.current) return;

    const animate = () => {
      modelRef.current.step();
      setState(modelRef.current.getState());
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying]);

  // Handle parameter changes
  const handleParameterChange = (param, value) => {
    const newParams = { ...parameters, [param]: value };
    setParameters(newParams);

    if (modelRef.current) {
      modelRef.current.updateParameters({ [param]: value });
      setState(modelRef.current.getState());
    }
  };

  // Handle play/pause
  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  // Handle reset
  const handleReset = () => {
    if (modelRef.current) {
      modelRef.current.initialize();
      setState(modelRef.current.getState());
    }
  };

  // Add object
  const handleAddObject = (objParams) => {
    if (modelRef.current) {
      modelRef.current.addStimulusObject(objParams);
      setState(modelRef.current.getState());
    }
  };

  // Clear all objects
  const handleClearObjects = () => {
    if (modelRef.current) {
      modelRef.current.stimulusObjects = [];
      setState(modelRef.current.getState());
    }
  };

  return (
    <div className="w-full h-screen bg-background text-foreground overflow-hidden">
      <div className="h-full flex flex-col">
        {/* Header */}
        <motion.header
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          transition={{ type: 'spring', damping: 20 }}
          className="border-b bg-card/50 backdrop-blur-sm px-8 py-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Kuramoto Attention Field
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                Neural synchronization for dynamic object tracking
              </p>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('3d')}
                className={`inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring h-10 px-4 gap-2 ${
                  viewMode === '3d'
                    ? 'bg-primary text-primary-foreground'
                    : 'border border-input bg-background hover:bg-accent'
                }`}
              >
                <Layers size={18} />
                3D View
              </button>
              <button
                onClick={() => setViewMode('heatmap')}
                className={`inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring h-10 px-4 gap-2 ${
                  viewMode === 'heatmap'
                    ? 'bg-primary text-primary-foreground'
                    : 'border border-input bg-background hover:bg-accent'
                }`}
              >
                <Eye size={18} />
                Heat Map
              </button>
              <button
                onClick={() => {
                  setShowPhase(!showPhase);
                }}
                className={`inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring h-10 px-4 gap-2 ${
                  showPhase
                    ? 'bg-primary text-primary-foreground'
                    : 'border border-input bg-background hover:bg-accent'
                }`}
              >
                <Sparkles size={18} />
                Phase
              </button>
            </div>
          </div>
        </motion.header>

        {/* Main Content */}
        <div className="flex-1 flex gap-6 p-6 overflow-hidden">
          {/* Sidebar */}
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ type: 'spring', damping: 25 }}
            className="w-96 flex-shrink-0"
          >
            <AttentionControlPanel
              parameters={parameters}
              onParameterChange={handleParameterChange}
              onAddObject={handleAddObject}
              onClearObjects={handleClearObjects}
              onPlayPause={handlePlayPause}
              onReset={handleReset}
              isPlaying={isPlaying}
              state={state}
            />
          </motion.div>

          {/* Visualization Area */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="flex-1 rounded-lg border bg-card text-card-foreground shadow-sm p-4 flex flex-col"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">
                {viewMode === '3d' && 'Attention Field - 3D View'}
                {viewMode === 'heatmap' && 'Attention Field - Heat Map'}
              </h3>
              <div className="text-sm text-muted-foreground">
                Time: {state?.time?.toFixed(2) || '0.00'}s
              </div>
            </div>

            <div className="flex-1 relative">
              {viewMode === '3d' && (
                <AttentionField3D state={state} showPhase={showPhase} />
              )}

              {viewMode === 'heatmap' && (
                <AttentionHeatMap state={state} showStimulus={true} showPhase={showPhase} />
              )}
            </div>

            {/* Legend */}
            <div className="mt-3 pt-3 border-t">
              <div className="grid grid-cols-3 gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ background: 'linear-gradient(to right, #FFE0E9, #2D9B87)' }} />
                  <span className="text-muted-foreground">Attention (low → high)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: '#FFF5F7' }} />
                  <span className="text-muted-foreground">No attention</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded border-2 border-green-500" />
                  <span className="text-muted-foreground">Tracked object</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Floating Action Buttons */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.4, type: 'spring' }}
          className="fixed bottom-8 right-8 flex flex-col gap-3"
        >
          <button
            onClick={handlePlayPause}
            className="inline-flex items-center justify-center rounded-full text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring bg-primary text-primary-foreground hover:bg-primary/90 w-16 h-16 shadow-lg hover:shadow-xl"
          >
            {isPlaying ? <Pause size={24} /> : <Play size={24} className="ml-1" />}
          </button>

          <button
            onClick={handleReset}
            className="inline-flex items-center justify-center rounded-full text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring border border-input bg-background hover:bg-accent w-14 h-14"
          >
            <RotateCcw size={20} />
          </button>
        </motion.div>
      </div>
    </div>
  );
}

export default AttentionApp;
