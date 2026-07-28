import type { ClassifiedLocalizationEntry } from "../../classification/types.js";

function quote(value: string): string {
  return JSON.stringify(value);
}

function interpolationName(expressionText: string, index: number): string {
  const trimmed = expressionText.trim();
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/u.test(trimmed)
    ? trimmed
    : `value${String(index + 1)}`;
}

export function buildTranslationCall(
  entry: ClassifiedLocalizationEntry,
  translationFunction: string,
  expressions: readonly string[] = [],
): string {
  if (expressions.length === 0) {
    return `${translationFunction}(${quote(entry.key)})`;
  }

  const properties = expressions.map((expression, index) => {
    const name = interpolationName(expression, index);
    const trimmed = expression.trim();
    return name === trimmed ? name : `${name}: ${trimmed}`;
  });

  return `${translationFunction}(${quote(entry.key)}, { ${properties.join(", ")} })`;
}

export function buildJsxTranslationExpression(
  entry: ClassifiedLocalizationEntry,
  translationFunction: string,
): string {
  return `{${buildTranslationCall(entry, translationFunction)}}`;
}

