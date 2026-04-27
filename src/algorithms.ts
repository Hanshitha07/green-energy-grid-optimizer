import { Type } from "@google/genai";

export interface Node {
  id: string;
  type: 'turbine' | 'city';
  x: number;
  y: number;
  demand?: number;
  capacity?: number;
  isActive?: boolean;
}

export interface Edge {
  source: string;
  target: string;
  weight: number;
  type: 'primary' | 'redundant';
}

export interface GridResult {
  nodes: Node[];
  edges: Edge[];
  allPotentialEdges: Edge[];
  totalCost: number;
  utilization: Record<string, number>;
  backupUtilization: Record<string, number>;
  redundantEdges: Edge[];
  bridges: [string, string][];
  targetCriticalCityIds: Set<string>;
}

export function optimizeGrid(
  turbines: Node[],
  cities: Node[],
  seed: number = 0
): GridResult {
  const nodes = [...turbines, ...cities];
  const primaryEdges: Edge[] = [];
  const redundantEdges: Edge[] = [];
  const allPotentialEdges: Edge[] = [];
  
  const activeTurbines = turbines.filter(t => t.isActive !== false);
  
  const turbineLoads: Record<string, number> = {};
  const turbineCapacities: Record<string, number> = {};
  activeTurbines.forEach(t => {
    turbineLoads[t.id] = 0;
    turbineCapacities[t.id] = t.capacity || 4;
  });

  const cityAssigned: Record<string, string | null> = {};
  cities.forEach(c => cityAssigned[c.id] = null);

  // 1. Select 3 Random "Critical" Cities
  const seededRandom = (s: number) => {
    const x = Math.sin(s) * 10000;
    return x - Math.floor(x);
  };

  const shuffledCities = [...cities].sort((a, b) => {
    const r1 = seededRandom(seed + cities.indexOf(a));
    const r2 = seededRandom(seed + cities.indexOf(b));
    return r1 - r2;
  });

  const targetCriticalCityIds = new Set(shuffledCities.slice(0, 3).map(c => c.id));

  // Collect all potential edges for visualization
  cities.forEach(c => {
    activeTurbines.forEach(t => {
      const dist = Math.sqrt(Math.pow(c.x - t.x, 2) + Math.pow(c.y - t.y, 2));
      allPotentialEdges.push({ source: t.id, target: c.id, weight: Math.round(dist / 40), type: 'primary' });
    });
  });

  // 2. Phase 1: Primary Assignment for ALL Cities
  const primaryPairs: { cityNode: Node, turbine: string, dist: number }[] = [];
  cities.forEach(c => {
    activeTurbines.forEach(t => {
      const dist = Math.sqrt(Math.pow(c.x - t.x, 2) + Math.pow(c.y - t.y, 2));
      primaryPairs.push({ cityNode: c, turbine: t.id, dist });
    });
  });
  primaryPairs.sort((a, b) => a.dist - b.dist);

  primaryPairs.forEach(pair => {
    const cityDemand = pair.cityNode.demand || 1;
    if (!cityAssigned[pair.cityNode.id] && (turbineLoads[pair.turbine] + cityDemand) <= turbineCapacities[pair.turbine]) {
      cityAssigned[pair.cityNode.id] = pair.turbine;
      turbineLoads[pair.turbine] += cityDemand;
      primaryEdges.push({
        source: pair.turbine,
        target: pair.cityNode.id,
        weight: Math.round(pair.dist / 40),
        type: 'primary'
      });
    }
  });

  // 3. Phase 2: Backup Assignment ONLY for the 3 Critical Cities
  const criticalCities = cities.filter(c => targetCriticalCityIds.has(c.id));
  criticalCities.forEach(city => {
    const primaryTurbineId = cityAssigned[city.id];
    if (!primaryTurbineId) return;

    const cityDemand = city.demand || 1;
    let bestAltTurbine = '';
    let minDist = Infinity;

    activeTurbines.forEach(t => {
      if (t.id !== primaryTurbineId && (turbineLoads[t.id] + cityDemand) <= turbineCapacities[t.id]) {
        const dist = Math.sqrt(Math.pow(city.x - t.x, 2) + Math.pow(city.y - t.y, 2));
        if (dist < minDist) {
          minDist = dist;
          bestAltTurbine = t.id;
        }
      }
    });

    if (bestAltTurbine) {
      turbineLoads[bestAltTurbine] += cityDemand;
      redundantEdges.push({
        source: bestAltTurbine,
        target: city.id,
        weight: Math.round(minDist / 40),
        type: 'redundant'
      });
    }
  });

  // 4. Tarjan's Bridge Finding on Primary Grid
  const adj: Record<string, string[]> = {};
  nodes.forEach(n => adj[n.id] = []);
  primaryEdges.forEach(e => {
    adj[e.source].push(e.target);
    adj[e.target].push(e.source);
  });

  const bridges: [string, string][] = [];
  const disc: Record<string, number> = {};
  const low: Record<string, number> = {};
  let time = 0;

  function findBridges(u: string, p: string | null) {
    disc[u] = low[u] = ++time;
    for (const v of adj[u]) {
      if (v === p) continue;
      if (disc[v]) {
        low[u] = Math.min(low[u], disc[v]);
      } else {
        findBridges(v, u);
        low[u] = Math.min(low[u], low[v]);
        if (low[v] > disc[u]) {
          bridges.push([u, v]);
        }
      }
    }
  }

  nodes.forEach(n => {
    if (!disc[n.id] && (n.type === 'turbine' || cityAssigned[n.id])) {
      findBridges(n.id, null);
    }
  });

  const totalCost = [...primaryEdges, ...redundantEdges].reduce((acc, e) => acc + e.weight, 0);

  // For the UI, we'll split the loads back into primary and backup for the visualization
  // But internally they both consumed the same 'capacity'
  const finalPrimaryLoads: Record<string, number> = {};
  const finalBackupLoads: Record<string, number> = {};
  activeTurbines.forEach(t => {
    finalPrimaryLoads[t.id] = primaryEdges
      .filter(e => e.source === t.id)
      .reduce((sum, e) => sum + (nodes.find(n => n.id === e.target)?.demand || 1), 0);
    finalBackupLoads[t.id] = redundantEdges
      .filter(e => e.source === t.id)
      .reduce((sum, e) => sum + (nodes.find(n => n.id === e.target)?.demand || 1), 0);
  });

  return {
    nodes,
    edges: primaryEdges,
    allPotentialEdges,
    totalCost,
    utilization: finalPrimaryLoads,
    backupUtilization: finalBackupLoads,
    redundantEdges,
    bridges,
    targetCriticalCityIds
  };
}




