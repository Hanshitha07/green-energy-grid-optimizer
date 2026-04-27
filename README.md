# 🌱 Green Energy Grid Optimizer

> Optimized Energy Distribution using Hybrid CMSF (Esau-Williams) + Tarjan’s Bridge Detection

---

## 📌 Overview

The **Green Energy Grid Optimizer** is an advanced graph-based system designed to optimize energy distribution from offshore wind turbines to coastal cities.

Unlike traditional Minimum Spanning Tree (MST) approaches, this project uses a **Hybrid Capacitated Minimum Spanning Forest (CMSF)** to:

- Handle **capacity constraints**
- Minimize **cable cost**
- Ensure **grid reliability using redundancy**

---

## 🚀 Features

- ⚡ Capacitated Energy Distribution (no overload allowed)
- 🧠 Hybrid Algorithm (Esau-Williams + Tarjan)
- 🔍 Failure Detection (bridge edges)
- 🔁 Automatic Backup Links
- 📊 Real-time Grid Metrics
- 🎨 Interactive Visualization

---

## 🧠 Algorithms Used

### 1. Esau-Williams Heuristic (CMSF)

- Start with **star topology** (each city connected to nearest turbine)
- Compute savings:

  Savings = Cost(city → turbine) - Cost(city → another city)

- Merge nodes only if:

  current_load + demand ≤ capacity

- Builds a **Capacitated Minimum Spanning Forest**

---

### 2. Tarjan’s Bridge-Finding Algorithm

- Uses DFS to detect **critical edges (bridges)**
- Identifies **single points of failure**
- Adds **redundant backup connections**

---

## ⚙️ Tech Stack

### Backend / Algorithms
- Python
- NetworkX

### Visualization
- Matplotlib

### Frontend
- React (TypeScript)
- Vite

---

## 📊 System Model

### Turbines (Sources)
- 2–3 nodes
- Fixed capacity (e.g., 10–12 units)

### Cities (Sinks)
- 8–10 nodes
- Demand per city (1–6 units)

---

## 🔄 Workflow

1. Initialize star topology
2. Apply Esau-Williams heuristic
3. Build capacitated forest
4. Run Tarjan’s algorithm
5. Add redundancy links

---

## 📈 Output Metrics

- 🔌 Total Cable Cost
- ⚡ Turbine Utilization
- ✅ Demand Satisfaction
- 🔁 Redundant Links Count
- ⚠️ Critical Cities

---

## 🎨 Visualization

- Color-coded turbine zones
- Solid edges → Primary links
- Dashed edges → Backup links
- Interactive network layout

---

## 🧪 Complexity Analysis

| Algorithm | Complexity | Limitation |
|----------|----------|------------|
| Kruskal / Prim | O(E log V) | No capacity constraints |
| Hybrid CMSF | O(V² log V) | Handles real-world constraints |

**Why higher complexity?**

- Repeated savings calculations  
- Capacity validation  
- Subtree merging  

Trade-off = More computation, but realistic solution

---

## ⚠️ Constraints

- No simple MST allowed
- Every edge must satisfy:

```python
if current_load + demand <= capacity:
    allow_connection()
