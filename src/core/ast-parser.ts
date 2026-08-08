import ts from 'typescript';

export interface ClassAnalysis {
  name: string;
  methods: string[];
  fields: string[];
  methodFieldAccessMap: Record<string, string[]>;
  dependencies: string[];
  cyclomaticComplexity: number;
}

export interface FileAnalysisResult {
  filePath: string;
  classes: ClassAnalysis[];
  imports: string[];
}

export class ASTParser {
  public static parseCode(sourceCode: string, filePath: string = 'sample.ts'): FileAnalysisResult {
    const sourceFile = ts.createSourceFile(
      filePath,
      sourceCode,
      ts.ScriptTarget.Latest,
      true
    );

    const classes: ClassAnalysis[] = [];
    const imports: string[] = [];

    const visitNode = (node: ts.Node) => {
      // Extract imports
      if (ts.isImportDeclaration(node)) {
        const moduleSpecifier = node.moduleSpecifier.getText(sourceFile).replace(/['"]/g, '');
        imports.push(moduleSpecifier);
      }

      // Extract classes
      if (ts.isClassDeclaration(node) && node.name) {
        const className = node.name.text;
        const methods: string[] = [];
        const fields: string[] = [];
        const methodFieldAccessMap: Record<string, string[]> = {};
        const dependencies = new Set<string>();
        let classComplexity = 1;

        node.members.forEach((member) => {
          if (ts.isPropertyDeclaration(member) && member.name) {
            fields.push(member.name.getText(sourceFile));
          } else if (ts.isMethodDeclaration(member) && member.name) {
            const methodName = member.name.getText(sourceFile);
            methods.push(methodName);
            methodFieldAccessMap[methodName] = [];

            // Calculate Cyclomatic Complexity and Field Access for this method
            const visitMethodBody = (child: ts.Node) => {
              // Cyclomatic complexity decision points
              if (
                ts.isIfStatement(child) ||
                ts.isForStatement(child) ||
                ts.isForInStatement(child) ||
                ts.isForOfStatement(child) ||
                ts.isWhileStatement(child) ||
                ts.isDoStatement(child) ||
                ts.isCaseClause(child) ||
                ts.isConditionalExpression(child) ||
                child.kind === ts.SyntaxKind.BarBarToken ||
                child.kind === ts.SyntaxKind.AmpersandAmpersandToken
              ) {
                classComplexity++;
              }

              // Property Access (this.fieldName)
              if (ts.isPropertyAccessExpression(child)) {
                if (child.expression.kind === ts.SyntaxKind.ThisKeyword) {
                  const fieldName = child.name.getText(sourceFile);
                  if (!methodFieldAccessMap[methodName].includes(fieldName)) {
                    methodFieldAccessMap[methodName].push(fieldName);
                  }
                }
              }

              // Type reference dependencies
              if (ts.isTypeReferenceNode(child)) {
                dependencies.add(child.typeName.getText(sourceFile));
              }

              ts.forEachChild(child, visitMethodBody);
            };

            if (member.body) {
              visitMethodBody(member.body);
            }
          }
        });

        classes.push({
          name: className,
          methods,
          fields,
          methodFieldAccessMap,
          dependencies: Array.from(dependencies),
          cyclomaticComplexity: classComplexity,
        });
      }

      ts.forEachChild(node, visitNode);
    };

    visitNode(sourceFile);

    return {
      filePath,
      classes,
      imports,
    };
  }
}
