import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import {
  afterEach,
  describe,
  expect,
  it,
} from "vitest";

import { localePlanCommand } from "../src/commands/locale-plan.js";

const temporaryDirectories: string[] = [];

function createRepository(): string {
  const root = fs.mkdtempSync(
    path.join(os.tmpdir(), "jcws-locale-plan-"),
  );

  temporaryDirectories.push(root);

  fs.mkdirSync(path.join(root, "src"), {
    recursive: true,
  });

  fs.mkdirSync(path.join(root, "locales"), {
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

describe("localePlanCommand", () => {
  it("creates migration entries for hard-coded text", () => {
    const root = createRepository();

    fs.writeFileSync(
      path.join(root, "src", "MissionPanel.tsx"),
      `
export function MissionPanel() {
  return (
    <section>
      <h1>Mission Control</h1>
      <button>Save Mission</button>
    </section>
  );
}
`,
      "utf8",
    );

    const plan = localePlanCommand(
      { cwd: root },
      {
        namespace: "workspace",
      },
    );

    expect(plan.entries).toHaveLength(2);
    expect(plan.summary.newKeys).toBe(2);

    expect(
      plan.entries.map((entry) => entry.key),
    ).toContain(
      "workspace.missionpanel.missionControl",
    );

    expect(
      plan.entries.map((entry) => entry.key),
    ).toContain(
      "workspace.missionpanel.saveMission",
    );
  });

  it("reuses an existing key with the same value", () => {
    const root = createRepository();

    fs.writeFileSync(
      path.join(root, "src", "Toolbar.tsx"),
      `
export function Toolbar() {
  return <button>Save Mission</button>;
}
`,
      "utf8",
    );

    fs.writeFileSync(
      path.join(root, "locales", "en.json"),
      JSON.stringify(
        {
          mission: {
            save: "Save Mission",
          },
        },
        null,
        2,
      ),
      "utf8",
    );

    const plan = localePlanCommand(
      { cwd: root },
      {
        englishCatalog: "locales/en.json",
      },
    );

    expect(plan.entries).toHaveLength(1);
    expect(plan.entries[0]?.status).toBe(
      "existing-value",
    );
    expect(plan.entries[0]?.key).toBe(
      "mission.save",
    );
  });
});