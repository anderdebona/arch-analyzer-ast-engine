#!/usr/bin/env node
import { ASTParser } from './core/ast-parser.js';
import { CKMetricsCalculator } from './core/ck-metrics.js';
import { PrometheusMetricsExporter } from './core/metrics-exporter.js';

console.log(`
===========================================================
  📐 AST ARCHITECTURE ANALYTICS ENGINE CLI [v1.0.0]
  Author: anderdebona
===========================================================
`);

const sampleCode = `
class OrderProcessor {
  private orderId: string;
  public processOrder() {
    if (this.orderId) {
      console.log('Order processed:', this.orderId);
    }
  }
}
`;

console.log('🔍 Parsing TypeScript AST and calculating Chidamber & Kemerer (CK) metrics...');
const astResult = ASTParser.parseCode(sampleCode);
const ckMetrics = astResult.classes.map((c) => CKMetricsCalculator.calculateMetrics(c));

console.log('\n📊 CK Metrics Result (WMC, CBO, LCOM4):');
console.log(JSON.stringify(ckMetrics, null, 2));

console.log('\n📈 Prometheus Metrics Export Format:');
console.log(PrometheusMetricsExporter.exportPrometheus(ckMetrics));
