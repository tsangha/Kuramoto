import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

/**
 * NetworkGraph Component
 * Visualizes network topology using D3 force layout with proper centering
 */
export default function NetworkGraph({ nodes, edges, theta }) {
  const svgRef = useRef(null);
  const simulationRef = useRef(null);
  const dimensionsRef = useRef({ width: 600, height: 400 }); // Safe defaults
  const thetaRef = useRef(theta);
  const nodeElementsRef = useRef(null);

  // Update theta ref when props change
  useEffect(() => {
    thetaRef.current = theta;
  }, [theta]);

  useEffect(() => {
    if (!svgRef.current || !nodes || nodes.length === 0) return;

    const svg = d3.select(svgRef.current);

    // Clear previous content
    svg.selectAll('*').remove();

    // Create container group for zooming
    const g = svg.append('g');

    // Set up zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.1, 10])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    // Initialize with safe default dimensions
    const { width, height } = dimensionsRef.current;

    // Create force simulation
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(edges)
        .id(d => d.id)
        .distance(50))
      .force('charge', d3.forceManyBody().strength(-80))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(12))
      .velocityDecay(0.7)
      .alphaDecay(0.02);

    simulationRef.current = simulation;

    // Create links
    const link = g.append('g')
      .selectAll('line')
      .data(edges)
      .join('line')
      .attr('stroke', '#52525b')
      .attr('stroke-opacity', 0.4)
      .attr('stroke-width', 1.5);

    // Create nodes
    const node = g.append('g')
      .selectAll('circle')
      .data(nodes)
      .join('circle')
      .attr('r', 7)
      .attr('fill', '#71717a')
      .attr('stroke', '#27272a')
      .attr('stroke-width', 2)
      .call(drag(simulation));

    // Store node elements for phase color updates
    nodeElementsRef.current = node;

    // Add labels for small networks
    let label = null;
    if (nodes.length <= 30) {
      label = g.append('g')
        .selectAll('text')
        .data(nodes)
        .join('text')
        .text(d => d.id)
        .attr('font-size', 11)
        .attr('fill', '#d4d4d8')
        .attr('dx', 12)
        .attr('dy', 4);
    }

    // Update positions on each tick
    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);

      node
        .attr('cx', d => d.x)
        .attr('cy', d => d.y);

      if (label) {
        label
          .attr('x', d => d.x)
          .attr('y', d => d.y);
      }

      // Update node colors based on current phases
      const currentTheta = thetaRef.current;
      if (currentTheta && currentTheta.length > 0) {
        node.attr('fill', (d, i) => {
          if (i < currentTheta.length) {
            const phase = currentTheta[i];
            const hue = ((phase + Math.PI) / (2 * Math.PI)) * 360;
            return d3.hsl(hue, 0.6, 0.5).toString();
          }
          return '#71717a';
        });
      }
    });

    // Stop simulation after it has settled
    simulation.on('end', () => {
      simulation.stop();
    });

    // Drag behavior
    function drag(simulation) {
      function dragstarted(event) {
        if (!event.active) simulation.alphaTarget(0.1).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      }

      function dragged(event) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      }

      function dragended(event) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
      }

      return d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended);
    }

    // ResizeObserver to handle dynamic dimensions
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: newWidth, height: newHeight } = entry.contentRect;

        // Only update if dimensions are valid and have changed
        if (newWidth > 0 && newHeight > 0) {
          const oldWidth = dimensionsRef.current.width;
          const oldHeight = dimensionsRef.current.height;

          if (newWidth !== oldWidth || newHeight !== oldHeight) {
            dimensionsRef.current = { width: newWidth, height: newHeight };

            // Update force simulation center
            if (simulationRef.current) {
              simulationRef.current
                .force('center', d3.forceCenter(newWidth / 2, newHeight / 2))
                .alpha(0.3)
                .restart();
            }
          }
        }
      }
    });

    resizeObserver.observe(svgRef.current);

    return () => {
      resizeObserver.disconnect();
      if (simulationRef.current) {
        simulationRef.current.stop();
      }
    };
  }, [nodes, edges]);

  return (
    <div className="w-full h-full bg-zinc-900 rounded-lg overflow-hidden">
      <svg
        ref={svgRef}
        className="w-full h-full"
        style={{ cursor: 'grab' }}
      ></svg>
    </div>
  );
}
