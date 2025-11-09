/**
 * Run Storage Utility
 * Handles localStorage persistence for saved simulation runs
 */

const STORAGE_KEY = 'kuramoto-runs';
const MAX_RUNS = 200; // Prevent localStorage bloat

/**
 * Generate unique ID for a run
 */
export function generateRunId() {
  return `run_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Load all runs from localStorage
 */
export function loadRuns() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];

    const runs = JSON.parse(data);
    return Array.isArray(runs) ? runs : [];
  } catch (error) {
    console.error('Error loading runs from localStorage:', error);
    return [];
  }
}

/**
 * Save all runs to localStorage
 */
export function saveRuns(runs) {
  try {
    // Limit number of runs
    const limited = runs.slice(-MAX_RUNS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(limited));
    return true;
  } catch (error) {
    console.error('Error saving runs to localStorage:', error);

    // Handle quota exceeded error
    if (error.name === 'QuotaExceededError') {
      console.warn('localStorage quota exceeded. Removing oldest runs...');
      const reduced = runs.slice(-Math.floor(MAX_RUNS / 2));
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(reduced));
        return true;
      } catch (retryError) {
        console.error('Failed to save even reduced runs:', retryError);
        return false;
      }
    }
    return false;
  }
}

/**
 * Add a new run
 */
export function addRun(run) {
  const runs = loadRuns();
  runs.push(run);
  return saveRuns(runs);
}

/**
 * Update an existing run
 */
export function updateRun(id, updates) {
  const runs = loadRuns();
  const index = runs.findIndex(r => r.id === id);

  if (index === -1) return false;

  runs[index] = { ...runs[index], ...updates };
  return saveRuns(runs);
}

/**
 * Delete a run
 */
export function deleteRun(id) {
  const runs = loadRuns();
  const filtered = runs.filter(r => r.id !== id);
  return saveRuns(filtered);
}

/**
 * Delete all runs
 */
export function clearAllRuns() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Error clearing runs:', error);
    return false;
  }
}

/**
 * Get a single run by ID
 */
export function getRun(id) {
  const runs = loadRuns();
  return runs.find(r => r.id === id);
}

/**
 * Export runs as JSON
 */
export function exportRunsAsJSON(runs) {
  const dataStr = JSON.stringify(runs, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `kuramoto-runs-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export runs as CSV
 */
export function exportRunsAsCSV(runs) {
  // CSV header
  const headers = [
    'ID', 'Name', 'Timestamp',
    'N', 'K', 'Noise', 'Phase Lag', 'dt',
    'Network Type', 'Avg Degree',
    'Final r', 'Mean r', 'Std r', 'Settling Time', 'Converged',
    'Notes'
  ];

  // CSV rows
  const rows = runs.map(run => [
    run.id,
    run.name || '',
    run.timestamp,
    run.parameters.N,
    run.parameters.K,
    run.parameters.noiseLevel,
    run.parameters.phaseLag,
    run.parameters.dt,
    run.network.type,
    run.network.avgDegree?.toFixed(2) || '',
    run.metrics.finalR.toFixed(4),
    run.metrics.meanR.toFixed(4),
    run.metrics.stdR.toFixed(4),
    run.metrics.settlingTime?.toFixed(2) || '',
    run.metrics.converged ? 'Yes' : 'No',
    run.notes || ''
  ]);

  // Combine into CSV
  const csv = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');

  // Download
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `kuramoto-runs-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Get storage stats
 */
export function getStorageStats() {
  const runs = loadRuns();
  const dataStr = localStorage.getItem(STORAGE_KEY) || '[]';

  return {
    runCount: runs.length,
    storageBytes: new Blob([dataStr]).size,
    storageKB: (new Blob([dataStr]).size / 1024).toFixed(2),
    maxRuns: MAX_RUNS
  };
}
