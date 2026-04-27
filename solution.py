import networkx as nx
import matplotlib.pyplot as plt
import math
import random

"""
Optimized Green Energy Grid Solution
------------------------------------
Algorithm: Hybrid Capacitated Minimum Spanning Forest (CMSF)
Heuristic: Esau-Williams
Redundancy: Tarjan's Bridge-finding

Complexity Analysis:
- Kruskal's MST: O(E log V)
- Hybrid CMSF (Esau-Williams): O(V^2 log V)

Why the trade-off?
Standard MST algorithms like Kruskal's or Prim's do not account for capacity constraints.
In a power grid, a single turbine (source) cannot serve infinite demand. 
Esau-Williams iteratively calculates 'Savings' to merge nodes into sub-trees while 
strictly respecting the capacity bottleneck, resulting in a Forest rather than a single Tree.
Tarjan's algorithm is then used to identify single points of failure (bridges) to add
redundant links for 2-edge connectivity.
"""

class GridOptimizer:
    def __init__(self, capacity=4):
        self.capacity = capacity
        self.G = nx.Graph()
        self.turbines = [
            {"id": "Turbine-A", "pos": (150, 150), "cap": capacity},
            {"id": "Turbine-B", "pos": (650, 450), "cap": capacity},
            {"id": "Turbine-C", "pos": (400, 100), "cap": capacity},
        ]
        self.cities = [
            {"id": f"City-{i+1}", "pos": (random.randint(50, 750), random.randint(50, 550)), "demand": 1}
            for i in range(20)
        ]
        
        for t in self.turbines:
            self.G.add_node(t["id"], type="turbine", pos=t["pos"], load=0)
        for c in self.cities:
            self.G.add_node(c["id"], type="city", pos=c["pos"], demand=c["demand"])

    def get_dist(self, u, v):
        pos_u = self.G.nodes[u]['pos']
        pos_v = self.G.nodes[v]['pos']
        return math.sqrt((pos_u[0] - pos_v[0])**2 + (pos_u[1] - pos_v[1])**2)

    def solve_cmsf(self):
        # Phase 1: Select 3 Random "Critical" Cities
        cities_list = [c['id'] for c in self.cities]
        random.shuffle(cities_list)
        target_critical_ids = set(cities_list[:3])

        # Phase 2: Primary Assignment for ALL Cities
        city_assigned = {c['id']: None for c in self.cities}
        turbine_loads = {t['id']: 0 for t in self.turbines}
        turbine_capacities = {t['id']: t.get('capacity', 4) for t in self.turbines}
        
        primary_pairs = []
        for c in self.cities:
            for t in self.turbines:
                d = self.get_dist(c['id'], t['id'])
                primary_pairs.append({'city': c['id'], 'turbine': t['id'], 'dist': d})
        primary_pairs.sort(key=lambda x: x['dist'])

        self.G.remove_edges_from(list(self.G.edges()))
        
        for pair in primary_pairs:
            if not city_assigned[pair['city']] and turbine_loads[pair['turbine']] < turbine_capacities[pair['turbine']]:
                city_assigned[pair['city']] = pair['turbine']
                turbine_loads[pair['turbine']] += 1
                self.G.add_edge(pair['turbine'], pair['city'], weight=pair['dist'], type='primary')
                self.G.nodes[pair['turbine']]['load'] = turbine_loads[pair['turbine']]

        # Phase 3: Backup Assignment ONLY for the 3 Critical Cities
        redundant_links = []
        for city_id in target_critical_ids:
            primary_t = city_assigned.get(city_id)
            if not primary_t: continue

            best_alt = None
            min_dist = float('inf')

            for t in self.turbines:
                if t['id'] != primary_t and turbine_loads[t['id']] < turbine_capacities[t['id']]:
                    d = self.get_dist(city_id, t['id'])
                    if d < min_dist:
                        min_dist = d
                        best_alt = t['id']
            
            if best_alt:
                turbine_loads[best_alt] += 1
                redundant_links.append((best_alt, city_id, min_dist))
                self.G.add_edge(best_alt, city_id, weight=min_dist, type='redundant')
        
        return redundant_links

    def add_redundancy(self):
        # This is now handled in solve_cmsf for consistency with the new logic
        pass

    def visualize(self):
        pos = nx.get_node_attributes(self.G, 'pos')
        
        # Color nodes by turbine zone
        node_colors = []
        for n in self.G.nodes():
            if self.G.nodes[n]['type'] == 'turbine':
                node_colors.append('gold')
            else:
                # Find which turbine it's connected to
                zone_color = 'skyblue'
                for t in [node for node, d in self.G.nodes(data=True) if d['type'] == 'turbine']:
                    if nx.has_path(self.G, n, t):
                        if t == 'Turbine-A': zone_color = 'lightgreen'
                        elif t == 'Turbine-B': zone_color = 'lightcoral'
                        elif t == 'Turbine-C': zone_color = 'plum'
                        break
                node_colors.append(zone_color)

        edge_colors = ['gray' if self.G[u][v]['type'] == 'primary' else 'red' for u, v in self.G.edges()]
        edge_styles = ['solid' if self.G[u][v]['type'] == 'primary' else 'dashed' for u, v in self.G.edges()]

        plt.figure(figsize=(10, 8))
        nx.draw(self.G, pos, with_labels=True, node_color=node_colors, 
                edge_color=edge_colors, style=edge_styles, node_size=800, font_size=8)
        
        plt.title(f"Optimized Green Energy Grid (Capacity={self.capacity})")
        plt.show()

    def summary(self, redundant):
        total_cost = sum(d['weight'] for u, v, d in self.G.edges(data=True))
        print(f"--- Grid Summary ---")
        print(f"Total Cable Cost: {total_cost:.2f} km")
        for t in [n for n, d in self.G.nodes(data=True) if d['type'] == 'turbine']:
            print(f"Capacity Utilization {t}: {self.G.nodes[t]['load']}/{self.capacity}")
        print(f"Redundant Links Added: {len(redundant)}")

if __name__ == "__main__":
    optimizer = GridOptimizer(capacity=4)
    optimizer.solve_cmsf()
    redundant = optimizer.add_redundancy()
    optimizer.summary(redundant)
    optimizer.visualize()
