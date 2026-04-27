import React, { useState, useMemo } from 'react';
import { Wind, MapPin, Zap, Shield, Activity, Info, RefreshCw, AlertTriangle, CheckCircle, Gauge, Power, PowerOff } from 'lucide-react';
import { optimizeGrid, Node, GridResult } from './algorithms';
import { GridVisualization } from './components/GridVisualization';
import { motion, AnimatePresence } from 'motion/react';

const INITIAL_TURBINES: Node[] = [
  { id: 'Turbine-1', type: 'turbine', x: 250, y: 150, capacity: 8 },
  { id: 'Turbine-2', type: 'turbine', x: 550, y: 150, capacity: 12 },
  { id: 'Turbine-3', type: 'turbine', x: 400, y: 100, capacity: 10 },
];

const INITIAL_CITIES: Node[] = [
  { id: 'City-1', type: 'city', x: 150, y: 350, demand: 1 },
  { id: 'City-2', type: 'city', x: 350, y: 350, demand: 1 },
  { id: 'City-3', type: 'city', x: 500, y: 350, demand: 1 },
  { id: 'City-4', type: 'city', x: 650, y: 350, demand: 1 },
  { id: 'City-5', type: 'city', x: 550, y: 500, demand: 1 },
  { id: 'City-6', type: 'city', x: 350, y: 500, demand: 1 },
];

