import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

/**
 * TimeSeries Component
 * Plots order parameter over time using D3 with proper empty state handling
 */
export default function TimeSeries({ history, updateTrigger, title = "Order Parameter r(t)", yLabel = "r" }) {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const dimensionsRef = useRef({ width: 600, height: 300 }); // Safe defaults

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const svg = d3.select(svgRef.current);
    const { width, height } = dimensionsRef.current;

    const margin = { top: 40, right: 30, bottom: 50, left: 60 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Clear previous content
    svg.selectAll('*').remove();
    svg.attr('width', width).attr('height', height);

    // Create main group
    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Check if we have data
    const hasData = history && history.time && history.time.length > 0;

    // Calculate appropriate X-axis scale that grows naturally
    const getXAxisMax = (currentMax) => {
      if (currentMax === 0) return 10;

      const scales = [
        10, 30, 60,           // 10s, 30s, 1min
        120, 300, 600,        // 2min, 5min, 10min
        1800, 3600,           // 30min, 1hr
        7200, 18000, 36000    // 2hr, 5hr, 10hr
      ];

      // Find the next scale that's larger than current max
      // Use scale if currentMax is within 90% of it
      for (const scale of scales) {
        if (currentMax < scale * 0.9) {
          return scale;
        }
      }

      // For very long simulations, round up to nearest hour
      return Math.ceil(currentMax / 3600) * 3600;
    };

    const currentMaxTime = hasData ? Math.max(...history.time) : 0;
    const xAxisMax = getXAxisMax(currentMaxTime);

    // Create scales
    const xScale = d3.scaleLinear()
      .domain([0, xAxisMax])
      .range([0, innerWidth]);

    const yScale = d3.scaleLinear()
      .domain([0, 1])
      .range([innerHeight, 0])
      .nice();

    // Format time labels based on scale
    const formatTime = (seconds) => {
      if (xAxisMax >= 3600) {
        // Show hours for long simulations
        const hours = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        return mins > 0 ? `${hours}h${mins}m` : `${hours}h`;
      } else if (xAxisMax >= 60) {
        // Show minutes for medium simulations
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return secs > 0 ? `${mins}m${secs}s` : `${mins}m`;
      } else {
        // Show seconds for short simulations
        return `${seconds.toFixed(0)}s`;
      }
    };

    // Create axes
    const xAxis = d3.axisBottom(xScale).ticks(6).tickFormat(formatTime);
    const yAxis = d3.axisLeft(yScale).ticks(5);

    // Add grid lines
    g.append('g')
      .attr('class', 'grid')
      .attr('opacity', 0.1)
      .attr('stroke', '#71717a')
      .call(d3.axisLeft(yScale)
        .tickSize(-innerWidth)
        .tickFormat(''));

    if (hasData) {
      // Add gradient for area fill
      const gradient = svg.append("defs")
        .append("linearGradient")
        .attr("id", "area-gradient")
        .attr("x1", "0%")
        .attr("y1", "0%")
        .attr("x2", "0%")
        .attr("y2", "100%");

      gradient.append("stop")
        .attr("offset", "0%")
        .attr("stop-color", "#3b82f6")
        .attr("stop-opacity", 0.4);

      gradient.append("stop")
        .attr("offset", "100%")
        .attr("stop-color", "#3b82f6")
        .attr("stop-opacity", 0);

      // Create area generator
      const area = d3.area()
        .x((d, i) => xScale(history.time[i]))
        .y0(innerHeight)
        .y1(d => yScale(d))
        .curve(d3.curveMonotoneX);

      // Add the area
      g.append('path')
        .datum(history.orderParameter)
        .attr('fill', 'url(#area-gradient)')
        .attr('d', area);

      // Create line generator
      const line = d3.line()
        .x((d, i) => xScale(history.time[i]))
        .y(d => yScale(d))
        .curve(d3.curveMonotoneX);

      // Add the line path
      g.append('path')
        .datum(history.orderParameter)
        .attr('fill', 'none')
        .attr('stroke', '#3b82f6')
        .attr('stroke-width', 2.5)
        .attr('d', line);
    } else {
      // Show empty state message
      g.append('text')
        .attr('x', innerWidth / 2)
        .attr('y', innerHeight / 2)
        .style('text-anchor', 'middle')
        .attr('fill', '#71717a')
        .attr('font-size', 14)
        .attr('font-style', 'italic')
        .text('Start simulation to see data');
    }

    // Add axes
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis)
      .attr('color', '#a1a1aa');

    g.append('g')
      .call(yAxis)
      .attr('color', '#a1a1aa');

    // Add axis labels
    svg.append('text')
      .attr('transform', `translate(${width / 2},${height - 10})`)
      .style('text-anchor', 'middle')
      .attr('fill', '#d4d4d8')
      .attr('font-size', 13)
      .text('Time');

    svg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', 18)
      .attr('x', -height / 2)
      .style('text-anchor', 'middle')
      .attr('fill', '#d4d4d8')
      .attr('font-size', 13)
      .text(yLabel);

    // Add title
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', 18)
      .style('text-anchor', 'middle')
      .attr('fill', '#fafafa')
      .attr('font-size', 15)
      .attr('font-weight', '600')
      .text(title);

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
            // Trigger re-render by updating the effect dependencies
            // This will happen automatically on next history update
          }
        }
      }
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [history, updateTrigger, title, yLabel]);

  return (
    <div ref={containerRef} className="w-full h-full bg-zinc-900 rounded-lg overflow-hidden p-2">
      <svg ref={svgRef} className="w-full h-full"></svg>
    </div>
  );
}
