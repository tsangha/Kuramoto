import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, RotateCcw, Sparkles, Download, ChevronLeft, ChevronRight, Save, History, Network, Brain, Eye, Layers } from 'lucide-react';
import { KuramotoModel } from './core/kuramoto';
import { AttentionFieldModel } from './core/attentionField';
import {
  createAllToAll,
  createRandom,
  createSmallWorld,
  createScaleFree,
  createRing
} from './core/networks';
import { getPreset } from './utils/presets';
import { calculateRunMetrics, calculateNetworkStats } from './utils/runMetrics';
import { loadRuns, addRun, generateRunId } from './utils/runStorage';
import PhaseCircle from './components/PhaseCircle';
import NetworkGraph from './components/NetworkGraph';
import TimeSeries from './components/TimeSeries';
import ControlPanel from './components/ControlPanel';
import AttentionControlPanel from './components/AttentionControlPanel';
import AttentionField3D from './components/AttentionField3D';
import AttentionHeatMap from './components/AttentionHeatMap';
import InfoPanel from './components/InfoPanel';
import CurrentPresetInfo from './components/CurrentPresetInfo';
import PresetMenu from './components/PresetMenu';
import ExportPanel from './components/ExportPanel';
import RunHistoryPanel from './components/RunHistoryPanel';
import './index.css';