export default function App() {
  const [turbines, setTurbines] = useState<Node[]>(INITIAL_TURBINES);
  const [cities, setCities] = useState<Node[]>(INITIAL_CITIES);
  const [seed, setSeed] = useState(0);

  const result = useMemo(() => {
    return optimizeGrid(turbines, cities, seed);
  }, [turbines, cities, seed]);

  const handleNodeDrag = (id: string, x: number, y: number) => {
    setTurbines(prev => prev.map(t => t.id === id ? { ...t, x, y } : t));
    setCities(prev => prev.map(c => c.id === id ? { ...c, x, y } : c));
  };

  const handleNodeToggle = (id: string) => {
    setTurbines(prev => prev.map(t => t.id === id ? { ...t, isActive: t.isActive === false ? true : false } : t));
  };

  const handleRefresh = () => setSeed(s => s + 1);

  const updateTurbineCapacity = (id: string, newCapacity: number) => {
    setTurbines(prev => prev.map(t => t.id === id ? { ...t, capacity: newCapacity } : t));
  };

  const updateCityDemand = (id: string, newDemand: number) => {
    setCities(prev => prev.map(c => c.id === id ? { ...c, demand: newDemand } : c));
  };

  return (
    <div className="min-h-screen bg-[#121212] text-slate-100 font-sans p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
              <Zap className="w-8 h-8 text-amber-500 fill-amber-500" />
              Green Energy Grid Optimizer
            </h1>
            <p className="text-slate-400 mt-1">
              Network map — turbines, cities and cables (Drag nodes to reposition • Click turbines to simulate failure)
            </p>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex gap-6">
              {turbines.map(t => (
                <div key={t.id} className="flex flex-col">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1">
                    {t.id.replace('Turbine-', 'T')} Capacity
                    {t.isActive === false && <AlertTriangle className="w-2.5 h-2.5 text-red-500" />}
                  </label>
                  <div className="flex items-center gap-3">
                    <input 
                      type="range" 
                      min="1" 
                      max="20" 
                      value={t.capacity || 4} 
                      onChange={(e) => updateTurbineCapacity(t.id, parseInt(e.target.value))}
                      disabled={t.isActive === false}
                      className={`w-24 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer ${t.isActive === false ? 'opacity-30 cursor-not-allowed' : 'accent-emerald-500'}`}
                    />
                    <span className={`text-xs font-bold ${t.isActive === false ? 'text-slate-600 line-through' : 'text-emerald-400'} w-4`}>{t.capacity || 4}</span>
                  </div>
                </div>
              ))}
            </div>
            <button 
              onClick={handleRefresh}
              className="p-2 hover:bg-slate-800 rounded-full transition-colors border border-slate-800"
              title="Refresh Critical Cities"
            >
              <RefreshCw className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Visualization */}
          <div className="lg:col-span-2 space-y-4">
            <GridVisualization 
              data={result} 
              onNodeDrag={handleNodeDrag}
              onNodeToggle={handleNodeToggle}
            />
            
            {/* Algorithm Info */}
            <div className="bg-[#1e1e1e] p-6 rounded-2xl border border-slate-800 shadow-sm space-y-4">
              <h2 className="text-lg font-bold flex items-center gap-2 text-white">
                <Info className="w-5 h-5 text-blue-400" />
                Algorithm Complexity Analysis
              </h2>
              <div className="prose prose-invert max-w-none text-sm text-slate-400">
                <p>
                  This hybrid approach combines <strong>Esau-Williams Heuristic</strong> for CMSF and <strong>Tarjan's Algorithm</strong> for bridge detection.
                </p>
                <div className="bg-[#121212] p-4 rounded-lg border border-slate-800 font-mono text-xs text-slate-300">
                  {`/**
 * Complexity Comparison:
 * 
 * Kruskal's MST: O(E log V)
 * - Efficient for simple connectivity.
 * - Fails to handle capacity bottlenecks.
 * 
 * Hybrid CMSF (Esau-Williams): O(V^2 log V)
 * - Necessary trade-off for capacity constraints.
 * - Iteratively calculates 'Savings' to optimize local sub-trees.
 * - Tarjan's Phase: O(V + E) for bridge detection.
 * - Total: O(V^2 log V) dominated by the savings calculation and sorting.
 */`}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Stats */}
          <div className="space-y-6">
            {/* City Demands Card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#1e1e1e] p-6 rounded-2xl border border-slate-800 shadow-sm space-y-6"
            >
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-indigo-400" />
                  City Energy Demands
                </h2>
                <button 
                  onClick={() => setCities(INITIAL_CITIES)}
                  className="text-[10px] uppercase font-bold text-slate-500 hover:text-indigo-400 transition-colors"
                >
                  Reset All
                </button>
              </div>
              
              <div className="grid grid-cols-1 gap-5">
                {cities.map(c => (
                  <div key={c.id} className="group space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-400 group-hover:text-slate-200 transition-colors">
                        {c.id.replace('City-', 'METROPOLIS ')}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-500">DEMAND:</span>
                        <span className="text-xs font-mono font-bold text-indigo-400">
                          {c.demand || 1} <span className="text-[10px] text-slate-600">MW</span>
                        </span>
                      </div>
                    </div>
                    <div className="relative flex items-center gap-3">
                      <div className="absolute -left-1 w-1 h-3 bg-indigo-500 rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity" />
                      <input 
                        type="range" 
                        min="1" 
                        max="10" 
                        step="1"
                        value={c.demand || 1} 
                        onChange={(e) => updateCityDemand(c.id, parseInt(e.target.value))}
                        className="flex-1 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:bg-slate-700 transition-colors"
                      />
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-slate-500 mt-4 leading-relaxed italic">
                * Adjusting demand may trigger grid reconfiguration or cause turbine overloads if capacity limits are exceeded.
              </p>
            </motion.div>

            {/* Summary Card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#1e1e1e] p-6 rounded-2xl border border-slate-800 shadow-sm space-y-6"
            >
              <h2 className="text-xl font-bold text-white">Grid Summary</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-[#121212] rounded-xl border border-slate-800">
                  <div className="flex items-center gap-3">
                    <Activity className="w-5 h-5 text-emerald-400" />
                    <span className="text-sm font-medium text-slate-300">Total Cable Cost</span>
                  </div>
                  <span className="font-bold text-white">{result.totalCost.toFixed(0)} units</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-[#121212] rounded-xl border border-slate-800">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-orange-400" />
                    <span className="text-sm font-medium text-slate-300">Redundant Links</span>
                  </div>
                  <span className="font-bold text-white">{result.redundantEdges.length}</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-[#121212] rounded-xl border border-slate-800">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-indigo-400" />
                    <span className="text-sm font-medium text-slate-300">Met Demand</span>
                  </div>
                  <span className="font-bold text-white">
                    {cities.filter(c => [...result.edges, ...result.redundantEdges].some(e => e.target === c.id)).reduce((sum, c) => sum + (c.demand || 1), 0)} / {cities.reduce((sum, c) => sum + (c.demand || 1), 0)}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest text-center py-2 border-y border-slate-800/50">Turbine Utilization</h3>
                <div className="grid grid-cols-1 gap-3">
                  {turbines.map(t => {
                    const id = t.id;
                    const isActive = t.isActive !== false;
                    const cap = t.capacity || 4;
                    const primaryLoad = Number(result.utilization[id] || 0);
                    const backupLoad = Number(result.backupUtilization[id] || 0);
                    const totalLoad = primaryLoad + backupLoad;
                    const isOverloaded = totalLoad > cap;

                    return (
                      <div key={id} className={`space-y-1 p-2 rounded-lg transition-opacity ${isActive ? 'opacity-100' : 'opacity-40'}`}>
                        <div className="flex justify-between items-start text-sm mb-1">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleNodeToggle(id)}
                              className={`p-1.5 rounded-md transition-colors border ${
                                isActive 
                                  ? 'bg-emerald-900/20 border-emerald-800 text-emerald-400 hover:bg-emerald-800/40' 
                                  : 'bg-red-900/20 border-red-800 text-red-400 hover:bg-red-800/40'
                              }`}
                              title={isActive ? "Simulate Failure" : "Restore Turbine"}
                            >
                              {isActive ? <Power className="w-3.5 h-3.5" /> : <PowerOff className="w-3.5 h-3.5" />}
                            </button>
                            <div className="flex flex-col">
                              <span className={`font-medium ${isActive ? 'text-slate-200' : 'text-slate-500 italic'}`}>
                                {id.replace('Turbine-', 'T')}
                              </span>
                              {isActive && isOverloaded && (
                                <span className="text-[10px] font-bold text-red-400 uppercase tracking-tighter">
                                  Overloaded
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="font-bold block text-slate-100">
                              {isActive ? (
                                <>
                                  {primaryLoad} <span className="text-slate-500 font-normal">+{backupLoad}</span> / {cap}
                                </>
                              ) : (
                                <span className="text-red-500 font-black text-[10px] tracking-widest">OFFLINE</span>
                              )}
                            </span>
                          </div>
                        </div>
                        <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden flex shadow-inner">
                          {isActive ? (
                            <>
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${(primaryLoad / Math.max(cap, totalLoad)) * 100}%` }}
                                className={`h-full ${primaryLoad >= cap ? 'bg-amber-500' : 'bg-emerald-500'} shadow-lg`}
                              />
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${(backupLoad / Math.max(cap, totalLoad)) * 100}%` }}
                                className={`h-full ${isOverloaded ? 'bg-red-500' : 'bg-orange-500'} opacity-60`}
                                style={{ backgroundImage: 'linear-gradient(45deg, rgba(255,255,255,.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,.15) 50%, rgba(255,255,255,.15) 75%, transparent 75%, transparent)' , backgroundSize: '1rem 1rem'}}
                              />
                            </>
                          ) : (
                            <div className="w-full h-full bg-red-950/30 flex items-center justify-center">
                              <div className="w-full h-full bg-[repeating-linear-gradient(45deg,#1e1e1e,#1e1e1e_10px,#000_10px,#000_20px)] opacity-20" />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>

            {/* Detailed Turbine Status */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-[#1e1e1e] p-6 rounded-2xl border border-slate-800 shadow-sm space-y-6"
            >
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Gauge className="w-5 h-5 text-emerald-400" />
                Turbine Status Details
              </h2>

              <div className="space-y-4">
                {turbines.map(t => {
                  const id = t.id;
                  const cap = t.capacity || 4;
                  const primaryLoad = Number(result.utilization[id] || 0);
                  const backupLoad = Number(result.backupUtilization[id] || 0);
                  const totalLoad = primaryLoad + backupLoad;
                  
                  let status = 'Optimal';
                  let statusColor = 'text-emerald-400';
                  let StatusIcon = CheckCircle;
                  let bgColor = 'bg-emerald-900/20';
                  let borderColor = 'border-emerald-800/30';

                  if (totalLoad > cap) {
                    status = 'Overloaded';
                    statusColor = 'text-red-400';
                    StatusIcon = AlertTriangle;
                    bgColor = 'bg-red-900/20';
                    borderColor = 'border-red-800/30';
                  } else if (totalLoad === cap) {
                    status = 'At Capacity';
                    statusColor = 'text-amber-400';
                    StatusIcon = Zap;
                    bgColor = 'bg-amber-900/20';
                    borderColor = 'border-amber-800/30';
                  } else if (totalLoad >= cap * 0.8) {
                    status = 'Near Capacity';
                    statusColor = 'text-blue-400';
                    StatusIcon = Activity;
                    bgColor = 'bg-blue-900/20';
                    borderColor = 'border-blue-800/30';
                  }

                  return (
                    <div key={id} className={`p-4 rounded-xl border ${borderColor} ${bgColor} space-y-3`}>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-lg text-white">{id.replace('Turbine-', 'T')}</span>
                          <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${borderColor} ${statusColor}`}>
                            <StatusIcon className="w-3 h-3" />
                            {status}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-0.5">
                          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Load</p>
                          <p className="text-lg font-mono text-white">
                            {primaryLoad} <span className="text-xs text-slate-400 font-sans">Primary</span>
                          </p>
                          {backupLoad > 0 && (
                            <p className="text-xs text-blue-400 font-sans">
                              +{backupLoad} <span className="text-[10px] opacity-70">Backup</span>
                            </p>
                          )}
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Capacity</p>
                          <p className="text-lg font-mono text-white">{cap}</p>
                          <p className="text-[10px] text-slate-400">Cities/Units</p>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-800/50">
                        <div className="flex justify-between text-[10px] text-slate-500 font-bold uppercase mb-1">
                          <span>Utilization</span>
                          <span className={statusColor}>{Math.round((totalLoad / cap) * 100)}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, (totalLoad / cap) * 100)}%` }}
                            className={`h-full ${statusColor.replace('text-', 'bg-')}`}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>

            {/* Redundancy Details */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#1e1e1e] p-6 rounded-2xl border border-slate-800 shadow-sm"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold flex items-center gap-2 text-white">
                  <Shield className="w-5 h-5 text-orange-400" />
                  Failover Redundancy
                </h3>
                <span className="text-[10px] bg-orange-900/30 text-orange-400 border border-orange-800 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">
                  Backup Active
                </span>
              </div>

              <div className="space-y-3">
                {result.redundantEdges.length > 0 ? (
                  result.redundantEdges.map((edge, idx) => {
                    const targetCity = cities.find(c => c.id === edge.target);
                    const sourceTurbine = turbines.find(t => t.id === edge.source);
                    
                    return (
                      <motion.div 
                        key={idx}
                        initial={{ x: -10, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: idx * 0.1 }}
                        className="group relative overflow-hidden text-xs p-4 bg-orange-950/10 hover:bg-orange-950/20 rounded-xl border border-orange-800/20 hover:border-orange-700/40 transition-all"
                      >
                        <div className="flex justify-between items-center relative z-10">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <span className="font-black text-slate-100 text-sm tracking-tight">{edge.target.replace('City-', 'METROPOLIS-')}</span>
                              <span className="text-[10px] font-bold text-orange-500 bg-orange-900/20 px-1.5 rounded-sm">★ CRITICAL</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-500">
                              <Zap className="w-3 h-3" />
                              <span>Current Backup Source: </span>
                              <span className="font-mono text-orange-400/80 font-bold">{edge.source.replace('Turbine-', 'CORE-')}</span>
                            </div>
                          </div>
                          
                          <div className="flex flex-col items-end gap-1">
                            <div className="bg-orange-500/10 border border-orange-500/20 text-orange-400 px-2 py-1 rounded text-[10px] font-bold font-mono">
                              {edge.weight} KM PATH
                            </div>
                            <div className="text-[9px] text-slate-600 font-medium">REDUNDANT LINK</div>
                          </div>
                        </div>

                        {/* Visual Connector decoration */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 -mr-16 -mt-16 rounded-full blur-2xl" />
                      </motion.div>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center bg-[#121212] rounded-xl border border-dashed border-slate-800">
                    <AlertTriangle className="w-8 h-8 text-slate-700 mb-2" />
                    <p className="text-xs text-slate-500 max-w-[200px]">
                      No failover paths allocated. Increase turbine capacity to enable redundant links.
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800/50">
                <p className="text-[10px] text-slate-500 leading-relaxed italic">
                  * Redundant links are automatically activated for cities marked with ★ if spare capacity permits.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
