import path from "node:path";

import type { FindingKeyContext } from "./types.js";

const stopWords = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "by",
  "for",
  "from",
  "in",
  "is",
  "it",
  "of",
  "on",
  "or",
  "that",
  "the",
  "this",
  "to",
  "was",
  "with",
]);

export class TranslationKeyGenerator {
  generate(context: FindingKeyContext): string {
    const fileSegment = this.getFileSegment(
      context.finding.filePath,
    );

    const valueSegment = this.getValueSegment(
      context.finding.value,
    );

    return [
      this.normalizeSegment(context.namespace),
      fileSegment,
      valueSegment,
    ]
      .filter((segment) => segment.length > 0)
      .join(".");
  }

  private getFileSegment(filePath: string): string {
    const parsed = path.parse(filePath);

    const fileName = parsed.name
      .replace(/\.test$/u, "")
      .replace(/\.spec$/u, "");

    return this.normalizeSegment(fileName);
  }

  private getValueSegment(value: string): string {
    const words = value
      .normalize("NFKD")
      .replace(/[^\p{L}\p{N}\s_-]/gu, " ")
      .split(/[\s_-]+/u)
      .map((word) => word.trim().toLowerCase())
      .filter((word) => word.length > 0)
      .filter((word) => !stopWords.has(word))
      .slice(0, 6);

    if (words.length === 0) {
      return "text";
    }

    return words
      .map((word, index) => {
        if (index === 0) {
          return word;
        }

        return (
          word.charAt(0).toUpperCase() +
          word.slice(1)
        );
      })
      .join("");
  }

  private normalizeSegment(value: string): string {
    const normalized = value
      .normalize("NFKD")
      .replace(/[^\p{L}\p{N}\s_-]/gu, " ")
      .trim()
      .split(/[\s_-]+/u)
      .filter((part) => part.length > 0)
      .map((part) => part.toLowerCase());

    if (normalized.length === 0) {
      return "";
    }

    return normalized
      .map((part, index) => {
        if (index === 0) {
          return part;
        }

        return (
          part.charAt(0).toUpperCase() +
          part.slice(1)
        );
      })
      .join("");
  }
}