import { Circle, Crosshair, LocateFixed, MapPin, Minus, MousePointer2, Pentagon, Plus, Ruler, Route, Search, Undo2 } from "lucide-react";
import type { MapTool } from "../types";

const tools: { id: MapTool; label: string; icon: typeof MousePointer2 }[] = [
  { id: "select", label: "Select", icon: MousePointer2 },
  { id: "point", label: "Point", icon: MapPin },
  { id: "line", label: "Route", icon: Route },
  { id: "polygon", label: "Area", icon: Pentagon },
  { id: "circle", label: "Radius", icon: Circle },
  { id: "measure", label: "Measure", icon: Ruler },
];

export function MapToolbar({ activeTool, onTool, onZoomIn, onZoomOut, onReset }: { activeTool: MapTool; onTool: (tool: MapTool) => void; onZoomIn: () => void; onZoomOut: () => void; onReset: () => void }) {
  return <div className="map-toolbar">
    <div className="map-toolbar-section"><button title="Search"><Search size={17}/></button><button title="Locate"><LocateFixed size={17}/></button><button title="Center operation" onClick={onReset}><Crosshair size={17}/></button></div>
    <div className="map-toolbar-divider"/>
    <div className="map-toolbar-section">{tools.map(({ id, label, icon: Icon }) => <button key={id} className={activeTool === id ? "active" : ""} title={label} onClick={() => onTool(id)}><Icon size={17}/><span>{label}</span></button>)}</div>
    <div className="map-toolbar-divider"/>
    <div className="map-toolbar-section compact"><button onClick={onZoomIn}><Plus size={17}/></button><button onClick={onZoomOut}><Minus size={17}/></button><button title="Undo"><Undo2 size={17}/></button></div>
  </div>;
}
