import { useState } from 'react';
import { Trash2, ChevronUp, ChevronDown, Edit2, Check, X, Upload } from 'lucide-react';
import { deleteRun, updateRun } from '../utils/runStorage';
import { classifySyncState } from '../utils/runMetrics';

/**
 * RunsTable Component
 * Sortable table view of all saved runs with delete and load functionality
 */
export default function RunsTable({ runs, onRunsChanged, onLoadRun }) {
  const [sortKey, setSortKey] = useState('timestamp');
  const [sortDirection, setSortDirection] = useState('desc');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');

  // Sort runs
  const sortedRuns = [...runs].sort((a, b) => {
    let aVal, bVal;

    switch (sortKey) {
      case 'name':
        aVal = a.name.toLowerCase();
        bVal = b.name.toLowerCase();
        break;
      case 'timestamp':
        aVal = new Date(a.timestamp).getTime();
        bVal = new Date(b.timestamp).getTime();
        break;
      case 'K':
        aVal = a.parameters.K || a.parameters.K_stim || 0;
        bVal = b.parameters.K || b.parameters.K_stim || 0;
        break;
      case 'N':
        aVal = a.parameters.N;
        bVal = b.parameters.N;
        break;
      case 'noise':
        aVal = a.parameters.noiseLevel;
        bVal = b.parameters.noiseLevel;
        break;
      case 'network':
        aVal = a.network?.type || 'attention';
        bVal = b.network?.type || 'attention';
        break;
      case 'finalR':
        aVal = a.metrics.finalR;
        bVal = b.metrics.finalR;
        break;
      case 'meanR':
        aVal = a.metrics.meanR;
        bVal = b.metrics.meanR;
        break;
      default:
        aVal = 0;
        bVal = 0;
    }

    if (sortDirection === 'asc') {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  });

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this run?')) {
      deleteRun(id);
      onRunsChanged();
    }
  };

  const handleStartEdit = (run) => {
    setEditingId(run.id);
    setEditName(run.name);
  };

  const handleSaveEdit = (id) => {
    updateRun(id, { name: editName });
    setEditingId(null);
    onRunsChanged();
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName('');
  };

  const SortableHeader = ({ column, label }) => (
    <th
      onClick={() => handleSort(column)}
      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide cursor-pointer hover:bg-accent/50 transition-colors select-none"
    >
      <div className="flex items-center gap-1">
        {label}
        {sortKey === column && (
          sortDirection === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
        )}
      </div>
    </th>
  );

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatNetworkType = (type) => {
    const names = {
      'all-to-all': 'All-to-All',
      'ring': 'Ring',
      'small-world': 'Small-World',
      'scale-free': 'Scale-Free',
      'random': 'Random'
    };
    return names[type] || type;
  };

  const getSyncBadgeColor = (finalR) => {
    if (finalR < 0.2) return 'bg-red-500/20 text-red-700 dark:text-red-400';
    if (finalR < 0.5) return 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400';
    if (finalR < 0.8) return 'bg-blue-500/20 text-blue-700 dark:text-blue-400';
    return 'bg-green-500/20 text-green-700 dark:text-green-400';
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="bg-muted">
              <tr>
                <SortableHeader column="name" label="Name" />
                <SortableHeader column="timestamp" label="Date" />
                <SortableHeader column="K" label="K" />
                <SortableHeader column="N" label="N" />
                <SortableHeader column="noise" label="Noise" />
                <SortableHeader column="network" label="Network" />
                <SortableHeader column="finalR" label="Final r" />
                <SortableHeader column="meanR" label="Mean r" />
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide">
                  State
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {sortedRuns.map((run) => (
                <tr key={run.id} className="hover:bg-accent/30 transition-colors">
                  <td className="px-4 py-3">
                    {editingId === run.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="px-2 py-1 text-sm rounded border bg-background"
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveEdit(run.id)}
                          className="p-1 hover:bg-accent rounded"
                        >
                          <Check size={14} className="text-green-600" />
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="p-1 hover:bg-accent rounded"
                        >
                          <X size={14} className="text-red-600" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{run.name}</span>
                        <button
                          onClick={() => handleStartEdit(run)}
                          className="p-1 opacity-0 group-hover:opacity-100 hover:bg-accent rounded transition-opacity"
                        >
                          <Edit2 size={12} className="text-muted-foreground" />
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {formatDate(run.timestamp)}
                  </td>
                  <td className="px-4 py-3 text-sm font-mono font-semibold">
                    {(run.parameters.K || run.parameters.K_stim || 0).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-sm font-mono">
                    {run.parameters.N || run.parameters.gridSize || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm font-mono">
                    {run.parameters.noiseLevel.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {run.network ? formatNetworkType(run.network.type) : 'Attention Field'}
                  </td>
                  <td className="px-4 py-3 text-sm font-mono font-bold">
                    {run.metrics.finalR.toFixed(3)}
                  </td>
                  <td className="px-4 py-3 text-sm font-mono">
                    {run.metrics.meanR.toFixed(3)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getSyncBadgeColor(run.metrics.finalR)}`}>
                      {classifySyncState(run.metrics.finalR)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {onLoadRun && (
                        <button
                          onClick={() => onLoadRun(run)}
                          className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 hover:bg-primary hover:text-primary-foreground h-8 px-3 gap-1 border border-input"
                          title="Load this run"
                        >
                          <Upload size={14} />
                          <span className="text-xs">Load</span>
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(run.id)}
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-destructive hover:text-destructive-foreground h-8 w-8 p-0"
                        title="Delete run"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {runs.length > 0 && (
        <div className="text-sm text-muted-foreground text-center">
          {runs.length} {runs.length === 1 ? 'run' : 'runs'} total
        </div>
      )}
    </div>
  );
}
