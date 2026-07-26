import { Crosshair, Radio, ShieldAlert, Swords } from "lucide-react";

export function InspectorPanel({ coordinate }: { coordinate: string }) {
  return <aside className="map-right-rail">
    <section className="map-panel tactical-summary"><div className="map-panel-heading"><div><span>LIVE OPERATION</span><strong>Tactical Summary</strong></div><Radio size={18}/></div><div className="summary-grid"><Summary icon={Swords} label="BLUEFOR" value="72%" tone="blue"/><Summary icon={ShieldAlert} label="REDFOR" value="61%" tone="red"/><Summary icon={Crosshair} label="ACTIVE TASKS" value="18" tone="amber"/></div></section>
    <section className="map-panel selection-panel"><div className="map-panel-heading"><div><span>SELECTION</span><strong>Object Inspector</strong></div></div><div className="empty-selection"><Crosshair size={26}/><strong>No object selected</strong><span>Select a unit or operational graphic to inspect attributes, readiness and tasking.</span></div></section>
    <section className="map-panel coordinate-card"><span>CURSOR POSITION</span><strong>{coordinate}</strong><div><small>FORMAT</small><b>WGS 84</b></div></section>
  </aside>;
}

function Summary({ icon: Icon, label, value, tone }: { icon: typeof Swords; label: string; value: string; tone: string }) { return <div className={`tactical-summary-item ${tone}`}><Icon size={18}/><span>{label}</span><strong>{value}</strong></div>; }
