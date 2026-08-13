export interface ModuleSymbol {
  name: string;
  kind: 'function' | 'class' | 'variable' | 'interface';
  isExported: boolean;
}

export interface ModuleFile {
  filePath: string;
  declaredSymbols: ModuleSymbol[];
  referencedSymbols: string[]; // external or internal symbol names referenced
  importedPaths: string[];
}

export interface DeadCodeReport {
  totalSymbols: number;
  deadSymbolsCount: number;
  deadRatio: number;
  deadSymbols: Array<{
    filePath: string;
    symbolName: string;
    kind: string;
  }>;
}

export class DeadCodeEliminator {
  public static analyze(entryPoints: string[], modules: ModuleFile[]): DeadCodeReport {
    const reachableSymbols = new Set<string>();
    const moduleMap = new Map<string, ModuleFile>();

    for (const mod of modules) {
      moduleMap.set(mod.filePath, mod);
    }

    // Traversal queue starting from entryPoints
    const queue: string[] = [...entryPoints];
    const visitedModules = new Set<string>();

    while (queue.length > 0) {
      const currentPath = queue.shift()!;
      if (visitedModules.has(currentPath)) continue;
      visitedModules.add(currentPath);

      const mod = moduleMap.get(currentPath);
      if (!mod) continue;

      for (const ref of mod.referencedSymbols) {
        reachableSymbols.add(ref);
      }

      // Also entry point exports are reachable
      if (entryPoints.includes(currentPath)) {
        for (const sym of mod.declaredSymbols) {
          reachableSymbols.add(sym.name);
        }
      }

      for (const imported of mod.importedPaths) {
        if (!visitedModules.has(imported)) {
          queue.push(imported);
        }
      }
    }

    let totalSymbols = 0;
    const deadSymbols: Array<{ filePath: string; symbolName: string; kind: string }> = [];

    for (const mod of modules) {
      for (const sym of mod.declaredSymbols) {
        totalSymbols++;
        if (!reachableSymbols.has(sym.name)) {
          deadSymbols.push({
            filePath: mod.filePath,
            symbolName: sym.name,
            kind: sym.kind,
          });
        }
      }
    }

    return {
      totalSymbols,
      deadSymbolsCount: deadSymbols.length,
      deadRatio: totalSymbols > 0 ? deadSymbols.length / totalSymbols : 0,
      deadSymbols,
    };
  }
}
