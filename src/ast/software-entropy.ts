export interface ModuleEntropyMetric {
  filePath: string;
  shannonEntropy: number; // H(X) = - sum(p * log2(p))
  instability: number;    // I = Ce / (Ca + Ce)
  cyclomaticComplexity: number;
  healthStatus: 'HEALTHY' | 'MODERATE_RISK' | 'CRITICAL_ENTROPY';
}

export class SoftwareEntropyAnalyzer {
  /**
   * Calculates Shannon token entropy H(X) from source code text
   */
  public static calculateTokenEntropy(sourceCode: string): number {
    if (!sourceCode || sourceCode.trim().length === 0) return 0;

    const tokens = sourceCode.match(/\b\w+\b|[^\s\w]/g) || [];
    if (tokens.length === 0) return 0;

    const freqMap = new Map<string, number>();
    for (const token of tokens) {
      freqMap.set(token, (freqMap.get(token) || 0) + 1);
    }

    const total = tokens.length;
    let entropy = 0.0;

    for (const count of freqMap.values()) {
      const p = count / total;
      if (p > 0) {
        entropy -= p * Math.log2(p);
      }
    }

    return parseFloat(entropy.toFixed(4));
  }

  /**
   * Calculates Martin's Package Instability I = Ce / (Ca + Ce)
   * Ce: Efferent Coupling (outgoing dependencies)
   * Ca: Afferent Coupling (incoming dependencies)
   */
  public static calculateInstability(efferentCoupling: number, afferentCoupling: number): number {
    const total = efferentCoupling + afferentCoupling;
    if (total === 0) return 0;
    return parseFloat((efferentCoupling / total).toFixed(4));
  }

  /**
   * Evaluates overall codebase module entropy and health
   */
  public static evaluateModule(
    filePath: string,
    sourceCode: string,
    efferentCoupling: number,
    afferentCoupling: number,
    cyclomaticComplexity: number
  ): ModuleEntropyMetric {
    const shannonEntropy = this.calculateTokenEntropy(sourceCode);
    const instability = this.calculateInstability(efferentCoupling, afferentCoupling);

    let healthStatus: 'HEALTHY' | 'MODERATE_RISK' | 'CRITICAL_ENTROPY' = 'HEALTHY';
    if (shannonEntropy > 6.0 || cyclomaticComplexity > 15) {
      healthStatus = 'CRITICAL_ENTROPY';
    } else if (shannonEntropy > 4.5 || cyclomaticComplexity > 8) {
      healthStatus = 'MODERATE_RISK';
    }

    return {
      filePath,
      shannonEntropy,
      instability,
      cyclomaticComplexity,
      healthStatus,
    };
  }
}
