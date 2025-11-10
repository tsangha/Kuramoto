import { useState } from 'react';
import { Brain, Network } from 'lucide-react';
import App from './App';
import AttentionApp from './AttentionApp';

/**
 * Router component to switch between original Kuramoto viz and Attention Field
 */
export default function AppRouter() {
  const [mode, setMode] = useState('attention'); // 'kuramoto' or 'attention'

  return (
    <div className="relative w-full h-screen">
      {/* Mode Toggle - Fixed in top-right */}
      <div className="fixed top-4 right-4 z-50 flex gap-2 bg-card/90 backdrop-blur-sm border rounded-lg p-1 shadow-lg">
        <button
          onClick={() => setMode('kuramoto')}
          className={`inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors h-9 px-4 gap-2 ${
            mode === 'kuramoto'
              ? 'bg-primary text-primary-foreground'
              : 'hover:bg-accent hover:text-accent-foreground'
          }`}
          title="Original Kuramoto Model"
        >
          <Network size={16} />
          <span className="hidden sm:inline">Kuramoto Model</span>
        </button>
        <button
          onClick={() => setMode('attention')}
          className={`inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors h-9 px-4 gap-2 ${
            mode === 'attention'
              ? 'bg-primary text-primary-foreground'
              : 'hover:bg-accent hover:text-accent-foreground'
          }`}
          title="Attention Field Simulation"
        >
          <Brain size={16} />
          <span className="hidden sm:inline">Attention Field</span>
        </button>
      </div>

      {/* Render selected app */}
      {mode === 'kuramoto' && <App />}
      {mode === 'attention' && <AttentionApp />}
    </div>
  );
}
