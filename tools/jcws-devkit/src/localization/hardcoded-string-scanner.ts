import {
  Node,
  SyntaxKind,
  type SourceFile,
} from "ts-morph";

import type { AstProject } from "../ast/ast-project.js";
import type {
  LocalizationFinding,
  LocalizationFindingKind,
  LocalizationScanResult,
} from "./types.js";

const ignoredExactValues = new Set([
  "",
  " ",
  "/",
  "-",
  "_",
  ".",
  ",",
  ":",
  ";",
  "true",
  "false",
  "null",
  "undefined",
]);

const ignoredAttributeNames = new Set([
  "className",
  "id",
  "key",
  "name",
  "type",
  "role",
  "href",
  "src",
  "target",
  "rel",
  "method",
  "action",
  "variant",
  "size",
  "color",
  "data-testid",
]);

export class HardcodedStringScanner {
  constructor(private readonly astProject: AstProject) {}

  scan(): LocalizationScanResult {
    const findings: LocalizationFinding[] = [];
    const sourceFiles = this.astProject
      .getSourceFiles()
      .filter((sourceFile) =>
        this.astProject.isInsideSourceRoot(sourceFile),
      );

    for (const sourceFile of sourceFiles) {
      findings.push(...this.scanSourceFile(sourceFile));
    }

    return {
      repositoryRoot: this.astProject.getRepositoryRoot(),
      sourceRoot: this.astProject.getSourceRoot(),
      filesScanned: sourceFiles.length,
      findings,
    };
  }

  private scanSourceFile(
    sourceFile: SourceFile,
  ): LocalizationFinding[] {
    const findings: LocalizationFinding[] = [];

    sourceFile.forEachDescendant((node) => {
      if (Node.isJsxText(node)) {
        const value = this.normalizeJsxText(node.getText());

        if (this.shouldReport(value)) {
          findings.push(
            this.createFinding(
              sourceFile,
              node,
              "jsx-text",
              value,
            ),
          );
        }

        return;
      }

      if (Node.isStringLiteral(node)) {
        if (this.shouldIgnoreStringLiteral(node)) {
          return;
        }

        const value = node.getLiteralValue();

        if (this.shouldReport(value)) {
          findings.push(
            this.createFinding(
              sourceFile,
              node,
              "string-literal",
              value,
            ),
          );
        }

        return;
      }

      if (
        node.isKind(
          SyntaxKind.NoSubstitutionTemplateLiteral,
        )
      ) {
        const value = node.getLiteralValue();

        if (this.shouldReport(value)) {
          findings.push(
            this.createFinding(
              sourceFile,
              node,
              "template-literal",
              value,
            ),
          );
        }
      }
    });

    return findings;
  }

  private shouldIgnoreStringLiteral(
    node: Node & {
      getLiteralValue(): string;
    },
  ): boolean {
    const parent = node.getParent();

    if (!parent) {
      return false;
    }

    if (
      Node.isImportDeclaration(parent) ||
      Node.isExportDeclaration(parent)
    ) {
      return true;
    }

    if (
      Node.isPropertyAssignment(parent) &&
      parent.getNameNode() === node
    ) {
      return true;
    }

    if (Node.isJsxAttribute(parent)) {
      const attributeName = parent.getNameNode().getText();

      return ignoredAttributeNames.has(attributeName);
    }

    if (Node.isCallExpression(parent)) {
      const expression = parent.getExpression().getText();

      if (
        expression === "t" ||
        expression.endsWith(".t") ||
        expression === "i18n.t"
      ) {
        return true;
      }
    }

    return false;
  }

  private shouldReport(value: string): boolean {
    const normalized = value.trim();

    if (ignoredExactValues.has(normalized)) {
      return false;
    }

    if (normalized.length < 2) {
      return false;
    }

    if (/^[\d\s.,:%()+\-_/\\]+$/u.test(normalized)) {
      return false;
    }

    if (/^(https?:|mailto:|tel:|data:)/u.test(normalized)) {
      return false;
    }

    if (/^[a-z0-9_-]+(?:\.[a-z0-9_-]+)+$/iu.test(normalized)) {
      return false;
    }

    if (/^#[0-9a-f]{3,8}$/iu.test(normalized)) {
      return false;
    }

    return /\p{L}/u.test(normalized);
  }

  private normalizeJsxText(value: string): string {
    return value.replace(/\s+/gu, " ").trim();
  }

  private createFinding(
    sourceFile: SourceFile,
    node: Node,
    kind: LocalizationFindingKind,
    value: string,
  ): LocalizationFinding {
    const position = sourceFile.getLineAndColumnAtPos(
      node.getStart(),
    );

    return {
      filePath:
        this.astProject.getRelativePath(sourceFile),
      line: position.line,
      column: position.column,
      kind,
      value,
    };
  }
}