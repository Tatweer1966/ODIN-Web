import {
  Activity, Bell, BookOpenCheck, Boxes, ChartNoAxesCombined, ChevronDown, Clock3,
  Crosshair, DatabaseZap, FileClock, FileText, Flag, Globe2, GraduationCap,
  Layers3, ListChecks, LogOut, Map, Menu, MessageSquareText, Network, Pause,
  Play, RadioTower, RotateCcw, Search, Settings, Shield, ShieldCheck, Swords,
  Target, Users, Waypoints, X, Zap,
} from "lucide-react";
import { type ChangeEvent, useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../auth";
import { formatSimulationTime, useExercise, type ExerciseCell } from "../exercise";
import { useLanguage } from "../i18n";

type NavItem = { to: string; label: string; icon: typeof Map; cells?: ExerciseCell[] };
type NavGroup = { title: string; items: NavItem[] };

const groups: NavGroup[] = [
  { title: "EXERCISE", items: [
    { to: "/dashboard", label: "Command Dashboard", icon: Activity },
    { to: "/exercise", label: "Exercise Manager", icon: Flag },
    { to: "/scenario", label: "Scenario Builder", icon: Layers3 },
    { to: "/msel", label: "MSEL & Injects", icon: FileClock, cells: ["EXCON", "WHITE CELL"] },
    { to: "/participants", label: "Participants", icon: Users },
    { to: "/timeline", label: "Exercise Timeline", icon: Waypoints },
  ]},
  { title: "PLANNING", items: [
    { to: "/workspace", label: "Operational Map", icon: Map },
    { to: "/orbat", label: "ORBAT", icon: Network },
    { to: "/coa", label: "COA Planner", icon: Target },
    { to: "/opord", label: "OPORD", icon: FileText },
    { to: "/tasks", label: "Tasks", icon: ListChecks },
    { to: "/control-measures", label: "Control Measures", icon: Crosshair },
  ]},
  { title: "EXECUTION", items: [
    { to: "/live-cop", label: "Live COP", icon: RadioTower },
    { to: "/events", label: "Event Feed", icon: Zap },
    { to: "/orders", label: "Orders", icon: BookOpenCheck },
    { to: "/logistics", label: "Logistics", icon: Boxes },
    { to: "/communications", label: "Communications", icon: MessageSquareText },
  ]},
  { title: "SIMULATION", items: [
    { to: "/matrix", label: "Matrix Collaboration", icon: MessageSquareText },
    { to: "/dis", label: "DIS Gateway", icon: DatabaseZap, cells: ["EXCON", "WHITE CELL"] },
    { to: "/hla", label: "HLA Federation", icon: Network, cells: ["EXCON", "WHITE CELL"] },
    { to: "/rules", label: "Rule Engine", icon: Settings, cells: ["EXCON", "WHITE CELL"] },
    { to: "/adjudication", label: "Adjudication", icon: Swords, cells: ["EXCON", "WHITE CELL"] },
    { to: "/replay", label: "Replay", icon: RotateCcw },
  ]},
  { title: "ANALYSIS", items: [
    { to: "/intelligence", label: "Intelligence", icon: Shield },
    { to: "/reports", label: "Reports", icon: ChartNoAxesCombined },
    { to: "/aar", label: "After Action Review", icon: GraduationCap },
  ]},
  { title: "SYSTEM", items: [
    { to: "/users", label: "Users & Cells", icon: Users, cells: ["EXCON"] },
    { to: "/administration", label: "Administration", icon: Settings, cells: ["EXCON"] },
  ]},
];

function formatTime(date: Date, utc: boolean) {
  return new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false, timeZone: utc ? "UTC" : undefined }).format(date);
}

