import {
  Node,
  type JsxText,
  type NoSubstitutionTemplateLiteral,
  type SourceFile,
  type StringLiteral,
  type TemplateExpression,
} from "ts-morph";

import type { ClassifiedLocalizationEntry } from "../../classification/types.js";

export type RewritableLocalizationNode =
  | JsxText
  | StringLiteral
  | NoSubstitutionTemplateLiteral
  | TemplateExpression;

export interface LocalizationNodeLocation {
  readonly node?: RewritableLocalizationNode;
  readonly ambiguous: boolean;
}

function normalizeJsxText(value: string): string {
  return value.replace(/\s+/gu, " ").trim();
}

function nodeMatchesEntry(
  node: RewritableLocalizationNode,
  entry: ClassifiedLocalizationEntry,
): boolean {
  if (Node.isJsxText(node)) {
    return normalizeJsxText(node.getText()) === normalizeJsxText(entry.sourceValue);
  }

  if (Node.isStringLiteral(node) || Node.isNoSubstitutionTemplateLiteral(node)) {
    return node.getLiteralValue() === entry.sourceValue;
  }

  return node.getText().slice(1, -1) === entry.sourceValue;
}

function isExpectedKind(
  node: Node,
  entry: ClassifiedLocalizationEntry,
): node is RewritableLocalizationNode {
  switch (entry.kind) {
    case "jsx-text":
      return Node.isJsxText(node);
    case "string-literal":
      return Node.isStringLiteral(node);
    case "template-literal":
      return (
        Node.isNoSubstitutionTemplateLiteral(node) ||
        Node.isTemplateExpression(node)
      );
  }
}

function distanceFromExpectedPosition(
  sourceFile: SourceFile,
  node: Node,
  entry: ClassifiedLocalizationEntry,
): number {
  const expected = lineAndColumnToPos(
    sourceFile.getFullText(),
    entry.line,
    entry.column,
  );
  return Math.abs(node.getStart() - expected);
}

export function locateLocalizationNode(
  sourceFile: SourceFile,
  entry: ClassifiedLocalizationEntry,
): LocalizationNodeLocation {
  const candidates = sourceFile
    .getDescendants()
    .filter((node): node is RewritableLocalizationNode =>
      isExpectedKind(node, entry),
    )
    .filter((node) => nodeMatchesEntry(node, entry))
    .sort(
      (left, right) =>
        distanceFromExpectedPosition(sourceFile, left, entry) -
        distanceFromExpectedPosition(sourceFile, right, entry),
    );

  const first = candidates[0];
  if (first === undefined) {
    return { ambiguous: false };
  }

  const firstDistance = distanceFromExpectedPosition(sourceFile, first, entry);
  const second = candidates[1];
  const ambiguous =
    second !== undefined &&
    distanceFromExpectedPosition(sourceFile, second, entry) === firstDistance;

  return ambiguous
    ? { ambiguous: true }
    : { node: first, ambiguous: false };
}

function lineAndColumnToPos(
  text: string,
  line: number,
  column: number,
): number {
  if (line < 1 || column < 1) {
    throw new Error("Line and column are 1-based.");
  }

  let currentLine = 1;
  let index = 0;

  while (currentLine < line && index < text.length) {
    if (text[index] === "\n") {
      currentLine++;
    }
    index++;
  }

  return index + (column - 1);
}

