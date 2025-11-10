import { useRef, useEffect } from 'react';

/**
 * 2D Heat map visualization of attention field
 * Shows attention strength and stimulus intensity as color overlays
 */

export default function AttentionHeatMap({ state, showStimulus = true, showPhase = false }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !state || !state.attentionMap) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { gridSize, attentionMap, stimulus, theta, objects, trackedObjects } = state;

    // Set canvas size
    const cellSize = 8; // pixels per grid cell
    canvas.width = gridSize * cellSize;
    canvas.height = gridSize * cellSize;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw grid cells
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        const idx = i * gridSize + j;
        const x = j * cellSize;
        const y = i * cellSize;

        if (showPhase) {
          // Show phase as hue
          const phase = theta[idx];
          const hue = ((phase + Math.PI) / (2 * Math.PI)) * 360;
          const attention = attentionMap[idx];
          const saturation = 100;
          const lightness = 30 + attention * 40;

          ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
        } else {
          // Show attention as heat map: soft pink to teal gradient
          const attention = attentionMap[idx];
          const stim = showStimulus ? stimulus[idx] : 0;

          // Background: very light rose (#FFF5F7) for no attention
          // Low attention: soft pink (#FFE0E9)
          // Medium attention: soft teal (#7DD3C0)
          // High attention: rich teal (#2D9B87)

          // Base color: light rose background
          let r = 255;
          let g = 245;
          let b = 247;

          if (attention > 0.05) {
            // Interpolate from light pink to teal based on attention
            const t = Math.min(attention, 1.0);

            // Light pink (#FFE0E9) to teal (#2D9B87)
            const pink = { r: 255, g: 224, b: 233 };
            const teal = { r: 45, g: 155, b: 135 };

            r = Math.floor(pink.r + (teal.r - pink.r) * t);
            g = Math.floor(pink.g + (teal.g - pink.g) * t);
            b = Math.floor(pink.b + (teal.b - pink.b) * t);
          }

          // Blend in stimulus as subtle highlight
          if (stim > 0.1) {
            const highlight = stim * 30;
            r = Math.min(255, r + highlight);
            g = Math.min(255, g + highlight);
            b = Math.min(255, b + highlight);
          }

          ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        }

        ctx.fillRect(x, y, cellSize, cellSize);
      }
    }

    // Draw stimulus objects
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = 2;

    for (const obj of objects || []) {
      // Align with grid cells by adding half cellSize offset to center in cell
      const cx = (obj.x + 0.5) * cellSize;
      const cy = (obj.y + 0.5) * cellSize;
      const radius = obj.radius * cellSize;

      // Draw circle
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
      ctx.stroke();

      // Draw velocity vector
      if (Math.abs(obj.vx) > 0.01 || Math.abs(obj.vy) > 0.01) {
        const vScale = 5;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + obj.vx * vScale * cellSize, cy + obj.vy * vScale * cellSize);
        ctx.stroke();

        // Arrow head
        const angle = Math.atan2(obj.vy, obj.vx);
        const headlen = 6;
        const ex = cx + obj.vx * vScale * cellSize;
        const ey = cy + obj.vy * vScale * cellSize;

        ctx.beginPath();
        ctx.moveTo(ex, ey);
        ctx.lineTo(
          ex - headlen * Math.cos(angle - Math.PI / 6),
          ey - headlen * Math.sin(angle - Math.PI / 6)
        );
        ctx.moveTo(ex, ey);
        ctx.lineTo(
          ex - headlen * Math.cos(angle + Math.PI / 6),
          ey - headlen * Math.sin(angle + Math.PI / 6)
        );
        ctx.stroke();
      }
    }

    // Draw tracked object markers
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 3;

    for (const tracked of trackedObjects || []) {
      // Align with grid cells
      const cx = (tracked.position[0] + 0.5) * cellSize;
      const cy = (tracked.position[1] + 0.5) * cellSize;
      const radius = 12;

      // Draw tracking reticle
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(cx, cy, radius + 4, 0, 2 * Math.PI);
      ctx.stroke();

      // Draw crosshair
      ctx.beginPath();
      ctx.moveTo(cx - radius - 6, cy);
      ctx.lineTo(cx - radius - 2, cy);
      ctx.moveTo(cx + radius + 2, cy);
      ctx.lineTo(cx + radius + 6, cy);
      ctx.moveTo(cx, cy - radius - 6);
      ctx.lineTo(cx, cy - radius - 2);
      ctx.moveTo(cx, cy + radius + 2);
      ctx.lineTo(cx, cy + radius + 6);
      ctx.stroke();
    }

  }, [state, showStimulus, showPhase]);

  if (!state || !state.attentionMap) {
    return (
      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
        No data available
      </div>
    );
  }

  return (
    <div className="w-full h-full flex items-center justify-center bg-black/10 rounded">
      <canvas
        ref={canvasRef}
        className="max-w-full max-h-full"
        style={{ imageRendering: 'pixelated' }}
      />
    </div>
  );
}