export function AppShell() {
  const { user, logout } = useAuth();
  const { language, setLanguage } = useLanguage();
  const exercise = useExercise();
  const [now, setNow] = useState(() => new Date());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  useEffect(() => { const timer = window.setInterval(() => setNow(new Date()), 1000); return () => window.clearInterval(timer); }, []);
  const displayName = language === "ar" ? user?.displayNameAr || user?.displayNameEn : user?.displayNameEn || user?.username;

  return (
    <div className="app-shell sprint2b-shell">
      <div className="classification-banner">{exercise.classification} // TRAINING USE ONLY</div>
      <aside className={`sidebar ${sidebarOpen ? "is-open" : ""}`}>
        <div className="brand"><div className="brand-mark"><ShieldCheck size={23} /></div><div><strong>JCWS</strong><span>JOINT WARGAMING SYSTEM</span></div><button className="icon-button sidebar-close" onClick={() => setSidebarOpen(false)}><X size={20}/></button></div>
        <div className="cell-selector"><span>ACTIVE CELL</span><select value={exercise.cell} onChange={(e: ChangeEvent<HTMLSelectElement>) => exercise.setCell(e.target.value as ExerciseCell)}><option>EXCON</option><option>BLUEFOR</option><option>REDFOR</option><option>WHITE CELL</option><option>OBSERVER</option></select></div>
        <nav className="navigation">{groups.map((group) => {
          const visible = group.items.filter((item) => !item.cells || item.cells.includes(exercise.cell));
          if (!visible.length) return null;
          return <div className="nav-group" key={group.title}><div className="nav-group-title">{group.title}</div>{visible.map((item) => { const Icon = item.icon; return <NavLink className={({isActive}: {isActive: boolean}) => `nav-link ${isActive ? "active" : ""}`} to={item.to} key={item.to} onClick={() => setSidebarOpen(false)}><Icon size={17}/><span>{item.label}</span></NavLink>; })}</div>;
        })}</nav>
        <div className="sidebar-status"><div className="connection-line"><span className="status-dot online"/><span>SECURE NETWORK ONLINE</span></div><div className={`cell-badge ${exercise.cell.toLowerCase().replace(" ", "-")}`}>{exercise.cell}</div></div>
      </aside>
      {sidebarOpen && <button className="sidebar-backdrop" onClick={() => setSidebarOpen(false)}/>} 
      <div className="workspace-shell">
        <header className="command-bar wargame-command-bar">
          <div className="command-left"><button className="icon-button mobile-menu-button" onClick={() => setSidebarOpen(true)}><Menu size={21}/></button><div className="operation-selector"><CircleDotIcon/><div><span>ACTIVE EXERCISE</span><strong>{exercise.exerciseName}</strong></div><ChevronDown size={16}/></div></div>
          <div className="exercise-command-grid">
            <CommandMetric label="PHASE" value={exercise.phase}/><CommandMetric label="SIM TIME" value={`D+${exercise.day} ${formatSimulationTime(exercise.simulationSeconds)}`}/><CommandMetric label="TURN" value={String(exercise.turn)}/><CommandMetric label="SPEED" value={`×${exercise.speed}`}/>
            <div className="simulation-control"><button onClick={exercise.toggleSimulation}>{exercise.state === "RUNNING" ? <Pause size={14}/> : <Play size={14}/>} {exercise.state}</button><button onClick={exercise.advanceTurn}>STEP</button></div>
          </div>
          <div className="command-actions"><ServicePill label="MATRIX" state="ONLINE"/><ServicePill label="DIS" state="LIVE"/><ServicePill label="HLA" state="STANDBY" muted/><button className="icon-button"><Search size={18}/></button><button className="icon-button notification-button"><Bell size={18}/><span className="notification-count">3</span></button><div className="user-menu-wrapper"><button className="user-button" onClick={() => setUserMenuOpen((v) => !v)}><span className="user-avatar">{displayName?.charAt(0).toUpperCase() || "A"}</span><span className="user-button-text"><strong>{displayName}</strong><small>{exercise.cell}</small></span><ChevronDown size={15}/></button>{userMenuOpen && <div className="user-dropdown"><div className="dropdown-user"><span>Signed in as</span><strong>{displayName}</strong><small>{user?.email}</small></div><button onClick={() => setLanguage(language === "en" ? "ar" : "en")}><Globe2 size={17}/>{language === "en" ? "العربية" : "English"}</button><button className="danger-action" onClick={logout}><LogOut size={17}/>Sign out</button></div>}</div></div>
        </header>
        <main className="page-area"><Outlet/></main>
        <footer className="tactical-status-strip"><StatusItem label="SOCKET" value="CONNECTED"/><StatusItem label="MATRIX" value="18 USERS"/><StatusItem label="DIS" value="583 PDU/S"/><StatusItem label="HLA" value="12 FEDERATES" warning/><StatusItem label="MAP" value="READY"/><StatusItem label="RULE ENGINE" value="RUNNING"/></footer>
      </div>
    </div>
  );
}

function CircleDotIcon(){ return <span className="exercise-dot"/>; }
function CommandMetric({label,value}:{label:string;value:string}){ return <div className="command-metric"><span>{label}</span><strong>{value}</strong></div>; }
function ServicePill({label,state,muted=false}:{label:string;state:string;muted?:boolean}){ return <div className={`service-pill ${muted ? "muted" : ""}`}><span/><div><small>{label}</small><strong>{state}</strong></div></div>; }
function StatusItem({label,value,warning=false}:{label:string;value:string;warning?:boolean}){ return <div className={`status-item ${warning ? "warning" : ""}`}><span/><small>{label}</small><strong>{value}</strong></div>; }
