import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { ASTParser } from './core/ast-parser.js';
import { CKMetricsCalculator } from './core/ck-metrics.js';
import { TarjanCycleDetector } from './core/dependency-graph.js';
import { LaTeXReporter } from './reporters/latex-reporter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

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

    const latexReport = LaTeXReporter.generateReport(metrics, cycleResult);

    return res.json({
      astResult,
      metrics,
      cycleResult,
      latexReport,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 AST Architecture Analytics Engine running on http://localhost:${PORT}`);
});
