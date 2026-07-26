import Draw from "ol/interaction/Draw";
import type Map from "ol/Map";
import { fromLonLat, toLonLat } from "ol/proj";
import { unByKey } from "ol/Observable";
import type VectorSource from "ol/source/Vector";
import { Layers3, PanelLeftClose, PanelRightClose, Satellite, ShieldCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { InspectorPanel } from "../components/InspectorPanel";
import { LayerTree } from "../components/LayerTree";
import { MapToolbar } from "../components/MapToolbar";
import { createOperationalMap, type OperationalMapBundle } from "../engine/createOperationalMap";
import type { MapTool, OperationalLayer } from "../types";

const initialLayers: OperationalLayer[] = [
  { id: "basemap", name: "OpenStreetMap Tactical", category: "BASE MAPS", visible: true, locked: true, opacity: 55, featureCount: 1 },
  { id: "control-measures", name: "Control Measures", category: "OPERATIONAL GRAPHICS", visible: true, locked: false, opacity: 100, featureCount: 3 },
  { id: "blue-units", name: "BLUEFOR Units", category: "FORCE TRACKING", visible: true, locked: false, opacity: 100, featureCount: 3 },
  { id: "red-units", name: "REDFOR Units", category: "FORCE TRACKING", visible: true, locked: false, opacity: 100, featureCount: 2 },
  { id: "user-graphics", name: "User Graphics", category: "WORKING LAYERS", visible: true, locked: false, opacity: 100, featureCount: 0 },
];

export function MapWorkspacePage() {
  const targetRef = useRef<HTMLDivElement | null>(null);
  const bundleRef = useRef<OperationalMapBundle | null>(null);
  const drawRef = useRef<Draw | null>(null);
  const [activeTool, setActiveTool] = useState<MapTool>("select");
  const [layers, setLayers] = useState(initialLayers);
  const [coordinate, setCoordinate] = useState("32.5500° E, 30.1200° N");
  const [zoom, setZoom] = useState(10);
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);

  useEffect(() => {
    if (!targetRef.current) return;
    const bundle = createOperationalMap(targetRef.current);
    bundleRef.current = bundle;
    const pointer = bundle.map.on("pointermove", (event) => {
      const [lon, lat] = toLonLat(event.coordinate);
      setCoordinate(`${lon.toFixed(4)}° E, ${lat.toFixed(4)}° N`);
    });
    const resolution = bundle.map.getView().on("change:resolution", () => setZoom(Math.round(bundle.map.getView().getZoom() ?? 0)));
    return () => { unByKey(pointer); unByKey(resolution); bundle.map.setTarget(undefined); };
  }, []);

  useEffect(() => {
    const bundle = bundleRef.current;
    if (!bundle) return;
    if (drawRef.current) { bundle.map.removeInteraction(drawRef.current); drawRef.current = null; }
    if (activeTool === "select" || activeTool === "measure") return;
    const source = bundle.layers["user-graphics"].getSource() as VectorSource;
    const type = activeTool === "point" ? "Point" : activeTool === "line" ? "LineString" : activeTool === "polygon" ? "Polygon" : "Circle";
    const draw = new Draw({ source, type });
    draw.on("drawend", () => setLayers((current) => current.map((layer) => layer.id === "user-graphics" ? { ...layer, featureCount: layer.featureCount + 1 } : layer)));
    bundle.map.addInteraction(draw);
    drawRef.current = draw;
  }, [activeTool]);

  const map = () => bundleRef.current?.map;
  const changeLayer = (id: string, updater: (layer: OperationalLayer) => OperationalLayer) => setLayers((current) => current.map((layer) => {
    if (layer.id !== id) return layer;
    const next = updater(layer);
    const live = bundleRef.current?.layers[id];
    live?.setVisible(next.visible); live?.setOpacity(next.opacity / 100);
    return next;
  }));
  const reset = () => { map()?.getView().animate({ center: fromLonLat([32.55, 30.12]), zoom: 10, duration: 500 }); };
  const zoomBy = (delta: number) => { const view = map()?.getView(); if (view) view.animate({ zoom: (view.getZoom() ?? 10) + delta, duration: 180 }); };

  return <div className={`operational-map-page ${leftOpen ? "left-open" : ""} ${rightOpen ? "right-open" : ""}`}>
    <div className="map-page-header"><div><div className="map-eyebrow"><ShieldCheck size={15}/> JOINT SHIELD 2027 / PLANNING</div><h1>Operational Map Workspace</h1><p>Shared tactical picture, force tracking and operational graphics.</p></div><div className="map-header-actions"><button><Satellite size={17}/> BASEMAP</button><button><Layers3 size={17}/> OVERLAYS <span>{layers.filter((l) => l.visible).length}</span></button></div></div>
    <div className="map-workspace-grid">
      {leftOpen && <LayerTree layers={layers} onToggle={(id) => changeLayer(id, (l) => ({ ...l, visible: !l.visible }))} onLock={(id) => changeLayer(id, (l) => ({ ...l, locked: !l.locked }))} onOpacity={(id, opacity) => changeLayer(id, (l) => ({ ...l, opacity }))}/>} 
      <section className="map-canvas-shell"><div ref={targetRef} className="operational-map"/><MapToolbar activeTool={activeTool} onTool={setActiveTool} onZoomIn={() => zoomBy(1)} onZoomOut={() => zoomBy(-1)} onReset={reset}/><button className="map-panel-toggle left" onClick={() => setLeftOpen((v) => !v)}><PanelLeftClose size={17}/></button><button className="map-panel-toggle right" onClick={() => setRightOpen((v) => !v)}><PanelRightClose size={17}/></button><div className="map-scale-card"><span>ZOOM</span><strong>{zoom}</strong><i/> <span>SCALE</span><strong>1:{Math.max(1000, Math.round(591657550 / Math.pow(2, zoom))).toLocaleString()}</strong></div><div className="map-grid-overlay"/></section>
      {rightOpen && <InspectorPanel coordinate={coordinate}/>} 
    </div>
  </div>;
}
