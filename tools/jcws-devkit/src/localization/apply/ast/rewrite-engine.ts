import {
  Node,
  Project,
  ScriptKind,
  type SourceFile,
  type TemplateExpression,
} from "ts-morph";

import type { ClassifiedLocalizationEntry } from "../../classification/types.js";
import {
  locateLocalizationNode,
  type RewritableLocalizationNode,
} from "./node-locator.js";
import {
  buildJsxTranslationExpression,
  buildTranslationCall,
} from "./replacement-builder.js";
import type {
  LocalizationFileRewriteResult,
  LocalizationRewriteChange,
  LocalizationRewriteDiagnostic,
  LocalizationRewriteOptions,
} from "./types.js";

const defaultOptions: LocalizationRewriteOptions = {
  translationFunction: "t",
};

function createSourceFile(filePath: string, sourceText: string): SourceFile {
  const project = new Project({
    useInMemoryFileSystem: true,
    skipAddingFilesFromTsConfig: true,
    manipulationSettings: {
      usePrefixAndSuffixTextForRename: false,
    },
  });

  return project.createSourceFile(filePath, sourceText, {
    overwrite: true,
    scriptKind: filePath.endsWith("x") ? ScriptKind.TSX : ScriptKind.TS,
  });
}

function templateExpressions(node: TemplateExpression): readonly string[] {
  return node.getTemplateSpans().map((span) => span.getExpression().getText());
}

function replacementForNode(
  node: RewritableLocalizationNode,
  entry: ClassifiedLocalizationEntry,
  options: LocalizationRewriteOptions,
): string {
  if (Node.isJsxText(node)) {
    return buildJsxTranslationExpression(entry, options.translationFunction);
  }

  if (Node.isTemplateExpression(node)) {
    return buildTranslationCall(
      entry,
      options.translationFunction,
      templateExpressions(node),
    );
  }

  return buildTranslationCall(entry, options.translationFunction);
}

function rewriteOne(
  sourceFile: SourceFile,
  entry: ClassifiedLocalizationEntry,
  options: LocalizationRewriteOptions,
):
  | { readonly change: LocalizationRewriteChange }
  | { readonly diagnostic: LocalizationRewriteDiagnostic } {
  const location = locateLocalizationNode(sourceFile, entry);

  if (location.ambiguous) {
    return {
      diagnostic: {
        entryId: entry.id,
        filePath: entry.filePath,
        status: "ambiguous",
        message: `Multiple equally likely AST nodes matched entry ${entry.id}.`,
      },
    };
  }

  const node = location.node;
  if (node === undefined) {
    return {
      diagnostic: {
        entryId: entry.id,
        filePath: entry.filePath,
        status: "not-found",
        message: `No AST node matched ${entry.kind} entry ${entry.id}.`,
      },
    };
  }

  const before = node.getText();
  const start = node.getStart();
  const end = node.getEnd();
  const after = replacementForNode(node, entry, options);
  node.replaceWithText(after);

  return {
    change: {
      entryId: entry.id,
      filePath: entry.filePath,
      kind: entry.kind,
      key: entry.key,
      before,
      after,
      start,
      end,
    },
  };
}

export function rewriteLocalizationSource(
  filePath: string,
  sourceText: string,
  entries: readonly ClassifiedLocalizationEntry[],
  optionsInput: Partial<LocalizationRewriteOptions> = {},
): LocalizationFileRewriteResult {
  const options: LocalizationRewriteOptions = {
    ...defaultOptions,
    ...optionsInput,
  };
  const sourceFile = createSourceFile(filePath, sourceText);
  const orderedEntries = [...entries].sort(
    (left, right) =>
      right.line - left.line ||
      right.column - left.column ||
      right.id.localeCompare(left.id),
  );
  const changes: LocalizationRewriteChange[] = [];
  const diagnostics: LocalizationRewriteDiagnostic[] = [];

  for (const entry of orderedEntries) {
    const result = rewriteOne(sourceFile, entry, options);
    if ("change" in result) {
      changes.push(result.change);
    } else {
      diagnostics.push(result.diagnostic);
    }
  }

  const rewrittenText = sourceFile.getFullText();

  return {
    filePath,
    originalText: sourceText,
    rewrittenText,
    changes: changes.sort((left, right) => left.start - right.start),
    diagnostics,
    changed: rewrittenText !== sourceText,
  };
}
