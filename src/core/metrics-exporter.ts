import { CKMetricsResult } from './ck-metrics.js';

export class PrometheusMetricsExporter {
  public static exportPrometheus(metrics: CKMetricsResult[]): string {
    const lines: string[] = [
      '# HELP ast_ck_wmc Weighted Methods per Class',
      '# TYPE ast_ck_wmc gauge',
      '# HELP ast_ck_cbo Coupling Between Objects',
      '# TYPE ast_ck_cbo gauge',
      '# HELP ast_ck_lcom4 Lack of Cohesion in Methods (LCOM4)',
      '# TYPE ast_ck_lcom4 gauge',
    ];

    metrics.forEach((m) => {
      const clsLabel = `{class="${m.className}"}`;
      lines.push(`ast_ck_wmc${clsLabel} ${m.wmc}`);
      lines.push(`ast_ck_cbo${clsLabel} ${m.cbo}`);
      lines.push(`ast_ck_lcom4${clsLabel} ${m.lcom4}`);
    });

    return lines.join('\n');
  }
}
