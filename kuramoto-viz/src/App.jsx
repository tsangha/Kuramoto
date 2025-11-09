import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, RotateCcw, Sparkles, Download, ChevronLeft, ChevronRight, Save, History } from 'lucide-react';
import { KuramotoModel } from './core/kuramoto';
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
import InfoPanel from './components/InfoPanel';
import CurrentPresetInfo from './components/CurrentPresetInfo';
import PresetMenu from './components/PresetMenu';
import ExportPanel from './components/ExportPanel';
import RunHistoryPanel from './components/RunHistoryPanel';
import './index.css';

function App() {
  const [parameters, setParameters] = useState({
    N: 50,
    K: 2.0,
    noiseLevel: 0.0,
    phaseLag: 0.0,
    dt: 0.05
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [state, setState] = useState(null);
  const [network, setNetwork] = useState(null);
  const [showPresets, setShowPresets] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showRuns, setShowRuns] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentPreset, setCurrentPreset] = useState(null);
  const [runs, setRuns] = useState([]);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const modelRef = useRef(null);
  const animationRef = useRef(null);

  // Initialize Kuramoto model
  useEffect(() => {
    modelRef.current = new KuramotoModel(parameters);

    const initialNetwork = createAllToAll(parameters.N);
    setNetwork(initialNetwork);
    modelRef.current.setNetwork(initialNetwork.adjacency);

    setState(modelRef.current.getState());

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Load runs from localStorage on mount
  useEffect(() => {
    const savedRuns = loadRuns();
    setRuns(savedRuns);
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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Ignore if typing in input
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
          handleParameterChange('K', Math.min(10, parameters.K + 0.1));
          break;
        case '-':
        case '_':
          handleParameterChange('K', Math.max(0, parameters.K - 0.1));
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isPlaying, parameters.K]);

  // Handle parameter changes
  const handleParameterChange = (param, value) => {
    const newParams = { ...parameters, [param]: value };
    setParameters(newParams);

    if (modelRef.current) {
      modelRef.current.updateParameters({ [param]: value });

      if (param === 'N' && network) {
        handleNetworkChange(network.type, {});
      }

      setState(modelRef.current.getState());
    }
  };

  // Handle network topology changes
  const handleNetworkChange = (type, params) => {
    if (!modelRef.current) return;

    const N = modelRef.current.N;
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
    modelRef.current.setNetwork(newNetwork.adjacency);
    setState(modelRef.current.getState());
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

  // Handle preset selection
  const handlePresetSelect = (presetId) => {
    const preset = getPreset(presetId);
    if (!preset) return;

    // Store current preset info
    setCurrentPreset({ id: presetId, ...preset });

    // Update parameters
    setParameters({ ...parameters, ...preset.parameters });
    if (modelRef.current) {
      modelRef.current.updateParameters(preset.parameters);
    }

    // Update network
    handleNetworkChange(preset.network.type, preset.network.params);
  };

  // Handle save current run
  const handleSaveRun = () => {
    if (!modelRef.current || !network) return;

    // Calculate metrics from current history
    const history = modelRef.current.history;
    const metrics = calculateRunMetrics(history);

    // Calculate network statistics
    const networkStats = calculateNetworkStats(network.adjacency, parameters.N);

    // Create run object
    const run = {
      id: generateRunId(),
      timestamp: new Date().toISOString(),
      name: currentPreset ? currentPreset.name : `Run ${runs.length + 1}`,
      parameters: { ...parameters },
      network: {
        type: network.type,
        params: network.params || {},
        avgDegree: networkStats.avgDegree,
        maxDegree: networkStats.maxDegree,
        minDegree: networkStats.minDegree
      },
      metrics,
      notes: currentPreset ? currentPreset.description : ''
    };

    // Add to runs and save
    const success = addRun(run);
    if (success) {
      setRuns(loadRuns()); // Reload from storage
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000); // Show success for 2s
    }
  };

  // Prepare network data
  const networkNodes = network ? Array.from({ length: parameters.N }, (_, i) => ({ id: i })) : [];
  const networkEdges = network ? network.edges : [];

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
                Kuramoto Model
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                Interactive synchronization dynamics
              </p>
            </div>

            {/* Header Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleSaveRun}
                className={`inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 gap-2 ${
                  saveSuccess ? 'bg-green-500 text-white border-green-600' : 'bg-background'
                }`}
                title="Save Current Run (S)"
              >
                <Save size={18} />
                <span>{saveSuccess ? 'Saved!' : 'Save Run'}</span>
              </button>

              <button
                onClick={() => setShowRuns(true)}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 gap-2"
                title="Run History (H)"
              >
                <History size={18} />
                <span>Runs</span>
                {runs.length > 0 && (
                  <span className="ml-1 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-xs">
                    {runs.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setShowPresets(true)}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 gap-2"
                title="Presets (P)"
              >
                <Sparkles size={18} />
                <span>Presets</span>
              </button>

              <button
                onClick={() => setShowExport(true)}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 gap-2"
                title="Export (E)"
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
                  <ControlPanel
                    parameters={parameters}
                    onParameterChange={handleParameterChange}
                    onNetworkChange={handleNetworkChange}
                    onPlayPause={handlePlayPause}
                    onReset={handleReset}
                    isPlaying={isPlaying}
                  />
                </motion.div>

                {/* Current Preset Info */}
                {currentPreset && (
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

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <InfoPanel />
                </motion.div>
              </div>
            )}

            {/* Collapse/Expand Button */}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="absolute -right-3 top-1/2 transform -translate-y-1/2 inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground w-10 h-10 p-0 z-10"
              title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {sidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
            </button>
          </motion.div>

          {/* Visualizations Grid */}
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
                  N={parameters.N}
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

            {/* Order Parameter Time Series */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="rounded-lg border bg-card text-card-foreground shadow-sm p-4 flex flex-col col-span-2"
            >
              <h3 className="text-lg font-semibold mb-3">Synchronization Over Time</h3>
              <div className="flex-1">
                <TimeSeries
                  history={modelRef.current?.history || { time: [], orderParameter: [], phases: [] }}
                  updateTrigger={state?.time}
                  title="Order Parameter r(t)"
                  yLabel="r"
                />
              </div>
            </motion.div>
          </motion.div>
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
            className="inline-flex items-center justify-center rounded-full text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 w-16 h-16 shadow-lg hover:shadow-xl"
            title={`${isPlaying ? 'Pause' : 'Play'} (Space)`}
          >
            {isPlaying ? <Pause size={24} /> : <Play size={24} className="ml-1" />}
          </button>

          <button
            onClick={handleReset}
            className="inline-flex items-center justify-center rounded-full text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground w-14 h-14"
            title="Reset (R)"
          >
            <RotateCcw size={20} />
          </button>
        </motion.div>
      </div>

      {/* Modals */}
      <PresetMenu
        isOpen={showPresets}
        onClose={() => setShowPresets(false)}
        onSelectPreset={handlePresetSelect}
      />

      <ExportPanel
        isOpen={showExport}
        onClose={() => setShowExport(false)}
        history={modelRef.current?.history || { time: [], orderParameter: [], phases: [] }}
        parameters={parameters}
        network={network}
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
      />
    </div>
  );
}

export default App;
