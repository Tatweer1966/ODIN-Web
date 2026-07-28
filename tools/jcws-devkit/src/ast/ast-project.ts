import path from "node:path";

import {
  Project,
  ScriptTarget,
  SyntaxKind,
  type Node,
  type SourceFile,
} from "ts-morph";

export interface AstProjectOptions {
  repositoryRoot: string;
  sourceRoot?: string;
  tsConfigPath?: string;
}

export class AstProject {
  private readonly project: Project;
  private readonly repositoryRoot: string;
  private readonly sourceRoot: string;

  constructor(options: AstProjectOptions) {
    this.repositoryRoot = path.resolve(options.repositoryRoot);
    this.sourceRoot = path.resolve(
      this.repositoryRoot,
      options.sourceRoot ?? "src",
    );

    const tsConfigPath = options.tsConfigPath
      ? path.resolve(this.repositoryRoot, options.tsConfigPath)
      : path.join(this.repositoryRoot, "tsconfig.json");

    this.project = new Project({
      tsConfigFilePath: tsConfigPath,
      skipAddingFilesFromTsConfig: false,
      compilerOptions: {
        allowJs: false,
        target: ScriptTarget.ES2022,
      },
    });

    this.loadSourceFiles();
  }

  getRepositoryRoot(): string {
    return this.repositoryRoot;
  }

  getSourceRoot(): string {
    return this.sourceRoot;
  }

  getSourceFiles(): SourceFile[] {
    return this.project.getSourceFiles();
  }

  getRelativePath(sourceFile: SourceFile): string {
    return path.relative(
      this.repositoryRoot,
      sourceFile.getFilePath(),
    );
  }

  isInsideSourceRoot(sourceFile: SourceFile): boolean {
    const relativePath = path.relative(
      this.sourceRoot,
      sourceFile.getFilePath(),
    );

    return (
      relativePath.length > 0 &&
      !relativePath.startsWith("..") &&
      !path.isAbsolute(relativePath)
    );
  }

  private loadSourceFiles(): void {
    for (const sourceFile of this.project.getSourceFiles()) {
      if (
        this.shouldExclude(sourceFile) ||
        !this.isInsideSourceRoot(sourceFile)
      ) {
        this.project.removeSourceFile(sourceFile);
      }
    }
  }

  private shouldExclude(sourceFile: SourceFile): boolean {
    const filePath = sourceFile.getFilePath();

    return (
      filePath.includes(`${path.sep}node_modules${path.sep}`) ||
      filePath.includes(`${path.sep}dist${path.sep}`) ||
      filePath.includes(`${path.sep}build${path.sep}`) ||
      filePath.endsWith(".d.ts")
    );
  }
}

export function isStringLikeNode(node: Node): boolean {
  return (
    node.isKind(SyntaxKind.StringLiteral) ||
    node.isKind(SyntaxKind.NoSubstitutionTemplateLiteral) ||
    node.isKind(SyntaxKind.JsxText)
  );
}