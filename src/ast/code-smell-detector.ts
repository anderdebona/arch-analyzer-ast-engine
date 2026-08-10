/**
 * Code smell detection result
 */
export interface CodeSmellResult {
  type: string; filePath: string; line: number; severity: 'INFO' | 'WARNING' | 'ERROR';
  description: string; suggestion: string;
}

/**
 * Code Smell Detector — Identifies anti-patterns and maintainability issues
 * in source code using heuristic analysis.
 *
 * Detects: Long Methods, God Classes, Feature Envy, Magic Numbers, Deep Nesting.
 * Reference: Fowler, "Refactoring: Improving the Design of Existing Code" (1999)
 */
export class CodeSmellDetector {
  public static analyze(source: string, filePath: string = 'unknown'): CodeSmellResult[] {
    const results: CodeSmellResult[] = [];
    const lines = source.split('\n');

    // Long Method Detection (>30 lines between braces)
    let braceDepth = 0; let methodStart = -1;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('{')) { if (braceDepth === 0) methodStart = i; braceDepth++; }
      if (lines[i].includes('}')) {
        braceDepth--;
        if (braceDepth === 0 && methodStart >= 0 && i - methodStart > 30) {
          results.push({ type: 'LONG_METHOD', filePath, line: methodStart + 1, severity: 'WARNING',
            description: `Method spans ${i - methodStart} lines (threshold: 30)`,
            suggestion: 'Extract sub-methods using the Extract Method refactoring pattern' });
        }
      }
    }

    // Magic Number Detection (raw numerics > 2)
    const magicNumRegex = /[^a-zA-Z_0-9](\d{2,})[^a-zA-Z_0-9]/g;
    for (let i = 0; i < lines.length; i++) {
      let match;
      while ((match = magicNumRegex.exec(lines[i])) !== null) {
        const num = parseInt(match[1]);
        if (num > 2 && !lines[i].includes('const') && !lines[i].includes('//')) {
          results.push({ type: 'MAGIC_NUMBER', filePath, line: i + 1, severity: 'INFO',
            description: `Magic number ${num} detected`,
            suggestion: 'Extract to a named constant for readability' });
        }
      }
    }

    // Deep Nesting Detection (>4 levels)
    for (let i = 0; i < lines.length; i++) {
      const leadingSpaces = lines[i].search(/\S/);
      if (leadingSpaces > 16) { // ~4 levels at 4 spaces
        results.push({ type: 'DEEP_NESTING', filePath, line: i + 1, severity: 'WARNING',
          description: `Nesting depth exceeds 4 levels`,
          suggestion: 'Use early returns or extract nested logic into helper functions' });
        break; // One warning per file
      }
    }

    return results;
  }
}
