import { useEffect, useRef } from 'react';
import p5 from 'p5';

/**
 * PhaseCircle Component
 * Visualizes oscillators as points on a circle, colored by phase
 */
export default function PhaseCircle({ theta, N, orderParameter }) {
  const containerRef = useRef(null);
  const p5Instance = useRef(null);

  // Use refs to store latest prop values for p5 draw loop
  const thetaRef = useRef(theta);
  const NRef = useRef(N);
  const orderParamRef = useRef(orderParameter);

  // Update refs whenever props change
  useEffect(() => {
    thetaRef.current = theta;
    NRef.current = N;
    orderParamRef.current = orderParameter;
  }, [theta, N, orderParameter]);

  useEffect(() => {
    if (!containerRef.current) return;

    const sketch = (p) => {
      p.setup = () => {
        const canvas = p.createCanvas(400, 400);
        canvas.parent(containerRef.current);
        p.angleMode(p.RADIANS);
      };

      p.draw = () => {
        // Access current values via refs
        const currentTheta = thetaRef.current;
        const currentN = NRef.current;
        const currentOrderParam = orderParamRef.current;

        // Dark background matching theme
        p.background(24, 24, 27); // zinc-900

        p.translate(p.width / 2, p.height / 2);

        // Draw main circle
        p.noFill();
        p.stroke(63, 63, 70); // zinc-700
        p.strokeWeight(2);
        const radius = Math.min(p.width, p.height) * 0.35;
        p.circle(0, 0, radius * 2);

        // Draw oscillators
        if (currentTheta && currentTheta.length > 0) {
          const dotSize = Math.max(4, Math.min(14, 400 / currentTheta.length));

          for (let i = 0; i < currentTheta.length; i++) {
            const angle = currentTheta[i];
            const x = radius * Math.cos(angle);
            const y = radius * Math.sin(angle);

            // Color based on phase using HSV
            p.colorMode(p.HSB);
            const hue = p.map(angle, -Math.PI, Math.PI, 0, 360);
            p.fill(hue, 70, 95);
            p.noStroke();
            p.circle(x, y, dotSize);
          }

          p.colorMode(p.RGB);

          // Draw order parameter vector
          if (currentOrderParam !== undefined && currentOrderParam > 0.01) {
            // Calculate mean phase
            let sumX = 0, sumY = 0;
            for (let i = 0; i < currentTheta.length; i++) {
              sumX += Math.cos(currentTheta[i]);
              sumY += Math.sin(currentTheta[i]);
            }
            sumX /= currentTheta.length;
            sumY /= currentTheta.length;

            const meanPhase = Math.atan2(sumY, sumX);
            const vectorLength = radius * currentOrderParam;

            // Draw vector
            p.stroke(239, 68, 68); // red-500
            p.strokeWeight(3);
            p.line(0, 0, vectorLength * Math.cos(meanPhase), vectorLength * Math.sin(meanPhase));

            // Draw arrowhead
            const arrowSize = 12;
            const arrowAngle = 0.4;
            const endX = vectorLength * Math.cos(meanPhase);
            const endY = vectorLength * Math.sin(meanPhase);

            p.line(
              endX, endY,
              endX - arrowSize * Math.cos(meanPhase - arrowAngle),
              endY - arrowSize * Math.sin(meanPhase - arrowAngle)
            );
            p.line(
              endX, endY,
              endX - arrowSize * Math.cos(meanPhase + arrowAngle),
              endY - arrowSize * Math.sin(meanPhase + arrowAngle)
            );
          }
        }

        // Display order parameter
        p.fill(250, 250, 250);
        p.noStroke();
        p.textAlign(p.CENTER);
        p.textSize(18);
        p.textFont('monospace');
        p.text(`r = ${(currentOrderParam || 0).toFixed(3)}`, 0, radius + 50);
      };

      p.windowResized = () => {
        if (containerRef.current) {
          const size = Math.min(containerRef.current.offsetWidth, 400);
          p.resizeCanvas(size, size);
        }
      };
    };

    // Create p5 instance
    p5Instance.current = new p5(sketch);

    return () => {
      if (p5Instance.current) {
        p5Instance.current.remove();
        p5Instance.current = null;
      }
    };
  }, []); // Only create p5 instance once

  return (
    <div className="w-full h-full flex items-center justify-center bg-zinc-900 rounded-lg">
      <div ref={containerRef} className="relative"></div>
    </div>
  );
}
