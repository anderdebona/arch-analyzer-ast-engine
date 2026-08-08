import { CKMetricsResult } from '../core/ck-metrics.js';
import { CycleResult } from '../core/dependency-graph.js';

export class LaTeXReporter {
  public static generateReport(metrics: CKMetricsResult[], cycleResult: CycleResult): string {
    const dateStr = new Date().toISOString().split('T')[0];

    const tableRows = metrics
      .map(
        (m) =>
          `    ${m.className} & ${m.wmc} & ${m.cbo} & ${m.lcom4} & ${m.cyclomaticComplexity} & \\textbf{${m.cohesionStatus.replace(/_/g, '\\_')}} \\\\`
      )
      .join('\n');

    const cycleInfo = cycleResult.hasCycles
      ? `\\section{Architectural Dependency Cycles Detected}
\\begin{warning}
The following strongly connected components (circular dependencies) were identified:
\\begin{itemize}
${cycleResult.circularDependencies.map((c) => `  \\item \\texttt{${c.join(' $\\rightarrow$ ')}}`).join('\n')}
\\end{itemize}
\\end{warning}`
      : `\\section{Architectural Cycle Status}
\\textbf{Result:} No circular architectural dependencies detected. Topology satisfies DAG (Directed Acyclic Graph) constraint.`;

    return `\\documentclass[10pt,journal,compsoc]{IEEEtran}
\\usepackage{amsmath}
\\usepackage{amssymb}
\\usepackage{booktabs}
\\usepackage{hyperref}

\\title{Automated Software Architecture Metric Report: AST Analysis and Structural Cohesion Assessment}
\\author{anderdebona \\\\ \\textit{Department of Computer Science \& Software Engineering}}
\\date{${dateStr}}

\\begin{document}

\\maketitle

\\begin{abstract}
This report provides static structural analysis for target TypeScript/JavaScript source code repositories.
Metric evaluations are based on Chidamber \\& Kemerer (CK) Object-Oriented metrics suite, Henderson-Sellers LCOM4 topological graph formulation, and Tarjan's Strongly Connected Components (SCC) algorithm.
\\end{abstract}

\\section{Mathematical Foundations}

\\subsection{Lack of Cohesion in Methods ($LCOM4$)}
For a class $C$ with method set $M = \\{m_1, m_2, \\dots, m_n\\}$ and attribute set $A = \\{a_1, a_2, \\dots, a_k\\}$, let graph $G = (M, E)$ where:
\\begin{equation}
(m_i, m_j) \\in E \\iff \\text{Access}(m_i) \\cap \\text{Access}(m_j) \\neq \\emptyset
\\end{equation}
$LCOM4(C)$ is defined as the number of connected components in $G$:
\\begin{equation}
LCOM4(C) = |\\text{ConnectedComponents}(G)|
\\end{equation}
An $LCOM4 > 1$ indicates structural fragmentation and candidates for Single Responsibility Principle (SRP) refactoring.

\\subsection{Cyclomatic Complexity ($V(G)$)}
McCabe Cyclomatic Complexity is computed over the Control Flow Graph $CFG = (V, E)$ as:
\\begin{equation}
V(G) = E - V + 2P
\\end{equation}

\\section{Empirical Metrics Table}

\\begin{table}[h]
\\centering
\\caption{Chidamber \\& Kemerer Metrics Evaluation Summary}
\\begin{tabular}{lccccr}
\\toprule
\\textbf{Class Name} & \\textbf{WMC} & \\textbf{CBO} & \\textbf{LCOM4} & \\textbf{V(G)} & \\textbf{Status} \\\\
\\midrule
${tableRows}
\\bottomrule
\\end{tabular}
\\end{table}

${cycleInfo}

\\section{Conclusion and Architectural Recommendations}
1. Classes with $LCOM4 > 1$ should be refactored into distinct micro-services or delegated classes.
2. High Coupling Between Objects ($CBO > 5$) should adopt Dependency Inversion Principle (DIP) via interfaces.

\\end{document}
`;
  }
}
