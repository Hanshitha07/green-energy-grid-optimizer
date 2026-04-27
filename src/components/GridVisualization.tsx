import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { Node, Edge, GridResult } from '../algorithms';

interface Props {
  data: GridResult;
  onNodeDrag?: (id: string, x: number, y: number) => void;
  onNodeToggle?: (id: string) => void;
}

export const GridVisualization: React.FC<Props> = ({ data, onNodeDrag, onNodeToggle }) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = 800;
    const height = 600;
    
    // Background
    svg.append('rect')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('fill', '#1a1a1a');

    const g = svg.append('g');

    // Zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 5])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    // Title
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', 30)
      .attr('text-anchor', 'middle')
      .attr('fill', '#fff')
      .attr('font-size', '16px')
      .attr('font-weight', 'bold')
      .text('Network map — turbines, cities and cables');

    // Draw Unused Potential Edges
    const usedEdgeKeys = new Set([...data.edges, ...data.redundantEdges].map(e => `${e.source}-${e.target}`));
    const unusedEdges = data.allPotentialEdges.filter(e => !usedEdgeKeys.has(`${e.source}-${e.target}`));

    g.selectAll<SVGLineElement, Edge>('.unused-edge')
      .data(unusedEdges)
      .enter()
      .append('line')
      .attr('class', 'unused-edge')
      .attr('x1', (d: Edge) => data.nodes.find(n => n.id === d.source)!.x)
      .attr('y1', (d: Edge) => data.nodes.find(n => n.id === d.source)!.y)
      .attr('x2', (d: Edge) => data.nodes.find(n => n.id === d.target)!.x)
      .attr('y2', (d: Edge) => data.nodes.find(n => n.id === d.target)!.y)
      .attr('stroke', '#4b5563')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '4,4')
      .attr('opacity', 0.2);

    // Draw Chosen Edges
    const allEdges = [...data.edges, ...data.redundantEdges];
    
    const edgeGroups = g.selectAll<SVGGElement, Edge>('.edge-group')
      .data(allEdges)
      .enter()
      .append('g')
      .attr('class', 'edge-group');

    edgeGroups.append('line')
      .attr('class', 'edge')
      .attr('x1', (d: Edge) => data.nodes.find(n => n.id === d.source)!.x)
      .attr('y1', (d: Edge) => data.nodes.find(n => n.id === d.source)!.y)
      .attr('x2', (d: Edge) => data.nodes.find(n => n.id === d.target)!.x)
      .attr('y2', (d: Edge) => data.nodes.find(n => n.id === d.target)!.y)
      .attr('stroke', (d: Edge) => d.type === 'primary' ? '#10b981' : '#f97316')
      .attr('stroke-width', 2.5)
      .attr('stroke-dasharray', (d: Edge) => d.type === 'redundant' ? '5,5' : 'none');

    // Edge Labels
    edgeGroups.append('text')
      .attr('x', (d: Edge) => (data.nodes.find(n => n.id === d.source)!.x + data.nodes.find(n => n.id === d.target)!.x) / 2)
      .attr('y', (d: Edge) => (data.nodes.find(n => n.id === d.source)!.y + data.nodes.find(n => n.id === d.target)!.y) / 2 - 5)
      .attr('text-anchor', 'middle')
      .attr('fill', '#fff')
      .attr('font-size', '10px')
      .attr('font-weight', 'bold')
      .text((d: Edge) => d.weight);

    // Draw Nodes
    const nodeGroups = g.selectAll('.node')
      .data(data.nodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('transform', (d: Node) => `translate(${d.x},${d.y})`)
      .style('cursor', (d: Node) => d.type === 'turbine' ? 'pointer' : 'grab')
      .on('click', (event, d: Node) => {
        if (d.type === 'turbine' && onNodeToggle) {
          onNodeToggle(d.id);
        }
      });

    // Drag behavior
    const drag = d3.drag<SVGGElement, Node>()
      .on('start', function() {
        d3.select(this).raise().attr('stroke', '#fff');
      })
      .on('drag', function(event, d) {
        if (onNodeDrag) {
          onNodeDrag(d.id, event.x, event.y);
        }
      })
      .on('end', function() {
        d3.select(this).attr('stroke', null);
      });

    nodeGroups.call(drag as any);

    nodeGroups.each(function(d: Node) {
      const gNode = d3.select(this);
      const isCritical = data.targetCriticalCityIds.has(d.id);
      const isActive = d.isActive !== false;

      if (d.type === 'turbine') {
        gNode.append('rect')
          .attr('x', -40)
          .attr('y', -25)
          .attr('width', 80)
          .attr('height', 50)
          .attr('rx', 8)
          .attr('fill', isActive ? '#064e3b' : '#331a1a')
          .attr('stroke', isActive ? '#10b981' : '#dc2626')
          .attr('stroke-width', 2)
          .attr('stroke-dasharray', isActive ? 'none' : '4,2');

        gNode.append('text')
          .attr('text-anchor', 'middle')
          .attr('y', -5)
          .attr('fill', isActive ? '#fff' : '#ef4444')
          .attr('font-size', '12px')
          .attr('font-weight', 'bold')
          .text(d.id.replace('Turbine-', 'T'));

        gNode.append('text')
          .attr('text-anchor', 'middle')
          .attr('y', 15)
          .attr('fill', isActive ? '#10b981' : '#dc2626')
          .attr('font-size', '10px')
          .text(isActive ? `cap = ${d.capacity || 4}` : 'OFFLINE');
      } else {
        const isConnected = !![...data.edges, ...data.redundantEdges].find(e => e.target === d.id);
        const color = isCritical ? (isConnected ? '#7c2d12' : '#431407') : (isConnected ? '#312e81' : '#1e1b4b');
        const stroke = isCritical ? (isConnected ? '#fb923c' : '#7c2d12') : (isConnected ? '#6366f1' : '#4338ca');

        if (isCritical) {
          // Inner Glow / Outer Ring for critical cities
          gNode.append('rect')
            .attr('x', -39)
            .attr('y', -24)
            .attr('width', 78)
            .attr('height', 48)
            .attr('rx', 10)
            .attr('fill', 'none')
            .attr('stroke', isConnected ? '#f97316' : '#7c2d12')
            .attr('stroke-width', 2)
            .attr('opacity', 0.5)
            .attr('stroke-dasharray', isConnected ? 'none' : '2,2');
          
          gNode.append('rect')
            .attr('x', -42)
            .attr('y', -27)
            .attr('width', 84)
            .attr('height', 54)
            .attr('rx', 12)
            .attr('fill', 'none')
            .attr('stroke', isConnected ? '#fb923c' : '#431407')
            .attr('stroke-width', 1)
            .attr('opacity', 0.3);
        }

        const demand = d.demand || 1;
        const scaleFactor = 1 + (demand - 1) * 0.15; // Max 1.6x size
        const width = 70 * scaleFactor;
        const height = 40 * scaleFactor;

        gNode.append('rect')
          .attr('x', -width / 2)
          .attr('y', -height / 2)
          .attr('width', width)
          .attr('height', height)
          .attr('rx', 8)
          .attr('fill', color)
          .attr('stroke', stroke)
          .attr('stroke-width', isCritical ? 3 : 2)
          .attr('opacity', isConnected ? 1 : 0.6);

        gNode.append('text')
          .attr('text-anchor', 'middle')
          .attr('y', isCritical ? -2 : 2)
          .attr('fill', isConnected ? '#fff' : (isCritical ? '#fb923c' : '#6366f1'))
          .attr('font-size', `${12 * scaleFactor}px`)
          .attr('font-weight', 'bold')
          .text(`${d.id.replace('City-', 'C')}${isCritical ? ' ★' : ''}`);

        gNode.append('text')
          .attr('text-anchor', 'middle')
          .attr('y', isCritical ? 10 * scaleFactor : 16 * scaleFactor)
          .attr('fill', isConnected ? (isCritical ? '#fdba74' : '#818cf8') : '#4b5563')
          .attr('font-size', isCritical ? '10px' : '9px')
          .attr('font-weight', isCritical || demand > 3 ? 'bold' : 'normal')
          .text(`${isCritical ? 'CRITICAL | ' : ''}demand: ${demand}`);

        if (!isConnected) {
          gNode.append('circle')
            .attr('cx', width / 2 - 3)
            .attr('cy', -height / 2 + 3)
            .attr('r', 4)
            .attr('fill', '#ef4444');
        }
      }
    });

    // Legend
    const legend = svg.append('g')
      .attr('transform', `translate(20, ${height - 60})`);

    legend.append('rect')
      .attr('width', width - 40)
      .attr('height', 50)
      .attr('rx', 10)
      .attr('fill', 'rgba(255, 255, 255, 0.05)')
      .attr('stroke', 'rgba(255, 255, 255, 0.1)');

    const items = [
      { label: 'Primary Link', color: '#10b981', dash: 'none' },
      { label: 'Backup Link', color: '#f97316', dash: '5,5' },
      { label: 'Unused Option', color: '#4b5563', dash: '4,4' },
      { label: 'Turbine Hub', color: '#10b981', type: 'rect' },
      { label: 'Critical City', color: '#f97316', type: 'rect' }
    ];

    items.forEach((item, i) => {
      const x = 25 + i * 148;
      if (item.type === 'rect') {
        legend.append('rect')
          .attr('x', x)
          .attr('y', 15)
          .attr('width', 15)
          .attr('height', 15)
          .attr('rx', 3)
          .attr('fill', item.color)
          .attr('opacity', 0.8);
      } else {
        legend.append('line')
          .attr('x1', x)
          .attr('y1', 22)
          .attr('x2', x + 25)
          .attr('y2', 22)
          .attr('stroke', item.color)
          .attr('stroke-width', 2)
          .attr('stroke-dasharray', item.dash);
      }
      legend.append('text')
        .attr('x', x + (item.type === 'rect' ? 20 : 30))
        .attr('y', 27)
        .attr('fill', 'rgba(255, 255, 255, 0.7)')
        .attr('font-size', '10px')
        .attr('font-weight', 'bold')
        .text(item.label);
    });

  }, [data]);

  return (
    <div className="relative w-full h-[600px] bg-[#1a1a1a] rounded-xl border border-slate-800 overflow-hidden shadow-2xl">
      <svg
        ref={svgRef}
        viewBox="0 0 800 600"
        className="w-full h-full cursor-move"
      />
    </div>
  );
};
