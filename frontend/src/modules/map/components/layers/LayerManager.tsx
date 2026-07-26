import {
  useMemo,
  useRef,
  useState,
} from "react";

import { useLayers } from "../../hooks/useLayers";
import type { GisLayerDefinition } from "../../types/gis";
import "./styles/LayerManager.css";

type LayerFilter = "all" | "visible" | "hidden" | "locked";
type LayerSort = "order" | "title" | "features";

interface MenuState {
  layer: GisLayerDefinition;
  x: number;
  y: number;
}

function createId(prefix: string): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 9)}`;
}

function safeFileName(value: string): string {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]+/g, "-")
      .replace(/^-+|-+$/g, "") || "layer"
  );
}

function downloadJson(
  name: string,
  value: unknown,
): void {
  const blob = new Blob(
    [JSON.stringify(value, null, 2)],
    { type: "application/json" },
  );
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = name;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export interface LayerManagerProps {
  className?: string;
}

export function LayerManager({
  className = "",
}: LayerManagerProps) {
  const { layers, activeLayer, commands } = useLayers();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const draggedLayerId = useRef<string | null>(null);

  const [query, setQuery] = useState("");
  const [filter, setFilter] =
    useState<LayerFilter>("all");
  const [sort, setSort] =
    useState<LayerSort>("order");
  const [collapsed, setCollapsed] =
    useState<Set<string>>(() => new Set());
  const [expandedRows, setExpandedRows] =
    useState<Set<string>>(() => new Set());
  const [menu, setMenu] =
    useState<MenuState>();
  const [renamingId, setRenamingId] =
    useState<string>();
  const [renameValue, setRenameValue] =
    useState("");

  const visibleLayers = useMemo(() => {
    const term = query.trim().toLowerCase();

    const result = layers.filter((layer) => {
      const matchesQuery =
        !term ||
        layer.title.toLowerCase().includes(term) ||
        layer.sourceName?.toLowerCase().includes(term) ||
        layer.tags?.some((tag) =>
          tag.toLowerCase().includes(term),
        );

      const matchesFilter =
        filter === "all" ||
        (filter === "visible" && layer.visible) ||
        (filter === "hidden" && !layer.visible) ||
        (filter === "locked" && layer.locked);

      return matchesQuery && matchesFilter;
    });

    return [...result].sort((left, right) => {
      if (sort === "title") {
        return left.title.localeCompare(right.title);
      }

      if (sort === "features") {
        return (
          (right.featureCount ?? 0) -
          (left.featureCount ?? 0)
        );
      }

      return left.order - right.order;
    });
  }, [filter, layers, query, sort]);

  const groups = useMemo(() => {
    const result = new Map<
      string,
      GisLayerDefinition[]
    >();

    visibleLayers.forEach((layer) => {
      const group = String(
        layer.group ?? "UNGROUPED",
      );

      const current = result.get(group) ?? [];
      current.push(layer);
      result.set(group, current);
    });

    return Array.from(result.entries()).sort(
      ([left], [right]) =>
        left.localeCompare(right),
    );
  }, [visibleLayers]);

  function toggleSetValue(
    setter: React.Dispatch<
      React.SetStateAction<Set<string>>
    >,
    value: string,
  ) {
    setter((current) => {
      const next = new Set(current);

      if (next.has(value)) {
        next.delete(value);
      } else {
        next.add(value);
      }

      return next;
    });
  }

  function nextOrder(): number {
    return (
      layers.reduce(
        (maximum, layer) =>
          Math.max(maximum, layer.order),
        -1,
      ) + 1
    );
  }

  function createDrawingLayer() {
    const layer: GisLayerDefinition = {
      id: createId("drawing"),
      title: `Drawing Layer ${layers.length + 1}`,
      kind: "vector" as GisLayerDefinition["kind"],
      group:
        "OPERATIONAL" as GisLayerDefinition["group"],
      visible: true,
      locked: false,
      opacity: 1,
      order: nextOrder(),
      readOnly: false,
      selectable: true,
      editable: true,
      removable: true,
      exportable: true,
      expanded: true,
      featureCount: 0,
      sourceName: "JCWS Drawing",
      security: "UNCLASSIFIED",
      metadata: {
        sourceType: "drawing",
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    commands.addLayer(layer);
    commands.setActiveLayer(layer.id);
  }

  async function importGeoJson(
    file: File,
  ): Promise<void> {
    const data = JSON.parse(
      await file.text(),
    ) as {
      type?: string;
      features?: unknown[];
      name?: string;
    };

    if (
      data.type !== "FeatureCollection" &&
      data.type !== "Feature"
    ) {
      throw new Error(
        "The selected file is not valid GeoJSON.",
      );
    }

    const layer: GisLayerDefinition = {
      id: createId("geojson"),
      title:
        data.name ||
        file.name.replace(/\.(geo)?json$/i, ""),
      kind: "vector" as GisLayerDefinition["kind"],
      group:
        "INTELLIGENCE" as GisLayerDefinition["group"],
      visible: true,
      locked: false,
      opacity: 1,
      order: nextOrder(),
      readOnly: false,
      selectable: true,
      editable: true,
      removable: true,
      exportable: true,
      expanded: false,
      featureCount:
        data.type === "FeatureCollection"
          ? data.features?.length ?? 0
          : 1,
      sourceName: file.name,
      security: "UNCLASSIFIED",
      metadata: {
        sourceType: "geojson",
        geojson: data,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    commands.addLayer(layer);
    commands.setActiveLayer(layer.id);
  }

  function duplicateLayer(
    source: GisLayerDefinition,
  ) {
    const copy: GisLayerDefinition = {
      ...source,
      id: createId("copy"),
      title: `${source.title} Copy`,
      order: nextOrder(),
      metadata: source.metadata
        ? { ...source.metadata }
        : undefined,
      tags: source.tags
        ? [...source.tags]
        : undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    commands.addLayer(copy);
    commands.setActiveLayer(copy.id);
  }

  function exportGeoJson(
    layer: GisLayerDefinition,
  ) {
    const geojson =
      layer.metadata?.geojson ?? {
        type: "FeatureCollection",
        name: layer.title,
        features: [],
        properties: {
          layerId: layer.id,
          security: layer.security,
        },
      };

    downloadJson(
      `${safeFileName(layer.title)}.geojson`,
      geojson,
    );
  }

  function handleDrop(
    target: GisLayerDefinition,
    event: React.DragEvent,
  ) {
    event.preventDefault();

    const source = layers.find(
      (layer) =>
        layer.id === draggedLayerId.current,
    );

    if (!source || source.id === target.id) {
      return;
    }

    commands.moveLayer(source.id, target.order);
    commands.moveLayer(target.id, source.order);
    draggedLayerId.current = null;
  }

  function commitRename(
    layer: GisLayerDefinition,
  ) {
    const title = renameValue.trim();

    if (title && title !== layer.title) {
      commands.renameLayer(layer.id, title);
    }

    setRenamingId(undefined);
    setRenameValue("");
  }

  return (
    <aside
      className={`jcws-layer-manager ${className}`.trim()}
      aria-label="Layer Manager"
      onClick={() => setMenu(undefined)}
    >
      <header className="jcws-layer-manager__header">
        <div>
          <strong>Layer Manager</strong>
          <small>
            {layers.length} layers Â·{" "}
            {
              layers.filter(
                (layer) => layer.visible,
              ).length
            }{" "}
            visible
          </small>
        </div>

        {activeLayer && (
          <span title={activeLayer.title}>
            Active: {activeLayer.title}
          </span>
        )}
      </header>

      <div className="jcws-layer-toolbar">
        <div>
          <button
            type="button"
            onClick={createDrawingLayer}
          >
            + Layer
          </button>
          <button
            type="button"
            onClick={() =>
              fileInputRef.current?.click()
            }
          >
            Import
          </button>
          <button
            type="button"
            onClick={() =>
              setCollapsed(new Set())
            }
          >
            Expand
          </button>
          <button
            type="button"
            onClick={() =>
              setCollapsed(
                new Set(
                  groups.map(([group]) => group),
                ),
              )
            }
          >
            Collapse
          </button>
        </div>

        <input
          type="search"
          value={query}
          placeholder="Search layers..."
          onChange={(event) =>
            setQuery(event.target.value)
          }
        />

        <div>
          <select
            value={filter}
            onChange={(event) =>
              setFilter(
                event.target.value as LayerFilter,
              )
            }
          >
            <option value="all">All</option>
            <option value="visible">Visible</option>
            <option value="hidden">Hidden</option>
            <option value="locked">Locked</option>
          </select>

          <select
            value={sort}
            onChange={(event) =>
              setSort(
                event.target.value as LayerSort,
              )
            }
          >
            <option value="order">Map order</option>
            <option value="title">Name</option>
            <option value="features">
              Feature count
            </option>
          </select>
        </div>
      </div>

      <input
        ref={fileInputRef}
        hidden
        type="file"
        accept=".json,.geojson,application/json,application/geo+json"
        onChange={async (event) => {
          const file = event.target.files?.[0];

          if (!file) {
            return;
          }

          try {
            await importGeoJson(file);
          } catch (error) {
            window.alert(
              error instanceof Error
                ? error.message
                : "Import failed.",
            );
          } finally {
            event.target.value = "";
          }
        }}
      />

      <div className="jcws-layer-manager__content">
        {groups.length === 0 && (
          <div className="jcws-layer-empty">
            <strong>No matching layers</strong>
            <span>
              Import GeoJSON or create a drawing
              layer.
            </span>
          </div>
        )}

        {groups.map(([group, groupLayers]) => {
          const isCollapsed =
            collapsed.has(group);

          return (
            <section
              key={group}
              className="jcws-layer-group"
            >
              <button
                type="button"
                className="jcws-layer-group__header"
                onClick={() =>
                  toggleSetValue(
                    setCollapsed,
                    group,
                  )
                }
              >
                <span>
                  {isCollapsed ? "â–¸" : "â–¾"}
                </span>
                <strong>{group}</strong>
                <span>{groupLayers.length}</span>
                <small>
                  {
                    groupLayers.filter(
                      (layer) => layer.visible,
                    ).length
                  }{" "}
                  visible
                </small>
              </button>

              {!isCollapsed &&
                groupLayers.map((layer) => {
                  const expanded =
                    expandedRows.has(layer.id);
                  const renaming =
                    renamingId === layer.id;

                  return (
                    <article
                      key={layer.id}
                      draggable
                      className={[
                        "jcws-layer-item",
                        activeLayer?.id === layer.id
                          ? "jcws-layer-item--active"
                          : "",
                        layer.visible
                          ? ""
                          : "jcws-layer-item--hidden",
                      ].join(" ")}
                      onDragStart={(event) => {
                        draggedLayerId.current =
                          layer.id;
                        event.dataTransfer.effectAllowed =
                          "move";
                      }}
                      onDragOver={(event) => {
                        event.preventDefault();
                      }}
                      onDrop={(event) =>
                        handleDrop(layer, event)
                      }
                      onContextMenu={(event) => {
                        event.preventDefault();
                        event.stopPropagation();

                        setMenu({
                          layer,
                          x: Math.min(
                            event.clientX,
                            window.innerWidth - 220,
                          ),
                          y: Math.min(
                            event.clientY,
                            window.innerHeight - 245,
                          ),
                        });
                      }}
                    >
                      <div
                        className="jcws-layer-item__main"
                        role="button"
                        tabIndex={0}
                        onClick={() =>
                          commands.setActiveLayer(
                            layer.id,
                          )
                        }
                        onKeyDown={(event) => {
                          if (
                            event.key === "Enter" ||
                            event.key === " "
                          ) {
                            commands.setActiveLayer(
                              layer.id,
                            );
                          }
                        }}
                      >
                        <button
                          type="button"
                          title={
                            layer.visible
                              ? "Hide layer"
                              : "Show layer"
                          }
                          onClick={(event) => {
                            event.stopPropagation();
                            commands.toggleVisibility(
                              layer.id,
                            );
                          }}
                        >
                          {layer.visible ? "â—‰" : "â—‹"}
                        </button>

                        <button
                          type="button"
                          title={
                            layer.locked
                              ? "Unlock layer"
                              : "Lock layer"
                          }
                          onClick={(event) => {
                            event.stopPropagation();
                            commands.toggleLock(
                              layer.id,
                            );
                          }}
                        >
                          {layer.locked ? "ðŸ”’" : "ðŸ”“"}
                        </button>

                        <span
                          className="jcws-layer-symbol"
                          style={{
                            background:
                              layer.color ?? undefined,
                          }}
                        />

                        <div className="jcws-layer-identity">
                          {renaming ? (
                            <input
                              autoFocus
                              value={renameValue}
                              onClick={(event) =>
                                event.stopPropagation()
                              }
                              onChange={(event) =>
                                setRenameValue(
                                  event.target.value,
                                )
                              }
                              onBlur={() =>
                                commitRename(layer)
                              }
                              onKeyDown={(event) => {
                                if (
                                  event.key === "Enter"
                                ) {
                                  commitRename(layer);
                                }

                                if (
                                  event.key === "Escape"
                                ) {
                                  setRenamingId(
                                    undefined,
                                  );
                                }
                              }}
                            />
                          ) : (
                            <button
                              type="button"
                              className="jcws-layer-title"
                              onDoubleClick={(
                                event,
                              ) => {
                                event.stopPropagation();
                                setRenamingId(
                                  layer.id,
                                );
                                setRenameValue(
                                  layer.title,
                                );
                              }}
                            >
                              {layer.title}
                            </button>
                          )}

                          <small>
                            {layer.featureCount ?? 0}{" "}
                            features
                            {layer.metadata?.live ===
                              true && (
                              <b> LIVE</b>
                            )}
                          </small>
                        </div>

                        <span className="jcws-layer-security">
                          {String(
                            layer.security ??
                              "UNCLASSIFIED",
                          ).replaceAll("_", " ")}
                        </span>

                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            toggleSetValue(
                              setExpandedRows,
                              layer.id,
                            );
                          }}
                        >
                          {expanded ? "â–´" : "â–¾"}
                        </button>
                      </div>

                      {expanded && (
                        <div className="jcws-layer-details">
                          <label>
                            <span>Opacity</span>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              step="5"
                              disabled={layer.locked}
                              value={Math.round(
                                layer.opacity * 100,
                              )}
                              onChange={(event) =>
                                commands.setOpacity(
                                  layer.id,
                                  Number(
                                    event.target.value,
                                  ) / 100,
                                )
                              }
                            />
                            <output>
                              {Math.round(
                                layer.opacity * 100,
                              )}
                              %
                            </output>
                          </label>

                          <div>
                            <span>
                              Type: {String(layer.kind)}
                            </span>
                            <span>
                              Order: {layer.order}
                            </span>
                            <span>
                              Editable:{" "}
                              {layer.editable &&
                              !layer.readOnly
                                ? "Yes"
                                : "No"}
                            </span>
                          </div>
                        </div>
                      )}
                    </article>
                  );
                })}
            </section>
          );
        })}
      </div>

      {menu && (
        <div
          className="jcws-layer-menu"
          style={{
            left: menu.x,
            top: menu.y,
          }}
          onClick={(event) =>
            event.stopPropagation()
          }
        >
          <strong>{menu.layer.title}</strong>

          <button
            type="button"
            onClick={() => {
              setRenamingId(menu.layer.id);
              setRenameValue(menu.layer.title);
              setMenu(undefined);
            }}
          >
            Rename
          </button>

          <button
            type="button"
            onClick={() => {
              duplicateLayer(menu.layer);
              setMenu(undefined);
            }}
          >
            Duplicate
          </button>

          <button
            type="button"
            onClick={() => {
              exportGeoJson(menu.layer);
              setMenu(undefined);
            }}
          >
            Export GeoJSON
          </button>

          <button
            type="button"
            onClick={() => {
              downloadJson(
                `${safeFileName(
                  menu.layer.title,
                )}-metadata.json`,
                menu.layer,
              );
              setMenu(undefined);
            }}
          >
            Export metadata
          </button>

          <button
            type="button"
            className="danger"
            disabled={
              menu.layer.removable === false
            }
            onClick={() => {
              if (
                menu.layer.removable !== false &&
                window.confirm(
                  `Delete "${menu.layer.title}"?`,
                )
              ) {
                commands.removeLayer(
                  menu.layer.id,
                );
              }

              setMenu(undefined);
            }}
          >
            Delete
          </button>
        </div>
      )}
    </aside>
  );
}