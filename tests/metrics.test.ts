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

describe('DeadCodeEliminator (v4.0.0)', () => {
  it('should identify unreferenced dead code symbols', async () => {
    const { DeadCodeEliminator } = await import('../src/ast/dead-code-eliminator.js');
    const modules = [
      {
        filePath: 'main.ts',
        declaredSymbols: [{ name: 'bootstrap', kind: 'function' as const, isExported: true }],
        referencedSymbols: ['usedService'],
        importedPaths: ['service.ts'],
      },
      {
        filePath: 'service.ts',
        declaredSymbols: [
          { name: 'usedService', kind: 'function' as const, isExported: true },
          { name: 'unusedHelper', kind: 'function' as const, isExported: false },
        ],
        referencedSymbols: [],
        importedPaths: [],
      },
    ];

    const report = DeadCodeEliminator.analyze(['main.ts'], modules);
    expect(report.totalSymbols).toBe(3);
    expect(report.deadSymbolsCount).toBe(1);
    expect(report.deadSymbols[0].symbolName).toBe('unusedHelper');
  });
});

describe('SoftwareEntropyAnalyzer (v4.0.0)', () => {
  it('should compute Shannon entropy and package instability', async () => {
    const { SoftwareEntropyAnalyzer } = await import('../src/ast/software-entropy.js');
    const sampleCode = `function test() { const a = 1; return a + 2; }`;
    const entropy = SoftwareEntropyAnalyzer.calculateTokenEntropy(sampleCode);
    expect(entropy).toBeGreaterThan(0);

    const instability = SoftwareEntropyAnalyzer.calculateInstability(3, 1);
    expect(instability).toBeCloseTo(0.75, 2);

    const evalReport = SoftwareEntropyAnalyzer.evaluateModule('sample.ts', sampleCode, 3, 1, 2);
    expect(evalReport.healthStatus).toBe('HEALTHY');
  });
});

describe('Cognitive & Halstead Complexity Engine (v5.0.0)', () => {
  it('should calculate cognitive complexity penalties with nesting increments', async () => {
    const { CognitiveHalsteadComplexityEngine } = await import('../src/ast/cyclomatic-cognitive-complexity.js');
    const engine = new CognitiveHalsteadComplexityEngine();
    const code = `
      function deep(a, b) {
        if (a > 0) {
          for (let i = 0; i < 10; i++) {
            if (b > 5) {
              return true;
            }
          }
        }
        return false;
      }
    `;
    const result = engine.analyzeCognitiveComplexity(code);
    expect(result.overallCognitiveScore).toBeGreaterThan(3);
    expect(result.functions[0].breakdown.length).toBeGreaterThanOrEqual(3);
    expect(result.maintainabilityIndex).toBeGreaterThan(0);
  });

  it('should compute Halstead vocabulary, volume, difficulty, and effort', async () => {
    const { CognitiveHalsteadComplexityEngine } = await import('../src/ast/cyclomatic-cognitive-complexity.js');
    const engine = new CognitiveHalsteadComplexityEngine();
    const tokens = ['function', 'compute', '(', 'x', ',', 'y', ')', '{', 'if', '(', 'x', '>', 'y', ')', 'return', 'x', '+', '1', ';', '}'];
    const halstead = engine.calculateHalsteadMetrics(tokens);
    expect(halstead.vocabulary).toBeGreaterThan(0);
    expect(halstead.volume).toBeGreaterThan(0);
    expect(halstead.difficulty).toBeGreaterThan(0);
    expect(halstead.effort).toBeGreaterThan(0);
    expect(halstead.estimatedBugs).toBeGreaterThanOrEqual(0);
  });
});

describe('ArchitecturalBoundaryEnforcer (v5.0.0)', () => {
  it('should detect Clean Architecture layer violations when domain imports infrastructure', async () => {
    const { ArchitecturalBoundaryEnforcer } = await import('../src/ast/architectural-boundary-enforcer.js');
    const enforcer = new ArchitecturalBoundaryEnforcer();
    const deps = [
      { sourceFile: 'domain/user.ts', sourceLayer: 'domain', targetLayer: 'infrastructure', targetFile: 'infra/db.ts' },
      { sourceFile: 'application/user-service.ts', sourceLayer: 'application', targetLayer: 'domain', targetFile: 'domain/user.ts' },
    ];
    const audit = enforcer.auditImports(deps);
    expect(audit.isCompliant).toBe(false);
    expect(audit.totalViolations).toBe(1);
    expect(audit.criticalViolations).toBe(1);
    expect(audit.overallScore).toBeLessThan(100);
  });

  it('should approve strictly compliant architectural layers', async () => {
    const { ArchitecturalBoundaryEnforcer } = await import('../src/ast/architectural-boundary-enforcer.js');
    const enforcer = new ArchitecturalBoundaryEnforcer();
    const deps = [
      { sourceFile: 'application/service.ts', sourceLayer: 'application', targetLayer: 'domain', targetFile: 'domain/entity.ts' },
      { sourceFile: 'infra/repository.ts', sourceLayer: 'infrastructure', targetLayer: 'application', targetFile: 'application/port.ts' },
    ];
    const audit = enforcer.auditImports(deps);
    expect(audit.isCompliant).toBe(true);
    expect(audit.overallScore).toBe(100);
  });
});


