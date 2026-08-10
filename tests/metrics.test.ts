import { describe, it, expect } from 'vitest';
import { ASTParser } from '../src/core/ast-parser.js';
import { CKMetricsCalculator } from '../src/core/ck-metrics.js';
import { TarjanCycleDetector } from '../src/core/dependency-graph.js';
import { CodeSmellDetector } from '../src/ast/code-smell-detector.js';
import { ComplexityAnalyzer } from '../src/ast/complexity-analyzer.js';

describe('AST Parser & CK Metrics', () => {
  it('should parse TypeScript code and calculate CK Metrics', () => {
    const code = `class PaymentProcessor {
      private apiKey: string = "secret";
      public processPayment(): void { if (this.apiKey) { console.log("Processing"); } }
      public validateKey(): boolean { return this.apiKey.length > 0; }
    }`;
    const parsed = ASTParser.parseCode(code);
    expect(parsed.classes.length).toBe(1);
    const metrics = CKMetricsCalculator.calculateMetrics(parsed.classes[0]);
    expect(metrics.className).toBe('PaymentProcessor');
    expect(metrics.wmc).toBe(2);
  });
});

describe('Tarjan Cycle Detection', () => {
  it('should detect circular dependencies', () => {
    const detector = new TarjanCycleDetector();
    const result = detector.detectCycles([
      { id: 'A', dependencies: ['B'] },
      { id: 'B', dependencies: ['C'] },
      { id: 'C', dependencies: ['A'] },
    ]);
    expect(result.hasCycles).toBe(true);
  });
});

describe('Code Smell Detector', () => {
  it('should detect magic numbers in source code', () => {
    const code = `function calc(x) { return x * 42 + 100; }`;
    const smells = CodeSmellDetector.analyze(code, 'test.ts');
    const magicNumbers = smells.filter((s) => s.type === 'MAGIC_NUMBER');
    expect(magicNumbers.length).toBeGreaterThan(0);
  });

  it('should return empty for clean code', () => {
    const code = `const x = 1;`;
    const smells = CodeSmellDetector.analyze(code, 'test.ts');
    expect(smells.length).toBe(0);
  });
});

describe('Complexity Analyzer', () => {
  it('should compute cyclomatic complexity for simple function', () => {
    const code = `function simple() { return 42; }`;
    const results = ComplexityAnalyzer.analyze(code);
    expect(results.length).toBe(1);
    expect(results[0].cyclomaticComplexity).toBe(1);
    expect(results[0].riskLevel).toBe('LOW');
  });

  it('should compute higher complexity for branchy code', () => {
    const code = `function branchy(x) {
      if (x > 0) { return 1; }
      else if (x < 0) { return -1; }
      for (let i = 0; i < x; i++) { console.log(i); }
      while (x > 10) { x--; }
      return 0;
    }`;
    const results = ComplexityAnalyzer.analyze(code);
    expect(results.length).toBe(1);
    expect(results[0].cyclomaticComplexity).toBeGreaterThan(3);
  });
});

import { DependencyMapper } from '../src/ast/dependency-mapper.js';

describe('Dependency Mapper', () => {
  it('should extract import edges from source', () => {
    const source = `import { foo } from './utils.js';\nimport express from 'express';`;
    const edges = DependencyMapper.extractImports(source, 'app.ts');
    expect(edges.length).toBe(2);
    expect(edges[0].isRelative).toBe(true);
    expect(edges[1].isRelative).toBe(false);
  });
  it('should build dependency graph from files', () => {
    const files = [
      { path: 'a.ts', source: `import { b } from './b.js';` },
      { path: 'b.ts', source: `import { c } from './c.js';\nimport fs from 'fs';` }
    ];
    const graph = DependencyMapper.buildGraph(files);
    expect(graph.totalDeps).toBe(3);
    expect(graph.externalDeps).toBe(1);
  });
});
