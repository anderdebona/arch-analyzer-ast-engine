import { describe, it, expect } from 'vitest';
import { ASTParser } from '../src/core/ast-parser.js';
import { CKMetricsCalculator } from '../src/core/ck-metrics.js';
import { TarjanCycleDetector } from '../src/core/dependency-graph.js';

describe('AST Architecture Analytics Engine Tests', () => {
  it('should parse TypeScript code and calculate CK Metrics correctly', () => {
    const code = `
      class PaymentProcessor {
        private apiKey: string = "secret";

        public processPayment(): void {
          if (this.apiKey) {
            console.log("Processing");
          }
        }

        public validateKey(): boolean {
          return this.apiKey.length > 0;
        }
      }
    `;

    const parsed = ASTParser.parseCode(code);
    expect(parsed.classes.length).toBe(1);

    const metrics = CKMetricsCalculator.calculateMetrics(parsed.classes[0]);
    expect(metrics.className).toBe('PaymentProcessor');
    expect(metrics.wmc).toBe(2);
    expect(metrics.lcom4).toBe(1); // Highly cohesive class
    expect(metrics.cohesionStatus).toBe('HIGH_COHESION');
  });

  it('should detect circular dependencies using Tarjan SCC Algorithm', () => {
    const nodes = [
      { id: 'ServiceA', dependencies: ['ServiceB'] },
      { id: 'ServiceB', dependencies: ['ServiceC'] },
      { id: 'ServiceC', dependencies: ['ServiceA'] }, // Cycle
    ];

    const detector = new TarjanCycleDetector();
    const result = detector.detectCycles(nodes);

    expect(result.hasCycles).toBe(true);
    expect(result.circularDependencies.length).toBe(1);
    expect(result.circularDependencies[0]).toContain('ServiceA');
  });
});
