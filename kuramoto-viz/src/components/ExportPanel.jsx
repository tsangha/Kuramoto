import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, FileText, Image, CheckCircle } from 'lucide-react';
import { exportCSV, exportScreenshot, exportParameters, copyDataToClipboard } from '../utils/export';

/**
 * ExportPanel Component
 * Allows users to export data and screenshots
 */
export default function ExportPanel({ history, parameters, network, isOpen, onClose }) {
  const [exportStatus, setExportStatus] = useState(null);

  const handleExport = async (type) => {
    try {
      setExportStatus({ type, status: 'exporting' });

      switch (type) {
        case 'csv':
          await exportCSV(history);
          break;
        case 'screenshot':
          await exportScreenshot('root');
          break;
        case 'config':
          exportParameters(parameters, network);
          break;
        case 'clipboard':
          const success = copyDataToClipboard(history);
          if (!success) throw new Error('Clipboard access denied');
          break;
        default:
          throw new Error('Unknown export type');
      }

      setExportStatus({ type, status: 'success' });
      setTimeout(() => setExportStatus(null), 2000);
    } catch (error) {
      console.error('Export failed:', error);
      setExportStatus({ type, status: 'error', message: error.message });
      setTimeout(() => setExportStatus(null), 3000);
    }
  };

  if (!isOpen) return null;

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

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50
                       w-full max-w-md"
          >
            <div className="rounded-lg border bg-card text-card-foreground shadow-lg p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Download className="text-primary" size={28} />
                  <h2 className="text-2xl font-bold">Export Data</h2>
                </div>
                <button
                  onClick={onClose}
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground w-10 h-10 p-0"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3">
                {/* Export CSV */}
                <ExportButton
                  icon={<FileText size={20} />}
                  label="Export as CSV"
                  description="Time series data for all oscillators"
                  onClick={() => handleExport('csv')}
                  status={exportStatus?.type === 'csv' ? exportStatus.status : null}
                />

                {/* Export Screenshot */}
                <ExportButton
                  icon={<Image size={20} />}
                  label="Export Screenshot"
                  description="Save current visualization as PNG"
                  onClick={() => handleExport('screenshot')}
                  status={exportStatus?.type === 'screenshot' ? exportStatus.status : null}
                />

                {/* Export Config */}
                <ExportButton
                  icon={<FileText size={20} />}
                  label="Export Configuration"
                  description="Save parameters and network settings"
                  onClick={() => handleExport('config')}
                  status={exportStatus?.type === 'config' ? exportStatus.status : null}
                />

                {/* Copy to Clipboard */}
                <ExportButton
                  icon={<Download size={20} />}
                  label="Copy to Clipboard"
                  description="Copy time series data (Excel-ready)"
                  onClick={() => handleExport('clipboard')}
                  status={exportStatus?.type === 'clipboard' ? exportStatus.status : null}
                />
              </div>

              {exportStatus?.status === 'error' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm"
                >
                  Error: {exportStatus.message}
                </motion.div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function ExportButton({ icon, label, description, onClick, status }) {
  return (
    <button
      onClick={onClick}
      disabled={status === 'exporting'}
      className="rounded-lg border bg-card text-card-foreground shadow-sm w-full p-4 text-left hover:bg-accent hover:shadow-md transition-all group disabled:opacity-50"
    >
      <div className="flex items-center gap-3">
        <div className="text-primary group-hover:scale-110 transition-transform">
          {status === 'success' ? <CheckCircle size={20} /> : icon}
        </div>
        <div className="flex-1">
          <div className="font-semibold mb-0.5">{label}</div>
          <div className="text-xs text-muted-foreground">{description}</div>
        </div>
        {status === 'exporting' && (
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        )}
        {status === 'success' && (
          <CheckCircle className="text-green-500" size={20} />
        )}
      </div>
    </button>
  );
}
