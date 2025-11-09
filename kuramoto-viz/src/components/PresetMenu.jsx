import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, BookOpen, Lightbulb, ChevronDown, ChevronUp } from 'lucide-react';
import { getPresetsByCategory, categories } from '../utils/presets';
import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';

/**
 * PresetMenu Component
 * Tabbed interface for presets and mathematical context
 */
export default function PresetMenu({ onSelectPreset, isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('presets');
  const [expandedCategory, setExpandedCategory] = useState('critical');
  const presetsByCategory = getPresetsByCategory();

  if (!isOpen) return null;

  const tabs = [
    { id: 'presets', name: 'Presets', icon: Sparkles },
    { id: 'math', name: 'Mathematical Context', icon: BookOpen },
    { id: 'guide', name: 'Exploration Guide', icon: Lightbulb }
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

          {/* Tabbed Modal - Centered Container */}
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50
                          w-[95vw] sm:w-[90vw] md:w-[85vw] lg:w-[80vw] max-w-5xl">
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
                  <h2 className="text-xl sm:text-2xl font-bold">Kuramoto Model Explorer</h2>
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
              <div className="p-4 sm:p-6 md:p-8 overflow-y-auto max-h-[calc(90vh-120px)] sm:max-h-[calc(85vh-140px)]">
                {activeTab === 'presets' && <PresetsTab presetsByCategory={presetsByCategory} expandedCategory={expandedCategory} setExpandedCategory={setExpandedCategory} onSelectPreset={onSelectPreset} onClose={onClose} />}
                {activeTab === 'math' && <MathContextTab />}
                {activeTab === 'guide' && <ExplorationGuideTab />}
              </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

// ============================================
// PRESETS TAB
// ============================================

function PresetsTab({ presetsByCategory, expandedCategory, setExpandedCategory, onSelectPreset, onClose }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground mb-6">
        Explore fascinating phase transitions and nonlinear dynamics. Each preset demonstrates key phenomena in synchronization theory.
      </p>

      {Object.entries(categories).map(([catId, catInfo]) => (
        <CategorySection
          key={catId}
          catId={catId}
          catInfo={catInfo}
          presets={presetsByCategory[catId]}
          isExpanded={expandedCategory === catId}
          onToggle={() => setExpandedCategory(expandedCategory === catId ? null : catId)}
          onSelectPreset={onSelectPreset}
          onClose={onClose}
        />
      ))}
    </div>
  );
}

function CategorySection({ catId, catInfo, presets, isExpanded, onToggle, onSelectPreset, onClose }) {
  return (
    <div className="rounded-lg border bg-card">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-accent/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">{catInfo.icon}</span>
          <div className="text-left">
            <h3 className="font-semibold">{catInfo.name}</h3>
            <p className="text-xs text-muted-foreground">{catInfo.description}</p>
          </div>
        </div>
        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 pt-0 grid grid-cols-1 md:grid-cols-2 gap-3">
              {presets.map((preset, index) => (
                <motion.button
                  key={preset.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => {
                    onSelectPreset(preset.id);
                    onClose();
                  }}
                  className="rounded-lg border bg-background text-left p-3 hover:bg-accent hover:shadow-md transition-all group"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl group-hover:scale-110 transition-transform">
                      {preset.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm mb-1">{preset.name}</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed mb-2">
                        {preset.description}
                      </p>
                      {preset.watchFor && (
                        <p className="text-xs text-blue-500 dark:text-blue-400 mb-2">
                          👁️ {preset.watchFor}
                        </p>
                      )}
                      {preset.note && (
                        <p className="text-xs text-primary italic">
                          💡 {preset.note}
                        </p>
                      )}
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================
// MATHEMATICAL CONTEXT TAB
// ============================================

function MathContextTab() {
  return (
    <div className="space-y-6 max-w-3xl">
      <section className="space-y-3">
        <h3 className="text-lg font-semibold">The Kuramoto Model</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          The Kuramoto model is a mathematical model of coupled oscillators that demonstrates how synchronization emerges in complex systems. It shows how individual oscillators with different natural frequencies can spontaneously synchronize through weak interactions.
        </p>
      </section>

      <section className="space-y-3">
        <h3 className="text-lg font-semibold">Governing Equation</h3>
        <div className="rounded-lg border bg-secondary/50 p-4 overflow-x-auto">
          <BlockMath math="\frac{d\theta_i}{dt} = \omega_i + \frac{K}{N} \sum_{j=1}^{N} S_{ij} \sin(\theta_j - \theta_i - \alpha)" />
        </div>
        <ul className="text-sm text-muted-foreground space-y-2 list-none pl-0">
          <li><InlineMath math="\theta_i" />: Phase of oscillator <InlineMath math="i" /></li>
          <li><InlineMath math="\omega_i" />: Natural frequency (sampled from <InlineMath math="\mathcal{N}(0,1)" />)</li>
          <li><InlineMath math="K" />: Coupling strength (control parameter)</li>
          <li><InlineMath math="S_{ij}" />: Network adjacency matrix (1 if connected, 0 otherwise)</li>
          <li><InlineMath math="\alpha" />: Phase lag parameter (time delay effects)</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h3 className="text-lg font-semibold">Order Parameter</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          The complex order parameter <InlineMath math="r e^{i\psi}" /> quantifies the degree of synchronization:
        </p>
        <div className="rounded-lg border bg-secondary/50 p-4 overflow-x-auto">
          <BlockMath math="r e^{i\psi} = \frac{1}{N} \sum_{j=1}^{N} e^{i\theta_j}" />
        </div>
        <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
          <li><InlineMath math="r = 0" />: Completely incoherent (no synchronization)</li>
          <li><InlineMath math="0 < r < 0.5" />: Weak partial synchronization</li>
          <li><InlineMath math="0.5 < r < 0.9" />: Strong partial synchronization</li>
          <li><InlineMath math="r \approx 1" />: Nearly perfect synchronization</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h3 className="text-lg font-semibold">Phase Transition</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          As coupling strength <InlineMath math="K" /> increases, the system undergoes a continuous phase transition from incoherence to synchronization. The critical coupling is:
        </p>
        <div className="rounded-lg border bg-secondary/50 p-4 overflow-x-auto">
          <BlockMath math="K_c = \frac{2}{\pi g(0)}" />
        </div>
        <p className="text-sm text-muted-foreground">
          For a standard normal distribution of frequencies, <InlineMath math="K_c \approx 0.64" /> (all-to-all network). Network topology strongly affects this critical value!
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-lg font-semibold">Real-World Applications</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
          <div className="p-3 rounded-lg bg-accent/30">
            <div className="font-semibold mb-1">Biological Systems</div>
            <ul className="text-xs text-muted-foreground space-y-0.5 list-disc list-inside">
              <li>Heart pacemaker cell sync</li>
              <li>Circadian rhythm coordination</li>
              <li>Neural oscillations (brain waves)</li>
            </ul>
          </div>
          <div className="p-3 rounded-lg bg-accent/30">
            <div className="font-semibold mb-1">Physical Systems</div>
            <ul className="text-xs text-muted-foreground space-y-0.5 list-disc list-inside">
              <li>Power grid frequency control</li>
              <li>Josephson junction arrays</li>
              <li>Coupled pendulum clocks</li>
            </ul>
          </div>
          <div className="p-3 rounded-lg bg-accent/30">
            <div className="font-semibold mb-1">Nature</div>
            <ul className="text-xs text-muted-foreground space-y-0.5 list-disc list-inside">
              <li>Firefly flash synchronization</li>
              <li>Cricket chirp coordination</li>
              <li>Audience clapping rhythms</li>
            </ul>
          </div>
          <div className="p-3 rounded-lg bg-accent/30">
            <div className="font-semibold mb-1">Social Systems</div>
            <ul className="text-xs text-muted-foreground space-y-0.5 list-disc list-inside">
              <li>Opinion dynamics</li>
              <li>Market synchronization</li>
              <li>Pedestrian bridge oscillations</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}

// ============================================
// EXPLORATION GUIDE TAB
// ============================================

function ExplorationGuideTab() {
  return (
    <div className="space-y-6 max-w-3xl">
      <section className="space-y-3">
        <h3 className="text-lg font-semibold">How to Observe Phase Transitions</h3>
        <div className="space-y-3">
          <div className="rounded-lg border bg-accent/20 p-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">1️⃣</span>
              <div>
                <h4 className="font-semibold text-sm mb-1">Start Subcritical</h4>
                <p className="text-xs text-muted-foreground mb-2">
                  Load "Subcritical Chaos" preset. Watch the order parameter <InlineMath math="r" /> stay near 0. Oscillators drift independently with no collective behavior.
                </p>
                <p className="text-xs text-blue-500 dark:text-blue-400">
                  💡 Phase circle shows colorful dots scattered randomly, constantly drifting
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-accent/20 p-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">2️⃣</span>
              <div>
                <h4 className="font-semibold text-sm mb-1">Approach the Critical Point</h4>
                <p className="text-xs text-muted-foreground mb-2">
                  Use <kbd className="px-1 py-0.5 rounded bg-secondary text-xs">+</kbd> key to slowly increase <InlineMath math="K" />. Watch for critical slowing down - the system takes longer to settle into a state.
                </p>
                <p className="text-xs text-blue-500 dark:text-blue-400">
                  💡 At <InlineMath math="K \approx 0.64" />, you'll see metastable clusters form and dissolve
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-accent/20 p-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">3️⃣</span>
              <div>
                <h4 className="font-semibold text-sm mb-1">Cross the Threshold</h4>
                <p className="text-xs text-muted-foreground mb-2">
                  Continue increasing <InlineMath math="K" /> past 0.7. Suddenly, <InlineMath math="r" /> jumps to 0.5-0.7! A synchronized cluster has formed.
                </p>
                <p className="text-xs text-blue-500 dark:text-blue-400">
                  💡 Phase circle shows majority of dots clustering in one color/region
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border bg-accent/20 p-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">4️⃣</span>
              <div>
                <h4 className="font-semibold text-sm mb-1">Explore Hysteresis</h4>
                <p className="text-xs text-muted-foreground mb-2">
                  Now decrease <InlineMath math="K" /> using <kbd className="px-1 py-0.5 rounded bg-secondary text-xs">-</kbd>. Notice the system stays synchronized even below <InlineMath math="K_c" />! This is bistability.
                </p>
                <p className="text-xs text-blue-500 dark:text-blue-400">
                  💡 History matters - different paths lead to different states at same <InlineMath math="K" />
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-lg font-semibold">Suggested Experiments</h3>
        <div className="space-y-2">
          <ExperimentCard
            title="Compare Network Topologies"
            description="Load 'Ring: Subcritical' then 'Small-World Boost'. Same K value, drastically different r! Topology matters."
            icon="🌐"
          />
          <ExperimentCard
            title="Noise Effects"
            description="Load 'Critical Point', then gradually increase noise level. Watch critical behavior get washed out by stochastic fluctuations."
            icon="🎲"
          />
          <ExperimentCard
            title="Time-Delay Frustration"
            description="Load 'Phase-Lag Frustration'. Even huge K can't achieve full sync when α = π/2. Delays can prevent synchronization!"
            icon="⏱️"
          />
          <ExperimentCard
            title="Hunt for Chimeras"
            description="Load 'Chimera State'. Zoom in on phase circle - half syncs, half stays chaotic. The ultimate coexistence phenomenon!"
            icon="🐉"
          />
        </div>
      </section>

      <section className="space-y-2">
        <h3 className="text-lg font-semibold">Keyboard Shortcuts</h3>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex justify-between items-center p-2 rounded bg-accent/20">
            <span className="text-muted-foreground">Play/Pause</span>
            <kbd className="px-2 py-1 rounded bg-secondary font-mono border border-border">Space</kbd>
          </div>
          <div className="flex justify-between items-center p-2 rounded bg-accent/20">
            <span className="text-muted-foreground">Reset</span>
            <kbd className="px-2 py-1 rounded bg-secondary font-mono border border-border">R</kbd>
          </div>
          <div className="flex justify-between items-center p-2 rounded bg-accent/20">
            <span className="text-muted-foreground">Increase K</span>
            <kbd className="px-2 py-1 rounded bg-secondary font-mono border border-border">+</kbd>
          </div>
          <div className="flex justify-between items-center p-2 rounded bg-accent/20">
            <span className="text-muted-foreground">Decrease K</span>
            <kbd className="px-2 py-1 rounded bg-secondary font-mono border border-border">-</kbd>
          </div>
          <div className="flex justify-between items-center p-2 rounded bg-accent/20">
            <span className="text-muted-foreground">Presets</span>
            <kbd className="px-2 py-1 rounded bg-secondary font-mono border border-border">P</kbd>
          </div>
          <div className="flex justify-between items-center p-2 rounded bg-accent/20">
            <span className="text-muted-foreground">Export Data</span>
            <kbd className="px-2 py-1 rounded bg-secondary font-mono border border-border">E</kbd>
          </div>
        </div>
      </section>
    </div>
  );
}

function ExperimentCard({ title, description, icon }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border bg-background">
      <span className="text-xl">{icon}</span>
      <div>
        <h4 className="font-semibold text-sm mb-1">{title}</h4>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
