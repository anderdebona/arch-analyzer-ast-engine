export interface CognitiveComplexityResult {
  functionName: string;
  cognitiveComplexity: number;
  cyclomaticComplexity: number;
  nestingPenaltySum: number;
  rating: 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH';
  breakdown: Array<{
    line: number;
    construct: string;
    nestingLevel: number;
    scoreAdded: number;
  }>;
}

export interface HalsteadMetricsResult {
  distinctOperators: number;
  distinctOperands: number;
  totalOperators: number;
  totalOperands: number;
  vocabulary: number;
  length: number;
  calculatedLength: number;
  volume: number;
  difficulty: number;
  effort: number;
  timeToImplementSeconds: number;
  estimatedBugs: number;
}

export class CognitiveHalsteadComplexityEngine {
  private operatorsList = new Set([
    '+', '-', '*', '/', '%', '=', '==', '===', '!=', '!==', '<', '>', '<=', '>=',
    '&&', '||', '!', '?', ':', '++', '--', '+=', '-=', '*=', '/=', '=>', 'return',
    'if', 'else', 'for', 'while', 'switch', 'case', 'catch', 'throw', 'new', 'typeof'
  ]);

  /**
   * Analyze cognitive complexity with nesting increments
   */
  public analyzeCognitiveComplexity(sourceCode: string): {
    overallCognitiveScore: number;
    functions: CognitiveComplexityResult[];
    maintainabilityIndex: number;
  } {
    const lines = sourceCode.split('\n');
    let currentNesting = 0;
    let totalScore = 0;
    const breakdown: CognitiveComplexityResult['breakdown'] = [];

    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*')) return;

      // Adjust nesting levels based on braces
      const openBraces = (line.match(/{/g) || []).length;
      const closeBraces = (line.match(/}/g) || []).length;

      // Check structural control flow that increments cognitive complexity
      const constructs = [
        { regex: /\b(if|else\s+if)\b/, name: 'conditional (if)' },
        { regex: /\b(for|while|do)\b/, name: 'loop (iteration)' },
        { regex: /\b(catch)\b/, name: 'exception handler (catch)' },
        { regex: /\b(switch)\b/, name: 'switch branch' },
        { regex: /\?.*:/, name: 'ternary operator' },
        { regex: /(&&|\|\|)/, name: 'logical conjunction' }
      ];

      for (const c of constructs) {
        if (c.regex.test(trimmed)) {
          const cost = 1 + currentNesting;
          totalScore += cost;
          breakdown.push({
            line: idx + 1,
            construct: c.name,
            nestingLevel: currentNesting,
            scoreAdded: cost
          });
        }
      }

      currentNesting = Math.max(0, currentNesting + openBraces - closeBraces);
    });

    const rating = totalScore <= 5 ? 'LOW' : totalScore <= 15 ? 'MODERATE' : totalScore <= 25 ? 'HIGH' : 'VERY_HIGH';
    
    // Cyclomatic approximation: conditionals + loops + 1
    const cyclomaticApprox = breakdown.length + 1;

    // Maintainability Index (MI) estimation: 171 - 5.2 * ln(Halstead Volume) - 0.23 * Cyclomatic - 16.2 * ln(LOC)
    const loc = Math.max(1, lines.filter(l => l.trim().length > 0).length);
    const estimatedMI = Math.max(0, Math.min(100, Math.round(171 - 5.2 * Math.log(Math.max(1, totalScore * 10)) - 0.23 * cyclomaticApprox - 16.2 * Math.log(loc))));

    return {
      overallCognitiveScore: totalScore,
      functions: [
        {
          functionName: 'main_module',
          cognitiveComplexity: totalScore,
          cyclomaticComplexity: cyclomaticApprox,
          nestingPenaltySum: breakdown.reduce((acc, b) => acc + b.nestingLevel, 0),
          rating,
          breakdown
        }
      ],
      maintainabilityIndex: estimatedMI
    };
  }

  /**
   * Calculates Halstead Software Science Metrics from raw token stream
   */
  public calculateHalsteadMetrics(tokens: string[]): HalsteadMetricsResult {
    const operatorCounts = new Map<string, number>();
    const operandCounts = new Map<string, number>();

    tokens.forEach(token => {
      if (this.operatorsList.has(token)) {
        operatorCounts.set(token, (operatorCounts.get(token) || 0) + 1);
      } else if (/^[a-zA-Z_$0-9]+$/.test(token)) {
        operandCounts.set(token, (operandCounts.get(token) || 0) + 1);
      }
    });

    const n1 = Math.max(1, operatorCounts.size); // distinct operators
    const n2 = Math.max(1, operandCounts.size);  // distinct operands
    let N1 = 0;
    operatorCounts.forEach(count => (N1 += count));
    N1 = Math.max(1, N1);
    let N2 = 0;
    operandCounts.forEach(count => (N2 += count));
    N2 = Math.max(1, N2);

    const vocabulary = n1 + n2;
    const length = N1 + N2;
    const calculatedLength = (n1 * Math.log2(n1)) + (n2 * Math.log2(n2));
    const volume = length * Math.log2(Math.max(2, vocabulary));
    const difficulty = (n1 / 2) * (N2 / n2);
    const effort = difficulty * volume;
    const timeToImplementSeconds = effort / 18;
    const estimatedBugs = Math.pow(effort, 2 / 3) / 3000;

    return {
      distinctOperators: n1,
      distinctOperands: n2,
      totalOperators: N1,
      totalOperands: N2,
      vocabulary,
      length,
      calculatedLength: Math.round(calculatedLength * 100) / 100,
      volume: Math.round(volume * 100) / 100,
      difficulty: Math.round(difficulty * 100) / 100,
      effort: Math.round(effort * 100) / 100,
      timeToImplementSeconds: Math.round(timeToImplementSeconds * 100) / 100,
      estimatedBugs: Math.round(estimatedBugs * 1000) / 1000
    };
  }
}
