import type {
  ClassifiedLocalizationEntry,
  ClassifiedLocalizationPlan,
  LocalizationConfidence,
} from "./types.js";

function escapeMarkdown(value: string): string {
  return value
    .replaceAll("\\", "\\\\")
    .replaceAll("|", "\\|")
    .replaceAll("\n", " ");
}

function renderEntry(
  entry: ClassifiedLocalizationEntry,
): string {
  const classification = entry.classification;
  const reasons = classification.reasons.join("; ");

  return [
    `| \`${escapeMarkdown(entry.sourceValue)}\``,
    `\`${escapeMarkdown(entry.key)}\``,
    classification.category,
    classification.confidence,
    classification.export ? "Yes" : "No",
    `\`${escapeMarkdown(entry.filePath)}:${String(entry.line)}\``,
    escapeMarkdown(reasons),
    "|",
  ].join(" | ");
}

function entriesByConfidence(
  entries: ClassifiedLocalizationEntry[],
  confidence: LocalizationConfidence,
): ClassifiedLocalizationEntry[] {
  return entries.filter(
    (entry) =>
      entry.classification.confidence === confidence,
  );
}

function renderSection(
  title: string,
  entries: ClassifiedLocalizationEntry[],
): string[] {
  if (entries.length === 0) {
    return [
      `## ${title}`,
      "",
      "_No entries._",
      "",
    ];
  }

  return [
    `## ${title}`,
    "",
    "| Text | Suggested key | Category | Confidence | Export | Source | Reason |",
    "|---|---|---|---|---|---|---|",
    ...entries.map(renderEntry),
    "",
  ];
}

export function createClassificationMarkdownReport(
  plan: ClassifiedLocalizationPlan,
): string {
  const high = entriesByConfidence(
    plan.entries,
    "high",
  );
  const medium = entriesByConfidence(
    plan.entries,
    "medium",
  );
  const low = entriesByConfidence(
    plan.entries,
    "low",
  );

  const categoryRows = Object.entries(
    plan.summary.categories,
  )
    .sort(([left], [right]) =>
      left.localeCompare(right),
    )
    .map(
      ([category, count]) =>
        `| ${category} | ${String(count)} |`,
    );

  const lines = [
    "# Localization Classification Report",
    "",
    `Generated: ${plan.generatedAt}`,
    "",
    "## Summary",
    "",
    `- Files scanned: ${String(plan.filesScanned)}`,
    `- Findings: ${String(plan.findingsCount)}`,
    `- Exportable: ${String(plan.summary.exportable)}`,
    `- Ignored: ${String(plan.summary.ignored)}`,
    `- High confidence: ${String(plan.summary.highConfidence)}`,
    `- Medium confidence: ${String(plan.summary.mediumConfidence)}`,
    `- Low confidence: ${String(plan.summary.lowConfidence)}`,
    "",
    "## Categories",
    "",
    "| Category | Count |",
    "|---|---:|",
    ...categoryRows,
    "",
    ...renderSection("High confidence", high),
    ...renderSection("Medium confidence", medium),
    ...renderSection(
      "Low confidence and ignored",
      low,
    ),
  ];

  return `${lines.join("\n")}\n`;
}
