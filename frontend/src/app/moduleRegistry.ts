export interface AppModuleDefinition {
  id: string;
  title: string;
  route: string;
  status: "active" | "planned";
}

export const moduleRegistry: readonly AppModuleDefinition[] = [
  { id: "dashboard", title: "Command Dashboard", route: "/dashboard", status: "active" },
  { id: "map", title: "Operational Map", route: "/workspace", status: "active" },
  { id: "exercise", title: "Exercise Manager", route: "/exercise", status: "planned" },
  { id: "orbat", title: "ORBAT", route: "/orbat", status: "planned" },
  { id: "coa", title: "COA Planner", route: "/coa", status: "planned" },
  { id: "opord", title: "OPORD", route: "/opord", status: "planned" },
  { id: "msel", title: "MSEL & Injects", route: "/msel", status: "planned" },
  { id: "replay", title: "Replay", route: "/replay", status: "planned" },
  { id: "aar", title: "After Action Review", route: "/aar", status: "planned" },
];