function UnifiedApp() {
  const [mode, setMode] = useState('attention'); // 'kuramoto' or 'attention'
  const [visualMode, setVisualMode] = useState('3d'); // For attention: '3d', 'heatmap'
  const [showPhase, setShowPhase] = useState(false);

  // Common state
  const [isPlaying, setIsPlaying] = useState(false);
  const [state, setState] = useState(null);
  const [showPresets, setShowPresets] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showRuns, setShowRuns] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentPreset, setCurrentPreset] = useState(null);
  const [runs, setRuns] = useState([]);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Shared base Kuramoto parameters (used by both modes)
  const [baseParams, setBaseParams] = useState({
    K: 2.0,
    noiseLevel: 0.0,
    phaseLag: 0.0,
    dt: 0.05
  });

  // Kuramoto-specific state
  const [kuramotoParams, setKuramotoParams] = useState({
    N: 50
  });
  const [network, setNetwork] = useState(null);

  // Attention-specific state
  const [attentionParams, setAttentionParams] = useState({
    gridSize: 32,
    K_stim: 1.5,
    K_feat: 2.0,
    spatialRange: 4
  });

  const kuramotoModelRef = useRef(null);
  const attentionModelRef = useRef(null);
  const animationRef = useRef(null);

  // Get active model and parameters (merge base params with mode-specific)
  const activeModel = mode === 'kuramoto' ? kuramotoModelRef : attentionModelRef;
  const kuramotoFullParams = { ...baseParams, ...kuramotoParams };
  const attentionFullParams = { ...baseParams, ...attentionParams };
  const parameters = mode === 'kuramoto' ? kuramotoFullParams : attentionFullParams;

  // Initialize models
  useEffect(() => {
    // Initialize Kuramoto model with merged params
    kuramotoModelRef.current = new KuramotoModel(kuramotoFullParams);
    const initialNetwork = createAllToAll(kuramotoParams.N);
    setNetwork(initialNetwork);
    kuramotoModelRef.current.setNetwork(initialNetwork.adjacency);

    // Initialize Attention model with merged params
    attentionModelRef.current = new AttentionFieldModel(attentionFullParams);

    // Add initial demo objects for attention field
    attentionModelRef.current.addStimulusObject({
      x: 8, y: 16, vx: 1.2, vy: 0.8,
      radius: 3, intensity: 1.0,
      features: [1.0, 0.2, 0.2] // Red
    });
    attentionModelRef.current.addStimulusObject({
      x: 24, y: 16, vx: -0.8, vy: 1.0,
      radius: 3, intensity: 1.0,
      features: [0.2, 0.2, 1.0] // Blue
    });

    // Set initial state based on mode
    setState(activeModel.current.getState());

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Update state when mode changes
  useEffect(() => {
    if (activeModel.current) {
      setState(activeModel.current.getState());
    }
  }, [mode]);

  // Load runs from localStorage on mount
  useEffect(() => {
    const savedRuns = loadRuns();
    setRuns(savedRuns);
  }, []);

  // Animation loop
  useEffect(() => {
    if (!isPlaying || !activeModel.current) return;

    const animate = () => {
      activeModel.current.step();
      setState(activeModel.current.getState());
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, mode]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;

      switch (e.key) {
        case ' ':
          e.preventDefault();
          handlePlayPause();
          break;
        case 'r':
        case 'R':
          handleReset();
          break;
        case 'p':
        case 'P':
          setShowPresets(true);
          break;
        case 'e':
        case 'E':
          setShowExport(true);
          break;
        case 's':
        case 'S':
          handleSaveRun();
          break;
        case 'h':
        case 'H':
          setShowRuns(true);
          break;
        case 'Escape':
          setShowPresets(false);
          setShowExport(false);
          setShowRuns(false);
          break;
        case '+':
        case '=':
          if (mode === 'kuramoto') {
            handleParameterChange('K', Math.min(10, baseParams.K + 0.1));
          }
          break;
        case '-':
        case '_':
          if (mode === 'kuramoto') {
            handleParameterChange('K', Math.max(0, baseParams.K - 0.1));
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isPlaying, mode, baseParams.K]);

  // Handle parameter changes
  const handleParameterChange = (param, value) => {
    // Check if it's a shared base parameter
    const isBaseParam = ['K', 'noiseLevel', 'phaseLag', 'dt'].includes(param);

    if (isBaseParam) {
      // Update base params (affects both modes)
      const newBaseParams = { ...baseParams, [param]: value };
      setBaseParams(newBaseParams);

      // Update both models if they exist
      if (kuramotoModelRef.current) {
        kuramotoModelRef.current.updateParameters({ [param]: value });
      }
      if (attentionModelRef.current) {
        attentionModelRef.current.updateParameters({ [param]: value });
      }

      // Force state update for current model
      if (activeModel.current) {
        // Request animation frame to ensure model has updated
        requestAnimationFrame(() => {
          setState(activeModel.current.getState());
        });
      }
    } else {
      // Mode-specific parameter
      if (mode === 'kuramoto') {
        setKuramotoParams(prev => ({ ...prev, [param]: value }));
      } else {
        setAttentionParams(prev => ({ ...prev, [param]: value }));
      }

      if (activeModel.current) {
        activeModel.current.updateParameters({ [param]: value });

        // Special handling for Kuramoto network changes
        if (mode === 'kuramoto' && param === 'N' && network) {
          handleNetworkChange(network.type, {});
        }

        setState(activeModel.current.getState());
      }
    }
  };

  // Handle network topology changes (both modes)
  const handleNetworkChange = (type, params) => {
    if (mode === 'kuramoto') {
      if (!kuramotoModelRef.current) return;

      const N = kuramotoModelRef.current.N;
      let newNetwork;

      switch (type) {
        case 'all-to-all':
          newNetwork = createAllToAll(N);
          break;
        case 'random':
          newNetwork = createRandom(N, params.probability || 0.1);
          break;
        case 'small-world':
          newNetwork = createSmallWorld(N, params.k || 4, params.rewiringProb || 0.1);
          break;
        case 'scale-free':
          newNetwork = createScaleFree(N, params.m || 2);
          break;
        case 'ring':
          newNetwork = createRing(N, params.k || 2);
          break;
        default:
          newNetwork = createAllToAll(N);
      }

      setNetwork(newNetwork);
      kuramotoModelRef.current.setNetwork(newNetwork.adjacency);
      setState(kuramotoModelRef.current.getState());
    } else if (mode === 'attention') {
      if (!attentionModelRef.current) return;

      const N = attentionModelRef.current.N;
      let newNetwork;

      if (type === 'spatial') {
        // Use built-in spatial coupling
        attentionModelRef.current.setNetwork(null, 'spatial', {});
        setNetwork({ type: 'spatial', params: {}, edges: [], adjacency: null });
      } else {
        // Generate network topology for grid cells
        switch (type) {
          case 'all-to-all':
            newNetwork = createAllToAll(N);
            break;
          case 'random':
            newNetwork = createRandom(N, params.probability || 0.05); // Lower default for large grid
            break;
          case 'small-world':
            newNetwork = createSmallWorld(N, params.k || 4, params.rewiringProb || 0.1);
            break;
          case 'scale-free':
            newNetwork = createScaleFree(N, params.m || 2);
            break;
          case 'ring':
            newNetwork = createRing(N, params.k || 2);
            break;
          default:
            newNetwork = createAllToAll(N);
        }

        setNetwork(newNetwork);
        attentionModelRef.current.setNetwork(newNetwork.adjacency, type, params);
      }

      setState(attentionModelRef.current.getState());
    }
  };

  // Attention field specific handlers
  const handleAddObject = (objParams) => {
    if (attentionModelRef.current) {
      attentionModelRef.current.addStimulusObject(objParams);
      if (mode === 'attention') {
        setState(attentionModelRef.current.getState());
      }
    }
  };

  const handleClearObjects = () => {
    if (attentionModelRef.current) {
      attentionModelRef.current.stimulusObjects = [];
      if (mode === 'attention') {
        setState(attentionModelRef.current.getState());
      }
    }
  };

  // Handle play/pause
  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  // Handle reset
  const handleReset = () => {
    if (activeModel.current) {
      activeModel.current.initialize();

      // Re-add demo objects for attention field
      if (mode === 'attention') {
        attentionModelRef.current.addStimulusObject({
          x: 8, y: 16, vx: 1.2, vy: 0.8,
          radius: 3, intensity: 1.0,
          features: [1.0, 0.2, 0.2]
        });
        attentionModelRef.current.addStimulusObject({
          x: 24, y: 16, vx: -0.8, vy: 1.0,
          radius: 3, intensity: 1.0,
          features: [0.2, 0.2, 1.0]
        });
      }

      setState(activeModel.current.getState());
    }
  };

  // Handle preset selection
  const handlePresetSelect = (presetId) => {
    const preset = getPreset(presetId);
    if (!preset || mode !== 'kuramoto') return;

    setCurrentPreset({ id: presetId, ...preset });

    // Separate base params from mode-specific params
    const { K, noiseLevel, phaseLag, dt, N } = preset.parameters;

    // Update base params
    if (K !== undefined || noiseLevel !== undefined || phaseLag !== undefined || dt !== undefined) {
      const newBaseParams = { ...baseParams };
      if (K !== undefined) newBaseParams.K = K;
      if (noiseLevel !== undefined) newBaseParams.noiseLevel = noiseLevel;
      if (phaseLag !== undefined) newBaseParams.phaseLag = phaseLag;
      if (dt !== undefined) newBaseParams.dt = dt;
      setBaseParams(newBaseParams);
    }

    // Update kuramoto-specific params
    if (N !== undefined) {
      setKuramotoParams({ ...kuramotoParams, N });
    }

    if (kuramotoModelRef.current) {
      kuramotoModelRef.current.updateParameters(preset.parameters);
    }

    // Also update attention model with base params
    if (attentionModelRef.current && (K !== undefined || noiseLevel !== undefined || phaseLag !== undefined || dt !== undefined)) {
      const baseOnlyParams = {};
      if (K !== undefined) baseOnlyParams.K = K;
      if (noiseLevel !== undefined) baseOnlyParams.noiseLevel = noiseLevel;
      if (phaseLag !== undefined) baseOnlyParams.phaseLag = phaseLag;
      if (dt !== undefined) baseOnlyParams.dt = dt;
      attentionModelRef.current.updateParameters(baseOnlyParams);
    }

    handleNetworkChange(preset.network.type, preset.network.params);
  };

  // Handle save current run
  const handleSaveRun = () => {
    if (!activeModel.current) return;

    const history = activeModel.current.history;
    const metrics = calculateRunMetrics(history);

    // Save parameters (merged for compatibility)
    const savedParams = { ...baseParams };
    if (mode === 'kuramoto') {
      Object.assign(savedParams, kuramotoParams);
    } else {
      Object.assign(savedParams, attentionParams);
    }

    let run = {
      id: generateRunId(),
      timestamp: new Date().toISOString(),
      name: currentPreset ? currentPreset.name : `${mode === 'kuramoto' ? 'Kuramoto' : 'Attention'} Run ${runs.length + 1}`,
      mode: mode, // Store the mode
      parameters: savedParams,
      metrics,
      notes: currentPreset ? currentPreset.description : ''
    };

    if (mode === 'kuramoto' && network) {
      const networkStats = calculateNetworkStats(network.adjacency, kuramotoParams.N);
      run.network = {
        type: network.type,
        params: network.params || {},
        avgDegree: networkStats.avgDegree,
        maxDegree: networkStats.maxDegree,
        minDegree: networkStats.minDegree
      };
    } else if (mode === 'attention') {
      // Save stimulus objects configuration and network topology
      run.stimulusObjects = attentionModelRef.current.stimulusObjects.map(obj => ({...obj}));
      run.network = {
        type: attentionModelRef.current.networkType || 'spatial',
        params: attentionModelRef.current.networkParams || {}
      };
    }

    const success = addRun(run);
    if (success) {
      setRuns(loadRuns());
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    }
  };

  // Handle load run
  const handleLoadRun = (run) => {
    // Switch to the correct mode
    setMode(run.mode || 'kuramoto');

    // Stop playing
    setIsPlaying(false);

    // Extract base params from loaded parameters
    const { K, noiseLevel, phaseLag, dt } = run.parameters;
    const newBaseParams = { ...baseParams };
    if (K !== undefined) newBaseParams.K = K;
    if (noiseLevel !== undefined) newBaseParams.noiseLevel = noiseLevel;
    if (phaseLag !== undefined) newBaseParams.phaseLag = phaseLag;
    if (dt !== undefined) newBaseParams.dt = dt;
    setBaseParams(newBaseParams);

    if (run.mode === 'attention' || (!run.mode && run.stimulusObjects)) {
      // Restore attention field
      const { gridSize, K_stim, K_feat, spatialRange } = run.parameters;
      setAttentionParams({ gridSize, K_stim, K_feat, spatialRange });

      // Merge base params with attention params for model update
      attentionModelRef.current.updateParameters({ ...newBaseParams, gridSize, K_stim, K_feat, spatialRange });

      // Clear and restore stimulus objects
      attentionModelRef.current.stimulusObjects = [];
      if (run.stimulusObjects) {
        run.stimulusObjects.forEach(obj => {
          attentionModelRef.current.addStimulusObject(obj);
        });
      }

      // Restore network topology
      if (run.network) {
        handleNetworkChange(run.network.type, run.network.params);
      }

      attentionModelRef.current.initialize();
      setState(attentionModelRef.current.getState());
    } else {
      // Restore Kuramoto
      const { N } = run.parameters;
      setKuramotoParams({ N });

      // Merge base params with kuramoto params for model update
      kuramotoModelRef.current.updateParameters({ ...newBaseParams, N });

      if (run.network) {
        handleNetworkChange(run.network.type, run.network.params);
      }

      kuramotoModelRef.current.initialize();
      setState(kuramotoModelRef.current.getState());
    }

    setShowRuns(false);
  };

  // Prepare network data for Kuramoto mode
  const networkNodes = network && mode === 'kuramoto'
    ? Array.from({ length: kuramotoParams.N }, (_, i) => ({ id: i }))
    : [];
  const networkEdges = network && mode === 'kuramoto' ? network.edges : [];

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
                {mode === 'kuramoto' ? 'Kuramoto Model' : 'Kuramoto Attention Field'}
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                {mode === 'kuramoto'
                  ? 'Interactive synchronization dynamics'
                  : 'Neural synchronization for dynamic object tracking'}
              </p>
            </div>

            {/* Mode Toggle + View Controls */}
            <div className="flex items-center gap-3">
              {/* Mode Selector */}
              <div className="flex gap-1 bg-muted/30 rounded-lg p-1">
                <button
                  onClick={() => setMode('kuramoto')}
                  className={`inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors h-9 px-4 gap-2 ${
                    mode === 'kuramoto'
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-accent'
                  }`}
                >
                  <Network size={16} />
                  Network
                </button>
                <button
                  onClick={() => setMode('attention')}
                  className={`inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors h-9 px-4 gap-2 ${
                    mode === 'attention'
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-accent'
                  }`}
                >
                  <Brain size={16} />
                  Attention
                </button>
              </div>

              {/* Attention View Controls */}
              {mode === 'attention' && (
                <>
                  <div className="h-8 w-px bg-border" />
                  <button
                    onClick={() => setVisualMode(visualMode === '3d' ? 'heatmap' : '3d')}
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-input bg-background hover:bg-accent h-9 px-3 gap-2"
                  >
                    {visualMode === '3d' ? <Layers size={16} /> : <Eye size={16} />}
                    {visualMode === '3d' ? '3D' : 'Heat'}
                  </button>
                  <button
                    onClick={() => setShowPhase(!showPhase)}
                    className={`inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-3 gap-2 ${
                      showPhase
                        ? 'bg-primary text-primary-foreground'
                        : 'border border-input bg-background hover:bg-accent'
                    }`}
                  >
                    <Sparkles size={16} />
                    Phase
                  </button>
                </>
              )}

              <div className="h-8 w-px bg-border" />

              {/* Action Buttons */}
              <button
                onClick={handleSaveRun}
                className={`inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-all h-10 px-4 gap-2 ${
                  saveSuccess ? 'bg-green-500 text-white border border-green-600' : 'border border-input bg-background hover:bg-accent'
                }`}
              >
                <Save size={18} />
                <span>{saveSuccess ? 'Saved!' : 'Save'}</span>
              </button>

              <button
                onClick={() => setShowRuns(true)}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-input bg-background hover:bg-accent h-10 px-4 gap-2"
              >
                <History size={18} />
                <span>Runs</span>
                {runs.length > 0 && (
                  <span className="ml-1 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-xs">
                    {runs.length}
                  </span>
                )}
              </button>

              {mode === 'kuramoto' && (
                <button
                  onClick={() => setShowPresets(true)}
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 gap-2"
                >
                  <Sparkles size={18} />
                  <span>Presets</span>
                </button>
              )}

              <button
                onClick={() => setShowExport(true)}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium border border-input bg-background hover:bg-accent h-10 px-4 gap-2"
              >
                <Download size={18} />
                <span>Export</span>
              </button>
            </div>
          </div>
        </motion.header>

        {/* Main Content */}
        <div className="flex-1 flex gap-6 p-6 overflow-hidden">
          {/* Collapsible Sidebar */}
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            animate={{
              width: sidebarCollapsed ? 60 : 360,
              x: 0,
              opacity: 1
            }}
            transition={{ type: 'spring', damping: 25 }}
            className="flex-shrink-0 relative"
          >
            {!sidebarCollapsed && (
              <div className="h-full flex flex-col gap-4 overflow-y-auto pr-2">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  {mode === 'kuramoto' ? (
                    <ControlPanel
                      parameters={kuramotoFullParams}
                      onParameterChange={handleParameterChange}
                      onNetworkChange={handleNetworkChange}
                      onPlayPause={handlePlayPause}
                      onReset={handleReset}
                      isPlaying={isPlaying}
                    />
                  ) : (
                    <AttentionControlPanel
                      parameters={attentionFullParams}
                      onParameterChange={handleParameterChange}
                      onNetworkChange={handleNetworkChange}
                      onAddObject={handleAddObject}
                      onClearObjects={handleClearObjects}
                      onPlayPause={handlePlayPause}
                      onReset={handleReset}
                      isPlaying={isPlaying}
                      state={state}
                    />
                  )}
                </motion.div>

                {/* Current Preset Info */}
                {currentPreset && mode === 'kuramoto' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                  >
                    <CurrentPresetInfo
                      preset={currentPreset}
                      onClear={() => setCurrentPreset(null)}
                    />
                  </motion.div>
                )}

                {mode === 'kuramoto' && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <InfoPanel />
                  </motion.div>
                )}
              </div>
            )}

            {/* Collapse/Expand Button */}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="absolute -right-3 top-1/2 transform -translate-y-1/2 inline-flex items-center justify-center rounded-md text-sm font-medium border border-input bg-background hover:bg-accent w-10 h-10 p-0 z-10"
            >
              {sidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            </button>
          </motion.div>

          {/* Visualizations */}
          {mode === 'kuramoto' ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="flex-1 grid grid-cols-2 grid-rows-2 gap-6 overflow-hidden"
            >
              {/* Phase Circle */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="rounded-lg border bg-card text-card-foreground shadow-sm p-4 flex flex-col"
              >
                <h3 className="text-lg font-semibold mb-3">Phase Circle</h3>
                <div className="flex-1">
                  <PhaseCircle
                    theta={state?.theta || []}
                    N={kuramotoParams.N}
                    orderParameter={state?.orderParameter || 0}
                  />
                </div>
              </motion.div>

              {/* Network Graph */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="rounded-lg border bg-card text-card-foreground shadow-sm p-4 flex flex-col"
              >
                <h3 className="text-lg font-semibold mb-3">Network Topology</h3>
                <div className="flex-1">
                  <NetworkGraph
                    nodes={networkNodes}
                    edges={networkEdges}
                    theta={state?.theta || []}
                  />
                </div>
              </motion.div>

              {/* Time Series */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="rounded-lg border bg-card text-card-foreground shadow-sm p-4 flex flex-col col-span-2"
              >
                <h3 className="text-lg font-semibold mb-3">Synchronization Over Time</h3>
                <div className="flex-1">
                  <TimeSeries
                    history={kuramotoModelRef.current?.history || { time: [], orderParameter: [], phases: [] }}
                    updateTrigger={state?.time}
                    title="Order Parameter r(t)"
                    yLabel="r"
                  />
                </div>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="flex-1 rounded-lg border bg-card text-card-foreground shadow-sm p-4 flex flex-col"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold">
                  Attention Field - {visualMode === '3d' ? '3D View' : 'Heat Map'}
                </h3>
                <div className="text-sm text-muted-foreground">
                  Time: {state?.time?.toFixed(2) || '0.00'}s
                </div>
              </div>

              <div className="flex-1 relative">
                {visualMode === '3d' && (
                  <AttentionField3D state={state} showPhase={showPhase} />
                )}
                {visualMode === 'heatmap' && (
                  <AttentionHeatMap state={state} showStimulus={true} showPhase={showPhase} />
                )}
              </div>

              {/* Legend */}
              <div className="mt-3 pt-3 border-t">
                <div className="grid grid-cols-3 gap-4 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded" style={{ background: 'linear-gradient(to right, #000, #ff0)' }} />
                    <span className="text-muted-foreground">Attention (low → high)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-blue-500" />
                    <span className="text-muted-foreground">Stimulus intensity</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded border-2 border-green-500" />
                    <span className="text-muted-foreground">Tracked object</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Floating Action Buttons */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.7, type: 'spring' }}
          className="fixed bottom-8 right-8 flex flex-col gap-3"
        >
          <button
            onClick={handlePlayPause}
            className="inline-flex items-center justify-center rounded-full text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 w-16 h-16 shadow-lg hover:shadow-xl"
          >
            {isPlaying ? <Pause size={24} /> : <Play size={24} className="ml-1" />}
          </button>

          <button
            onClick={handleReset}
            className="inline-flex items-center justify-center rounded-full text-sm font-medium border border-input bg-background hover:bg-accent w-14 h-14"
          >
            <RotateCcw size={20} />
          </button>
        </motion.div>
      </div>

      {/* Modals */}
      {mode === 'kuramoto' && (
        <PresetMenu
          isOpen={showPresets}
          onClose={() => setShowPresets(false)}
          onSelectPreset={handlePresetSelect}
        />
      )}

      <ExportPanel
        isOpen={showExport}
        onClose={() => setShowExport(false)}
        history={activeModel.current?.history || { time: [], orderParameter: [], phases: [] }}
        parameters={parameters}
        network={mode === 'kuramoto' ? network : null}
      />

      <RunHistoryPanel
        isOpen={showRuns}
        onClose={() => setShowRuns(false)}
        runs={runs}
        onDeleteRun={(id) => {
          const filtered = runs.filter(r => r.id !== id);
          setRuns(filtered);
        }}
        onClearAll={() => setRuns([])}
        onLoadRun={handleLoadRun}
      />
    </div>
  );
}

export default UnifiedApp;
