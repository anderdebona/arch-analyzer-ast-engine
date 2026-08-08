export interface DependencyNode {
  id: string;
  dependencies: string[];
}

export interface CycleResult {
  hasCycles: boolean;
  stronglyConnectedComponents: string[][];
  circularDependencies: string[][];
}

export class TarjanCycleDetector {
  private index = 0;
  private stack: string[] = [];
  private indices: Map<string, number> = new Map();
  private lowLinks: Map<string, number> = new Map();
  private onStack: Map<string, boolean> = new Map();
  private sccs: string[][] = [];

  public detectCycles(nodes: DependencyNode[]): CycleResult {
    const graph = new Map<string, string[]>();
    nodes.forEach((n) => graph.set(n.id, n.dependencies));

    this.index = 0;
    this.stack = [];
    this.indices.clear();
    this.lowLinks.clear();
    this.onStack.clear();
    this.sccs = [];

    nodes.forEach((n) => {
      if (!this.indices.has(n.id)) {
        this.strongConnect(n.id, graph);
      }
    });

    const circularDependencies = this.sccs.filter((scc) => scc.length > 1);

    return {
      hasCycles: circularDependencies.length > 0,
      stronglyConnectedComponents: this.sccs,
      circularDependencies,
    };
  }

  private strongConnect(nodeId: string, graph: Map<string, string[]>) {
    this.indices.set(nodeId, this.index);
    this.lowLinks.set(nodeId, this.index);
    this.index++;
    this.stack.push(nodeId);
    this.onStack.set(nodeId, true);

    const neighbors = graph.get(nodeId) || [];
    neighbors.forEach((neighbor) => {
      if (!this.indices.has(neighbor)) {
        this.strongConnect(neighbor, graph);
        this.lowLinks.set(
          nodeId,
          Math.min(this.lowLinks.get(nodeId)!, this.lowLinks.get(neighbor)!)
        );
      } else if (this.onStack.get(neighbor)) {
        this.lowLinks.set(
          nodeId,
          Math.min(this.lowLinks.get(nodeId)!, this.indices.get(neighbor)!)
        );
      }
    });

    if (this.lowLinks.get(nodeId) === this.indices.get(nodeId)) {
      const scc: string[] = [];
      let w: string;
      do {
        w = this.stack.pop()!;
        this.onStack.set(w, false);
        scc.push(w);
      } while (w !== nodeId);
      this.sccs.push(scc);
    }
  }
}
