/**
 * Complexity analysis result per function
 */
export interface ComplexityResult {
  functionName: string; cyclomaticComplexity: number; cognitiveComplexity: number;
  linesOfCode: number; riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
}

/**
 * Complexity Analyzer — Computes McCabe Cyclomatic Complexity and Cognitive Complexity.
 *
 * Cyclomatic Complexity (CC): V(G) = E - N + 2P
 * Simplified: count decision points (if, for, while, case, &&, ||, ?) + 1
 *
 * Cognitive Complexity: Increments for breaks in linear flow + nesting penalties.
 *
 * Risk thresholds: CC ≤ 10 = LOW, ≤ 20 = MODERATE, ≤ 50 = HIGH, > 50 = CRITICAL
 *
 * Reference: McCabe, "A Complexity Measure" (IEEE TSE, 1976)
 */
export class ComplexityAnalyzer {
  private static readonly DECISION_KEYWORDS = ['if', 'else if', 'for', 'while', 'case', 'catch'];
  private static readonly LOGICAL_OPS = ['&&', '||', '??'];

  public static analyze(source: string): ComplexityResult[] {
    const results: ComplexityResult[] = [];
    const functionRegex = /(?:function\s+(\w+)|(?:const|let|var)\s+(\w+)\s*=.*(?:=>|function))/g;
    const lines = source.split('\n');

    // Simple function detection
    let match;
    while ((match = functionRegex.exec(source)) !== null) {
      const funcName = match[1] || match[2] || 'anonymous';
      const startIdx = source.indexOf('{', match.index);
      if (startIdx === -1) continue;

      // Find matching closing brace
      let depth = 1; let endIdx = startIdx + 1;
      while (endIdx < source.length && depth > 0) {
        if (source[endIdx] === '{') depth++;
        if (source[endIdx] === '}') depth--;
        endIdx++;
      }

      const funcBody = source.slice(startIdx, endIdx);
      const funcLines = funcBody.split('\n');

      // Cyclomatic Complexity
      let cc = 1;
      for (const keyword of ComplexityAnalyzer.DECISION_KEYWORDS) {
        const regex = new RegExp(`\\b${keyword}\\b`, 'g');
        const matches = funcBody.match(regex);
        cc += matches ? matches.length : 0;
      }
      for (const op of ComplexityAnalyzer.LOGICAL_OPS) {
        const count = funcBody.split(op).length - 1;
        cc += count;
      }

      // Cognitive Complexity (simplified — nesting penalty)
      let cognitive = 0; let nestingLevel = 0;
      for (const line of funcLines) {
        const trimmed = line.trim();
        for (const kw of ['if', 'for', 'while']) {
          if (trimmed.startsWith(kw + ' ') || trimmed.startsWith(kw + '(')) {
            cognitive += 1 + nestingLevel;
            nestingLevel++;
          }
        }
        if (trimmed === '}') nestingLevel = Math.max(0, nestingLevel - 1);
      }

      const riskLevel = cc <= 10 ? 'LOW' : cc <= 20 ? 'MODERATE' : cc <= 50 ? 'HIGH' : 'CRITICAL';

      results.push({
        functionName: funcName,
        cyclomaticComplexity: cc,
        cognitiveComplexity: cognitive,
        linesOfCode: funcLines.length,
        riskLevel,
      });
    }

    return results;
  }
}
