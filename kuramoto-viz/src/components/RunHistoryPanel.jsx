import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { History, BarChart3, Table2, Download } from 'lucide-react';
import { loadRuns, clearAllRuns, exportRunsAsJSON, exportRunsAsCSV } from '../utils/runStorage';
import RunsTable from './RunsTable';
import JourneyView from './JourneyView';

/**
 * RunHistoryPanel Component
 * Main interface for viewing and analyzing saved simulation runs
 */
export default function RunHistoryPanel({ isOpen, onClose, runs, onDeleteRun, onClearAll, onLoadRun }) {
  const [activeTab, setActiveTab] = useState('journey');
  const [localRuns, setLocalRuns] = useState(runs);

  // Update local runs when prop changes
  useEffect(() => {
    setLocalRuns(runs);
  }, [runs]);

  const handleRunsChanged = () => {
    const updated = loadRuns();
    setLocalRuns(updated);
    if (onDeleteRun) onDeleteRun(); // Notify parent
  };

  const handleClearAll = () => {
    if (confirm(`Are you sure you want to delete all ${runs.length} runs? This cannot be undone.`)) {
      clearAllRuns();
      handleRunsChanged();
      if (onClearAll) onClearAll();
    }
  };

  if (!isOpen) return null;

  const tabs = [
    { id: 'journey', name: 'Journey View', icon: BarChart3 },
    { id: 'table', name: 'Table View', icon: Table2 },
    { id: 'export', name: 'Export', icon: Download }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={onClose}
          />

          {/* Modal Container */}
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50
                          w-[95vw] sm:w-[90vw] md:w-[85vw] lg:w-[80vw] max-w-6xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="max-h-[90vh] sm:max-h-[85vh]"
            >
              <div className="rounded-lg border bg-card text-card-foreground shadow-lg overflow-hidden">
                {/* Header with Tabs */}
                <div className="border-b px-4 sm:px-6 md:px-8 pt-4 sm:pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <History className="text-primary" size={28} />
                      <div>
                        <h2 className="text-xl sm:text-2xl font-bold">Run History</h2>
                        <p className="text-sm text-muted-foreground">
                          {runs.length} {runs.length === 1 ? 'run' : 'runs'} saved
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={onClose}
                      className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground w-10 h-10 p-0"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Tab Navigation */}
                  <div className="flex gap-1">
                    {tabs.map((tab) => {
                      const Icon = tab.icon;
                      const isActive = activeTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-t-md transition-colors ${
                            isActive
                              ? 'bg-background text-foreground border-t border-x'
                              : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                          }`}
                        >
                          <Icon size={16} />
                          <span className="text-sm font-medium">{tab.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Tab Content */}
                <div className="p-4 sm:p-6 md:p-8 overflow-y-auto max-h-[calc(90vh-160px)] sm:max-h-[calc(85vh-180px)]">
                  {runs.length === 0 ? (
                    <div className="text-center py-12">
                      <History size={64} className="mx-auto text-muted-foreground/30 mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Runs Saved Yet</h3>
                      <p className="text-sm text-muted-foreground mb-6">
                        Click "Save Run" or press 'S' to capture your current simulation state
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Start exploring parameter space and save interesting configurations to build insights!
                      </p>
                    </div>
                  ) : (
                    <>
                      {activeTab === 'journey' && <JourneyView runs={runs} onLoadRun={onLoadRun} />}
                      {activeTab === 'table' && (
                        <div className="space-y-4">
                          <RunsTable runs={runs} onRunsChanged={handleRunsChanged} onLoadRun={onLoadRun} />
                          {runs.length > 0 && (
                            <div className="flex justify-end">
                              <button
                                onClick={handleClearAll}
                                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-destructive text-destructive-foreground hover:bg-destructive/90 h-9 px-4 py-2"
                              >
                                Clear All Runs
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                      {activeTab === 'export' && (
                        <div className="space-y-6">
                          <div>
                            <h3 className="text-lg font-semibold mb-4">Export Run Data</h3>
                            <p className="text-sm text-muted-foreground mb-6">
                              Download your saved runs for external analysis in Python, MATLAB, R, or Excel.
                            </p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <button
                              onClick={() => exportRunsAsJSON(runs)}
                              className="flex flex-col items-start p-6 rounded-lg border bg-card hover:bg-accent transition-colors text-left"
                            >
                              <Download size={24} className="text-primary mb-3" />
                              <h4 className="font-semibold mb-2">JSON Format</h4>
                              <p className="text-xs text-muted-foreground mb-3">
                                Complete run data with all parameters and metrics
                              </p>
                              <span className="text-xs text-primary font-medium">
                                Recommended for Python/JavaScript analysis
                              </span>
                            </button>

                            <button
                              onClick={() => exportRunsAsCSV(runs)}
                              className="flex flex-col items-start p-6 rounded-lg border bg-card hover:bg-accent transition-colors text-left"
                            >
                              <Download size={24} className="text-primary mb-3" />
                              <h4 className="font-semibold mb-2">CSV Format</h4>
                              <p className="text-xs text-muted-foreground mb-3">
                                Tabular data ready for spreadsheet applications
                              </p>
                              <span className="text-xs text-primary font-medium">
                                Recommended for Excel/R analysis
                              </span>
                            </button>
                          </div>

                          <div className="mt-6 p-4 rounded-lg bg-muted">
                            <h4 className="text-sm font-semibold mb-2">What's included:</h4>
                            <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                              <li>All parameter values (N, K, noise, phase lag)</li>
                              <li>Network topology type and statistics</li>
                              <li>Summary metrics (final r, mean r, std r, settling time)</li>
                              <li>Timestamps and run names</li>
                              <li>User notes (if added)</li>
                            </ul>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
