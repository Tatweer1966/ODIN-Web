import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import {
  afterEach,
  describe,
  expect,
  it,
} from "vitest";

import { localeScanCommand } from "../src/commands/locale-scan.js";

const temporaryDirectories: string[] = [];

function createRepository(): string {
  const root = fs.mkdtempSync(
    path.join(os.tmpdir(), "jcws-locale-"),
  );

  temporaryDirectories.push(root);

  fs.mkdirSync(path.join(root, "src"), {
    recursive: true,
  });

  fs.writeFileSync(
    path.join(root, "tsconfig.json"),
    JSON.stringify(
      {
        compilerOptions: {
          jsx: "react-jsx",
          target: "ES2022",
          module: "NodeNext",
          moduleResolution: "NodeNext",
        },
        include: ["src"],
      },
      null,
      2,
    ),
    "utf8",
  );

  return root;
}

afterEach(() => {
  for (const directory of temporaryDirectories) {
    fs.rmSync(directory, {
      recursive: true,
      force: true,
    });
  }

  temporaryDirectories.length = 0;
});

describe("localeScanCommand", () => {
  it("detects hard-coded JSX text", () => {
    const root = createRepository();

    fs.writeFileSync(
      path.join(root, "src", "App.tsx"),
      `
export function App() {
  return (
    <main>
      <h1>Command Center</h1>
      <button className="primary">Save Mission</button>
    </main>
  );
}
`,
      "utf8",
    );

    const result = localeScanCommand({
      cwd: root,
    });

    expect(result.filesScanned).toBe(1);
    expect(
      result.findings.map((finding) => finding.value),
    ).toContain("Command Center");
    expect(
      result.findings.map((finding) => finding.value),
    ).toContain("Save Mission");
    expect(
      result.findings.map((finding) => finding.value),
    ).not.toContain("primary");
  });

  it("ignores existing translation calls", () => {
    const root = createRepository();

    fs.writeFileSync(
      path.join(root, "src", "Panel.tsx"),
      `
export function Panel() {
  return <h2>{t("workspace.title")}</h2>;
}
`,
      "utf8",
    );

    const result = localeScanCommand({
      cwd: root,
    });

    expect(result.findings).toHaveLength(0);
  });
});