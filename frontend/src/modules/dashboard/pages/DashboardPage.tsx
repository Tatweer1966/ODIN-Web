import type { ReactNode } from "react";
import { AlertTriangle, ArrowUpRight, Clock3, Crosshair, DatabaseZap, MessageSquareText, RadioTower, ShieldCheck, Swords, UsersRound, Waypoints } from "lucide-react";
import { Link } from "react-router-dom";
import { useExercise, formatSimulationTime } from "../../../exercise";

const injects = [
  { time: "H+14:00", title: "ISR intelligence package", status: "READY" },
  { time: "H+14:30", title: "Communications degradation", status: "APPROVAL" },
  { time: "H+15:10", title: "Civilian convoy enters AO", status: "PLANNED" },
];

export function DashboardPage() {
  const exercise = useExercise();
  return <div className="dashboard-page wargame-dashboard">
    <section className="page-heading"><div><div className="eyebrow">JCWS / EXERCISE CONTROL</div><h1>Wargame Command Center</h1><p>Real-time exercise control, simulation monitoring and collaborative adjudication.</p></div><div className="heading-status"><span className="status-dot online"/><div><span>EXERCISE STATE</span><strong>{exercise.state} / TURN {exercise.turn}</strong></div></div></section>

    <section className="exercise-summary panel"><div><span className="panel-kicker">ACTIVE EXERCISE</span><h2>{exercise.exerciseName}</h2><p>Joint multi-domain command-post exercise with distributed simulation and live controller collaboration.</p></div><div className="exercise-facts"><Fact label="PHASE" value={exercise.phase}/><Fact label="SIMULATION TIME" value={`D+${exercise.day} / ${formatSimulationTime(exercise.simulationSeconds)}`}/><Fact label="CELL" value={exercise.cell}/><Fact label="CLASSIFICATION" value={exercise.classification}/></div></section>

    <section className="stat-grid wargame-stats"><Stat icon={<UsersRound/>} label="Participants Online" value="127" detail="18 Matrix users"/><Stat icon={<ShieldCheck/>} label="BLUEFOR Readiness" value="91%" detail="42 units reporting"/><Stat icon={<Swords/>} label="REDFOR Readiness" value="84%" detail="37 units assessed"/><Stat icon={<AlertTriangle/>} label="Pending Decisions" value="6" detail="2 high priority" warning/></section>

    <section className="wargame-main-grid">
      <article className="panel tactical-map-card"><div className="panel-heading"><div><span className="panel-kicker">COMMON OPERATIONAL PICTURE</span><h3>Sector ALPHA / Joint Area of Operations</h3></div><Link className="text-button" to="/workspace">OPEN TACTICAL MAP <ArrowUpRight size={16}/></Link></div><div className="map-preview enhanced-map"><div className="map-grid-lines"/><div className="map-terrain terrain-a"/><div className="map-terrain terrain-b"/><div className="phase-line">PL BRONZE</div><div className="map-route route-a"/><span className="mil-symbol friendly symbol-a">1/12</span><span className="mil-symbol friendly symbol-b">2/8</span><span className="mil-symbol hostile symbol-c">3/41</span><span className="objective-ring">OBJ EAGLE</span><div className="map-coordinate">MGRS 36R TV 07500 24500</div><div className="map-scale">0&nbsp;&nbsp;5&nbsp;&nbsp;10 KM</div></div></article>

      <article className="panel controller-actions"><div className="panel-heading"><div><span className="panel-kicker">EXCON TASKS</span><h3>Controller Action Queue</h3></div><span className="count-badge">6</span></div><Action icon={<AlertTriangle/>} title="Adjudication request" detail="BLUEFOR fires request / OBJ EAGLE" priority="HIGH"/><Action icon={<Clock3/>} title="Release scheduled inject" detail="ISR package at H+14:00" priority="DUE"/><Action icon={<Crosshair/>} title="Validate phase transition" detail="Phase II decision point" priority="OPEN"/></article>

      <article className="panel inject-panel"><div className="panel-heading"><div><span className="panel-kicker">MSEL</span><h3>Upcoming Injects</h3></div><Waypoints size={19}/></div>{injects.map((item) => <div className="inject-row" key={item.title}><strong>{item.time}</strong><div><span>{item.title}</span><small>{item.status}</small></div></div>)}</article>

      <article className="panel interop-panel"><div className="panel-heading"><div><span className="panel-kicker">INTEROPERABILITY</span><h3>Simulation & Collaboration</h3></div><RadioTower size={19}/></div><Interop icon={<MessageSquareText/>} label="Matrix Collaboration" value="18 users / 6 rooms" state="CONNECTED"/><Interop icon={<DatabaseZap/>} label="DIS Gateway" value="1,254 entities / 583 PDU/s" state="LIVE"/><Interop icon={<RadioTower/>} label="HLA Federation" value="12 federates / synchronized" state="STANDBY"/></article>
    </section>
  </div>;
}

function Fact({label,value}:{label:string;value:string}){return <div><span>{label}</span><strong>{value}</strong></div>}
function Stat({icon,label,value,detail,warning=false}:{icon:ReactNode;label:string;value:string;detail:string;warning?:boolean}){return <article className={`stat-card ${warning ? "warning" : ""}`}>{icon}<div><span>{label}</span><strong>{value}</strong><small>{detail}</small></div></article>}
function Action({icon,title,detail,priority}:{icon:ReactNode;title:string;detail:string;priority:string}){return <div className="controller-action-row"><span className="action-icon">{icon}</span><div><strong>{title}</strong><span>{detail}</span></div><b>{priority}</b></div>}
function Interop({icon,label,value,state}:{icon:ReactNode;label:string;value:string;state:string}){return <div className="interop-row"><span className="interop-icon">{icon}</span><div><strong>{label}</strong><span>{value}</span></div><b>{state}</b></div>}
