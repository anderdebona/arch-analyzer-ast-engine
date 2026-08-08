import { ClassAnalysis } from './ast-parser.js';

export interface CKMetricsResult {
  className: string;
  wmc: number; // Weighted Methods per Class
  cbo: number; // Coupling Between Objects
  lcom4: number; // Lack of Cohesion in Methods (LCOM4)
  rfc: number; // Response for a Class
  cyclomaticComplexity: number;
  cohesionStatus: 'HIGH_COHESION' | 'MODERATE_COHESION' | 'LOW_COHESION_GOD_CLASS';
}

export class CKMetricsCalculator {
  /**
   * Calculates LCOM4 (Lack of Cohesion in Methods - Henderson-Sellers / Hitz-Montazeri variant)
   * LCOM4 is the number of connected components in an undirected graph where:
   * - Nodes = Methods in the class
   * - Edges = Connected if methods share at least one field or invoke each other
   */
  public static calculateLCOM4(cls: ClassAnalysis): number {
    const methods = cls.methods;
    if (methods.length <= 1) return 1;

    // Disjoint Set (Union-Find) for connected components
    const parent: Record<string, string> = {};
    methods.forEach((m) => (parent[m] = m));

    const find = (i: string): string => {
      if (parent[i] === i) return i;
      return (parent[i] = find(parent[i]));
    };

    const union = (i: string, j: string) => {
      const rootI = find(i);
      const rootJ = find(j);
      if (rootI !== rootJ) {
        parent[rootI] = rootJ;
      }
    };

    // Connect methods if they access the same instance variable
    for (let i = 0; i < methods.length; i++) {
      for (let j = i + 1; j < methods.length; j++) {
        const m1 = methods[i];
        const m2 = methods[j];
        const fields1 = cls.methodFieldAccessMap[m1] || [];
        const fields2 = cls.methodFieldAccessMap[m2] || [];

        const sharedField = fields1.some((f) => fields2.includes(f));
        if (sharedField) {
          union(m1, m2);
        }
      }
    }

    // Count unique roots
    const uniqueRoots = new Set(methods.map((m) => find(m)));
    return uniqueRoots.size;
  }

  public static calculateMetrics(cls: ClassAnalysis): CKMetricsResult {
    const wmc = cls.methods.length;
    const cbo = cls.dependencies.length;
    const lcom4 = this.calculateLCOM4(cls);
    const rfc = cls.methods.length + cls.dependencies.length;
    const cyclomaticComplexity = cls.cyclomaticComplexity;

    let cohesionStatus: 'HIGH_COHESION' | 'MODERATE_COHESION' | 'LOW_COHESION_GOD_CLASS' = 'HIGH_COHESION';
    if (lcom4 === 1) {
      cohesionStatus = 'HIGH_COHESION';
    } else if (lcom4 === 2) {
      cohesionStatus = 'MODERATE_COHESION';
    } else {
      cohesionStatus = 'LOW_COHESION_GOD_CLASS';
    }

    return {
      className: cls.name,
      wmc,
      cbo,
      lcom4,
      rfc,
      cyclomaticComplexity,
      cohesionStatus,
    };
  }
}
