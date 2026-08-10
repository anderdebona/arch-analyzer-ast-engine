export interface ImportEdge { source: string; target: string; isRelative: boolean; }
export class DependencyMapper {
  public static extractImports(source: string, filePath: string): ImportEdge[] {
    const edges: ImportEdge[] = [];
    const importRegex = /import\s+.*from\s+['"]([^'"]+)['"]/g;
    let match;
    while ((match = importRegex.exec(source)) !== null) {
      edges.push({ source: filePath, target: match[1], isRelative: match[1].startsWith('.') });
    }
    return edges;
  }
  public static buildGraph(files: Array<{ path: string; source: string }>): { edges: ImportEdge[]; totalDeps: number; externalDeps: number } {
    const allEdges: ImportEdge[] = [];
    for (const file of files) allEdges.push(...DependencyMapper.extractImports(file.source, file.path));
    return { edges: allEdges, totalDeps: allEdges.length, externalDeps: allEdges.filter(e => !e.isRelative).length };
  }
}
