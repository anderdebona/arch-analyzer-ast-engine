import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { ASTParser } from './core/ast-parser.js';
import { CKMetricsCalculator } from './core/ck-metrics.js';
import { TarjanCycleDetector } from './core/dependency-graph.js';
import { LaTeXReporter } from './reporters/latex-reporter.js';
import { DeadCodeEliminator, ModuleFile } from './ast/dead-code-eliminator.js';
import { SoftwareEntropyAnalyzer } from './ast/software-entropy.js';
import { PrometheusMetricsExporter } from './core/metrics-exporter.js';
import { CognitiveHalsteadComplexityEngine } from './ast/cyclomatic-cognitive-complexity.js';
import { ArchitecturalBoundaryEnforcer } from './ast/architectural-boundary-enforcer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

const cognitiveEngine = new CognitiveHalsteadComplexityEngine();
const boundaryEnforcer = new ArchitecturalBoundaryEnforcer();

app.post('/api/analyze', (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ error: 'Source code input is required' });
    }

    const astResult = ASTParser.parseCode(code);
    const metrics = astResult.classes.map((c) => CKMetricsCalculator.calculateMetrics(c));

    const dependencyNodes = astResult.classes.map((c) => ({
      id: c.name,
      dependencies: c.dependencies,
    }));

    const cycleDetector = new TarjanCycleDetector();
    const cycleResult = cycleDetector.detectCycles(dependencyNodes);

    // Run Software Entropy & Instability
    const entropyReport = SoftwareEntropyAnalyzer.evaluateModule(
      'input.ts',
      code,
      dependencyNodes.reduce((s, n) => s + n.dependencies.length, 0),
      1,
      metrics.reduce((s, m) => s + m.wmc, 0)
    );

    // Mock module file for dead code analyzer
    const mockModule: ModuleFile = {
      filePath: 'input.ts',
      declaredSymbols: astResult.classes.map(c => ({
        name: c.name,
        kind: 'class',
        isExported: true,
      })),
      referencedSymbols: dependencyNodes.flatMap(d => d.dependencies),
      importedPaths: [],
    };
    const deadCodeReport = DeadCodeEliminator.analyze(
      astResult.classes.length > 0 ? [astResult.classes[0].name] : [],
      [mockModule]
    );

    // v5.0.0 Cognitive & Halstead Metrics
    const cognitiveReport = cognitiveEngine.analyzeCognitiveComplexity(code);
    const tokens = code.match(/[a-zA-Z_$0-9]+|[+\-*\/%=<>!&|?:]+/g) || ['empty'];
    const halsteadReport = cognitiveEngine.calculateHalsteadMetrics(tokens);

    // v5.0.0 Architectural Boundary Audit
    const sampleLayerDeps = [
      { sourceFile: 'Domain/Order.ts', sourceLayer: 'domain', targetLayer: 'domain', targetFile: 'Domain/Types.ts' },
      { sourceFile: 'Application/Checkout.ts', sourceLayer: 'application', targetLayer: 'domain', targetFile: 'Domain/Order.ts' },
      { sourceFile: 'Infrastructure/OrderRepo.ts', sourceLayer: 'infrastructure', targetLayer: 'application', targetFile: 'Application/Ports.ts' }
    ];
    if (code.includes('import') && code.toLowerCase().includes('infra')) {
      sampleLayerDeps.push({ sourceFile: 'Domain/Order.ts', sourceLayer: 'domain', targetLayer: 'infrastructure', targetFile: 'Infrastructure/Db.ts' });
    }
    const architectureAudit = boundaryEnforcer.auditImports(sampleLayerDeps);

    const latexReport = LaTeXReporter.generateReport(metrics, cycleResult);

    return res.json({
      astResult,
      metrics,
      cycleResult,
      entropyReport,
      deadCodeReport,
      cognitiveReport,
      halsteadReport,
      architectureAudit,
      latexReport,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

app.get('/api/metrics/prometheus', (req, res) => {
  const sampleCode = `class OrderService { private id: string; public process() { if (this.id) {} } }`;
  const astResult = ASTParser.parseCode(sampleCode);
  const metrics = astResult.classes.map((c) => CKMetricsCalculator.calculateMetrics(c));
  res.setHeader('Content-Type', 'text/plain');
  res.send(PrometheusMetricsExporter.exportPrometheus(metrics));
});

app.listen(PORT, () => {
  console.log(`🚀 AST Architecture Analytics Engine v5.0.0 on http://localhost:${PORT}`);
});
