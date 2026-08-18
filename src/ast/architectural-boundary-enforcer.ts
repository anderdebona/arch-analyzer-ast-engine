export interface ArchitecturalLayerRule {
  layerName: string;
  allowedDependencies: string[];
  disallowedDependencies: string[];
  description: string;
}

export interface LayerViolation {
  sourceLayer: string;
  targetLayer: string;
  sourceFile: string;
  importedSymbolOrFile: string;
  ruleDescription: string;
  severity: 'CRITICAL' | 'HIGH' | 'WARNING';
}

export interface ArchitectureAuditResult {
  overallScore: number; // 0 to 100
  totalViolations: number;
  criticalViolations: number;
  layersChecked: string[];
  violations: LayerViolation[];
  isCompliant: boolean;
}

export class ArchitecturalBoundaryEnforcer {
  private defaultRules: Map<string, ArchitecturalLayerRule> = new Map();

  constructor() {
    this.setupDefaultCleanArchitectureRules();
  }

  private setupDefaultCleanArchitectureRules(): void {
    this.defaultRules.set('domain', {
      layerName: 'domain',
      allowedDependencies: [],
      disallowedDependencies: ['application', 'infrastructure', 'presentation', 'controllers'],
      description: 'Domain layer must be completely isolated and hold no outward dependencies'
    });

    this.defaultRules.set('application', {
      layerName: 'application',
      allowedDependencies: ['domain'],
      disallowedDependencies: ['infrastructure', 'presentation', 'controllers'],
      description: 'Application layer may only depend on Domain entities and use cases'
    });

    this.defaultRules.set('infrastructure', {
      layerName: 'infrastructure',
      allowedDependencies: ['domain', 'application'],
      disallowedDependencies: ['presentation'],
      description: 'Infrastructure implements adapters and depends on Domain/Application interfaces'
    });

    this.defaultRules.set('presentation', {
      layerName: 'presentation',
      allowedDependencies: ['application', 'domain'],
      disallowedDependencies: ['infrastructure'],
      description: 'Presentation/UI layer should interact with Application layer, avoiding direct infrastructure dependencies'
    });
  }

  public registerLayerRule(rule: ArchitecturalLayerRule): void {
    this.defaultRules.set(rule.layerName.toLowerCase(), rule);
  }

  public auditImports(dependencies: Array<{ sourceFile: string; sourceLayer: string; targetLayer: string; targetFile: string }>): ArchitectureAuditResult {
    const violations: LayerViolation[] = [];
    const layersChecked = Array.from(this.defaultRules.keys());

    for (const dep of dependencies) {
      const src = dep.sourceLayer.toLowerCase();
      const tgt = dep.targetLayer.toLowerCase();

      if (src === tgt) continue; // internal layer dependency is fine

      const rule = this.defaultRules.get(src);
      if (!rule) continue;

      if (rule.disallowedDependencies.map(d => d.toLowerCase()).includes(tgt)) {
        violations.push({
          sourceLayer: dep.sourceLayer,
          targetLayer: dep.targetLayer,
          sourceFile: dep.sourceFile,
          importedSymbolOrFile: dep.targetFile,
          ruleDescription: rule.description,
          severity: src === 'domain' ? 'CRITICAL' : 'HIGH'
        });
      }
    }

    const criticalCount = violations.filter(v => v.severity === 'CRITICAL').length;
    const penalty = violations.length * 15 + criticalCount * 20;
    const overallScore = Math.max(0, 100 - penalty);

    return {
      overallScore,
      totalViolations: violations.length,
      criticalViolations: criticalCount,
      layersChecked,
      violations,
      isCompliant: violations.length === 0
    };
  }
}
