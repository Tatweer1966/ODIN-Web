import Draw from "ol/interaction/Draw";
import type BaseLayer from "ol/layer/Base";
import type Map from "ol/Map";
import { unByKey } from "ol/Observable";
import { fromLonLat, toLonLat } from "ol/proj";
import type VectorSource from "ol/source/Vector";
import {
  Layers3,
  PanelLeftClose,
  PanelRightClose,
  Satellite,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { InspectorPanel } from "../components/InspectorPanel";
import { LayerManager } from "../components/layers";
import { MapToolbar } from "../components/MapToolbar";
import {
  createOperationalMap,
  type OperationalMapBundle,
} from "../engine/createOperationalMap";
import { useLayers } from "../hooks/useLayers";
import { MapLayerIntegration } from "../integration";
import { layerRegistry } from "../services/layerRegistryInstance";
import type { MapTool } from "../types";

type SourceBackedLayer = BaseLayer & {
  getSource?: () => VectorSource | null;
};

function resolveDrawingLayerId(
  activeLayer:
    | {
        id: string;
        kind: string;
        editable?: boolean;
        locked: boolean;
      }
    | undefined,
): string {
  if (
    activeLayer?.kind === "vector" &&
    activeLayer.editable === true &&
    activeLayer.locked === false
  ) {
    return activeLayer.id;
  }

  return "user-graphics";
}

export function MapWorkspacePage() {
  const targetRef = useRef<HTMLDivElement | null>(null);
  const bundleRef = useRef<OperationalMapBundle | null>(null);
  const integrationRef = useRef<MapLayerIntegration | null>(null);
  const drawRef = useRef<Draw | null>(null);

  const { layers, activeLayer } = useLayers();

  const [activeTool, setActiveTool] =
    useState<MapTool>("select");

  const [coordinate, setCoordinate] = useState(
    "32.5500° E, 30.1200° N",
  );

  const [zoom, setZoom] = useState(10);
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);

  useEffect(() => {
    const target = targetRef.current;

    if (!target) {
      return;
    }

    const bundle = createOperationalMap(target);
    bundleRef.current = bundle;

    /*
     * OpenLayers may initialize before the browser finishes calculating the
     * CSS grid dimensions. Recalculate after the next animation frame.
     */
    window.requestAnimationFrame(() => {
      bundle.map.updateSize();
    });

    const integration = new MapLayerIntegration(
      bundle.map,
      bundle.layers,
      {
        removeLayerFromMapOnUnbind: false,
        ignoreUnknownLayers: false,
        allowUnboundRegistryLayers: true,
      },
    );

    integration.initialize();
    integrationRef.current = integration;

    if (!layerRegistry.getSnapshot().activeLayerId) {
      integration.setActiveLayer("user-graphics");
    }

    const pointerKey = bundle.map.on(
      "pointermove",
      (event) => {
        const [longitude, latitude] = toLonLat(
          event.coordinate,
        );

        setCoordinate(
          `${longitude.toFixed(4)}° E, ${latitude.toFixed(4)}° N`,
        );
      },
    );

    const resolutionKey = bundle.map
      .getView()
      .on("change:resolution", () => {
        setZoom(
          Math.round(
            bundle.map.getView().getZoom() ?? 0,
          ),
        );
      });

    return () => {
      if (drawRef.current) {
        bundle.map.removeInteraction(drawRef.current);
        drawRef.current = null;
      }

      unByKey(pointerKey);
      unByKey(resolutionKey);

      integration.dispose();

      integrationRef.current = null;
      bundleRef.current = null;

      bundle.map.setTarget(undefined);
    };
  }, []);


  /*
   * Phase 2.7.1 map container resize synchronization
   *
   * The map width changes when the Layer Manager or Inspector opens/closes.
   * ResizeObserver also handles route layout, browser resizing and shell
   * dimension changes.
   */
  useEffect(() => {
    const target = targetRef.current;

    if (!target) {
      return;
    }

    let animationFrame: number | null = null;

    const updateMapSize = (): void => {
      if (animationFrame !== null) {
        window.cancelAnimationFrame(animationFrame);
      }

      animationFrame = window.requestAnimationFrame(() => {
        const map = bundleRef.current?.map;

        if (!map) {
          return;
        }

        const bounds = target.getBoundingClientRect();

        if (bounds.width > 0 && bounds.height > 0) {
          map.updateSize();
        }
      });
    };

    const resizeObserver = new ResizeObserver(() => {
      updateMapSize();
    });

    resizeObserver.observe(target);
    updateMapSize();

    return () => {
      resizeObserver.disconnect();

      if (animationFrame !== null) {
        window.cancelAnimationFrame(animationFrame);
      }
    };
  }, []);

  useEffect(() => {
    const animationFrame = window.requestAnimationFrame(() => {
      bundleRef.current?.map.updateSize();
    });

    return () => {
      window.cancelAnimationFrame(animationFrame);
    };
  }, [leftOpen, rightOpen]);

  useEffect(() => {
    const integration = integrationRef.current;
    const bundle = bundleRef.current;

    if (!integration || !bundle) {
      return;
    }

    if (drawRef.current) {
      bundle.map.removeInteraction(drawRef.current);
      drawRef.current = null;
    }

    if (
      activeTool === "select" ||
      activeTool === "measure"
    ) {
      return;
    }

    const drawingLayerId = resolveDrawingLayerId(activeLayer);

    const liveLayer = integration.getLayer(
      drawingLayerId,
    ) as SourceBackedLayer | undefined;

    const source = liveLayer?.getSource?.();

    if (!source) {
      console.warn(
        `Drawing tool could not find a vector source for layer "${drawingLayerId}".`,
      );

      return;
    }

    const drawType =
      activeTool === "point"
        ? "Point"
        : activeTool === "line"
          ? "LineString"
          : activeTool === "polygon"
            ? "Polygon"
            : "Circle";

    const draw = new Draw({
      source,
      type: drawType,
    });

    draw.on("drawend", () => {
      if (layerRegistry.hasLayer(drawingLayerId)) {
        layerRegistry.incrementFeatureCount(
          drawingLayerId,
          1,
        );
      }
    });

    bundle.map.addInteraction(draw);
    drawRef.current = draw;

    return () => {
      bundle.map.removeInteraction(draw);

      if (drawRef.current === draw) {
        drawRef.current = null;
      }
    };
  }, [
    activeTool,
    activeLayer?.id,
    activeLayer?.kind,
    activeLayer?.editable,
    activeLayer?.locked,
  ]);

  const getMap = (): Map | undefined =>
    bundleRef.current?.map;

  const resetMap = (): void => {
    getMap()
      ?.getView()
      .animate({
        center: fromLonLat([32.55, 30.12]),
        zoom: 10,
        duration: 500,
      });
  };

  const zoomBy = (delta: number): void => {
    const view = getMap()?.getView();

    if (!view) {
      return;
    }

    view.animate({
      zoom: (view.getZoom() ?? 10) + delta,
      duration: 180,
    });
  };

  const visibleLayerCount = layers.filter(
    (layer) => layer.visible,
  ).length;

  return (
    <div
      className={[
        "operational-map-page",
        leftOpen ? "left-open" : "",
        rightOpen ? "right-open" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="map-page-header">
        <div>
          <div className="map-eyebrow">
            <ShieldCheck size={15} />
            JOINT SHIELD 2027 / PLANNING
          </div>

          <h1>Operational Map Workspace</h1>

          <p>
            Shared tactical picture, force tracking and
            operational graphics.
          </p>
        </div>

        <div className="map-header-actions">
          <button type="button">
            <Satellite size={17} />
            BASEMAP
          </button>

          <button type="button">
            <Layers3 size={17} />
            OVERLAYS
            <span>{visibleLayerCount}</span>
          </button>
        </div>
      </div>

      <div className="map-workspace-grid">
        {leftOpen && <LayerManager />}

        <section className="map-canvas-shell">
          <div
            ref={targetRef}
            className="operational-map"
          />

          <MapToolbar
            activeTool={activeTool}
            onTool={setActiveTool}
            onZoomIn={() => zoomBy(1)}
            onZoomOut={() => zoomBy(-1)}
            onReset={resetMap}
          />

          <button
            type="button"
            className="map-panel-toggle left"
            aria-label={
              leftOpen
                ? "Close layer manager"
                : "Open layer manager"
            }
            onClick={() =>
              setLeftOpen((current) => !current)
            }
          >
            <PanelLeftClose size={17} />
          </button>

          <button
            type="button"
            className="map-panel-toggle right"
            aria-label={
              rightOpen
                ? "Close inspector"
                : "Open inspector"
            }
            onClick={() =>
              setRightOpen((current) => !current)
            }
          >
            <PanelRightClose size={17} />
          </button>

          <div className="map-scale-card">
            <span>ZOOM</span>
            <strong>{zoom}</strong>

            <i />

            <span>SCALE</span>
            <strong>
              1:
              {Math.max(
                1000,
                Math.round(
                  591657550 / Math.pow(2, zoom),
                ),
              ).toLocaleString()}
            </strong>
          </div>

          <div className="map-grid-overlay" />
        </section>

        {rightOpen && (
          <InspectorPanel coordinate={coordinate} />
        )}
      </div>
    </div>
  );
}
