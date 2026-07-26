import type { ExerciseCell } from "../../exercise";

export type Permission =
  | "exercise.read"
  | "exercise.control"
  | "map.read"
  | "map.edit"
  | "simulation.control"
  | "adjudication.manage"
  | "system.admin";

const permissionsByCell: Record<ExerciseCell, readonly Permission[]> = {
  EXCON: ["exercise.read", "exercise.control", "map.read", "map.edit", "simulation.control", "adjudication.manage", "system.admin"],
  BLUEFOR: ["exercise.read", "map.read", "map.edit"],
  REDFOR: ["exercise.read", "map.read", "map.edit"],
  "WHITE CELL": ["exercise.read", "map.read", "simulation.control", "adjudication.manage"],
  OBSERVER: ["exercise.read", "map.read"],
};

export function hasPermission(cell: ExerciseCell, permission: Permission) {
  return permissionsByCell[cell].includes(permission);
}
