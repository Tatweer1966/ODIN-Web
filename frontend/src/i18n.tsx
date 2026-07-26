import {
  createContext,
  type PropsWithChildren,
  useContext,
  useMemo,
  useState,
} from "react";

export type Language = "en" | "ar";

export type TranslationKey =
  | "dashboard"
  | "workspace"
  | "projects"
  | "operations"
  | "layers"
  | "teams"
  | "intelligence"
  | "reports"
  | "administration"
  | "mission"
  | "planning"
  | "analysis"
  | "system"
  | "operationalDashboard"
  | "welcomeBack"
  | "currentOperation"
  | "active"
  | "classification"
  | "commander"
  | "operationalPhase"
  | "missionTime"
  | "mapPreview"
  | "activeMissions"
  | "recentActivity"
  | "alerts"
  | "systemHealth"
  | "api"
  | "database"
  | "postgis"
  | "websocket"
  | "storage"
  | "online"
  | "noCriticalAlerts"
  | "viewWorkspace"
  | "signedInAs"
  | "logout"
  | "language"
  | "localTime"
  | "utc"
  | "connected"
  | "readiness"
  | "participants"
  | "assets"
  | "events"
  | "ready"
  | "developmentData"
  | "comingSoon"
  | "username"
  | "password"
  | "signIn"
  | "signingIn"
  | "loginTitle"
  | "loginSubtitle"
  | "loginError";

const en: Record<TranslationKey, string> = {
  dashboard: "Dashboard",
  workspace: "Map Workspace",
  projects: "Projects",
  operations: "Operations",
  layers: "Layers",
  teams: "Teams",
  intelligence: "Intelligence",
  reports: "Reports",
  administration: "Administration",
  mission: "Mission",
  planning: "Planning",
  analysis: "Analysis",
  system: "System",
  operationalDashboard: "Operational Dashboard",
  welcomeBack: "Welcome back",
  currentOperation: "Current Operation",
  active: "Active",
  classification: "Classification",
  commander: "Commander",
  operationalPhase: "Operational Phase",
  missionTime: "Mission Time",
  mapPreview: "Common Operational Picture",
  activeMissions: "Active Missions",
  recentActivity: "Recent Activity",
  alerts: "Alerts",
  systemHealth: "System Health",
  api: "Backend API",
  database: "Database",
  postgis: "PostGIS",
  websocket: "WebSocket",
  storage: "Storage",
  online: "Online",
  noCriticalAlerts: "No critical alerts",
  viewWorkspace: "Open Workspace",
  signedInAs: "Signed in as",
  logout: "Sign out",
  language: "Language",
  localTime: "Local",
  utc: "UTC",
  connected: "Connected",
  readiness: "Operational Readiness",
  participants: "Participants",
  assets: "Assets",
  events: "Events",
  ready: "Ready",
  developmentData: "Operational data shown here is currently representative.",
  comingSoon: "Module under development",
  username: "Username",
  password: "Password",
  signIn: "Sign in",
  signingIn: "Signing in...",
  loginTitle: "JCWS",
  loginSubtitle: "Joint Command & Wargaming System",
  loginError: "Unable to sign in",
};

const ar: Record<TranslationKey, string> = {
  dashboard: "\u0644\u0648\u062d\u0629 \u0627\u0644\u0642\u064a\u0627\u062f\u0629",
  workspace: "\u0645\u0633\u0627\u062d\u0629 \u0627\u0644\u062e\u0631\u064a\u0637\u0629",
  projects: "\u0627\u0644\u0645\u0634\u0631\u0648\u0639\u0627\u062a",
  operations: "\u0627\u0644\u0639\u0645\u0644\u064a\u0627\u062a",
  layers: "\u0627\u0644\u0637\u0628\u0642\u0627\u062a",
  teams: "\u0627\u0644\u0641\u0631\u0642",
  intelligence: "\u0627\u0644\u0627\u0633\u062a\u062e\u0628\u0627\u0631\u0627\u062a",
  reports: "\u0627\u0644\u062a\u0642\u0627\u0631\u064a\u0631",
  administration: "\u0627\u0644\u0625\u062f\u0627\u0631\u0629",
  mission: "\u0627\u0644\u0645\u0647\u0645\u0629",
  planning: "\u0627\u0644\u062a\u062e\u0637\u064a\u0637",
  analysis: "\u0627\u0644\u062a\u062d\u0644\u064a\u0644",
  system: "\u0627\u0644\u0646\u0638\u0627\u0645",
  operationalDashboard: "\u0644\u0648\u062d\u0629 \u0627\u0644\u0642\u064a\u0627\u062f\u0629 \u0627\u0644\u062a\u0634\u063a\u064a\u0644\u064a\u0629",
  welcomeBack: "\u0645\u0631\u062d\u0628\u0627\u064b \u0628\u0639\u0648\u062f\u062a\u0643",
  currentOperation: "\u0627\u0644\u0639\u0645\u0644\u064a\u0629 \u0627\u0644\u062d\u0627\u0644\u064a\u0629",
  active: "\u0646\u0634\u0637\u0629",
  classification: "\u0627\u0644\u062a\u0635\u0646\u064a\u0641",
  commander: "\u0627\u0644\u0642\u0627\u0626\u062f",
  operationalPhase: "\u0627\u0644\u0645\u0631\u062d\u0644\u0629 \u0627\u0644\u0639\u0645\u0644\u064a\u0627\u062a\u064a\u0629",
  missionTime: "\u0632\u0645\u0646 \u0627\u0644\u0645\u0647\u0645\u0629",
  mapPreview: "\u0627\u0644\u0635\u0648\u0631\u0629 \u0627\u0644\u0639\u0645\u0644\u064a\u0627\u062a\u064a\u0629 \u0627\u0644\u0645\u0634\u062a\u0631\u0643\u0629",
  activeMissions: "\u0627\u0644\u0645\u0647\u0627\u0645 \u0627\u0644\u0646\u0634\u0637\u0629",
  recentActivity: "\u0622\u062e\u0631 \u0627\u0644\u0623\u0646\u0634\u0637\u0629",
  alerts: "\u0627\u0644\u062a\u0646\u0628\u064a\u0647\u0627\u062a",
  systemHealth: "\u062d\u0627\u0644\u0629 \u0627\u0644\u0646\u0638\u0627\u0645",
  api: "\u0648\u0627\u062c\u0647\u0629 \u0627\u0644\u062e\u0644\u0641\u064a\u0629",
  database: "\u0642\u0627\u0639\u062f\u0629 \u0627\u0644\u0628\u064a\u0627\u0646\u0627\u062a",
  postgis: "\u0627\u0644\u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u0645\u0643\u0627\u0646\u064a\u0629",
  websocket: "\u0627\u0644\u0627\u062a\u0635\u0627\u0644 \u0627\u0644\u0641\u0648\u0631\u064a",
  storage: "\u0627\u0644\u062a\u062e\u0632\u064a\u0646",
  online: "\u0645\u062a\u0635\u0644",
  noCriticalAlerts: "\u0644\u0627 \u062a\u0648\u062c\u062f \u062a\u0646\u0628\u064a\u0647\u0627\u062a \u062d\u0631\u062c\u0629",
  viewWorkspace: "\u0641\u062a\u062d \u0645\u0633\u0627\u062d\u0629 \u0627\u0644\u0639\u0645\u0644",
  signedInAs: "\u0645\u0633\u062c\u0644 \u0628\u0627\u0633\u0645",
  logout: "\u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u062e\u0631\u0648\u062c",
  language: "\u0627\u0644\u0644\u063a\u0629",
  localTime: "\u0627\u0644\u062a\u0648\u0642\u064a\u062a \u0627\u0644\u0645\u062d\u0644\u064a",
  utc: "\u0627\u0644\u062a\u0648\u0642\u064a\u062a \u0627\u0644\u0639\u0627\u0644\u0645\u064a",
  connected: "\u0645\u062a\u0635\u0644",
  readiness: "\u0627\u0644\u062c\u0627\u0647\u0632\u064a\u0629 \u0627\u0644\u0639\u0645\u0644\u064a\u0627\u062a\u064a\u0629",
  participants: "\u0627\u0644\u0645\u0634\u0627\u0631\u0643\u0648\u0646",
  assets: "\u0627\u0644\u0623\u0635\u0648\u0644",
  events: "\u0627\u0644\u0623\u062d\u062f\u0627\u062b",
  ready: "\u062c\u0627\u0647\u0632",
  developmentData: "\u0627\u0644\u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u0639\u0645\u0644\u064a\u0627\u062a\u064a\u0629 \u0627\u0644\u0645\u0639\u0631\u0648\u0636\u0629 \u062d\u0627\u0644\u064a\u0627\u064b \u0647\u064a \u0628\u064a\u0627\u0646\u0627\u062a \u062a\u0645\u062b\u064a\u0644\u064a\u0629.",
  comingSoon: "\u0627\u0644\u0648\u062d\u062f\u0629 \u0642\u064a\u062f \u0627\u0644\u062a\u0637\u0648\u064a\u0631",
  username: "\u0627\u0633\u0645 \u0627\u0644\u0645\u0633\u062a\u062e\u062f\u0645",
  password: "\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631",
  signIn: "\u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u062f\u062e\u0648\u0644",
  signingIn: "\u062c\u0627\u0631\u064d \u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u062f\u062e\u0648\u0644...",
  loginTitle: "JCWS",
  loginSubtitle: "\u0646\u0638\u0627\u0645 \u0627\u0644\u0642\u064a\u0627\u062f\u0629 \u0648\u0627\u0644\u062d\u0631\u0628 \u0627\u0644\u0645\u0634\u062a\u0631\u0643\u0629",
  loginError: "\u062a\u0639\u0630\u0631 \u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u062f\u062e\u0648\u0644",
};

interface LanguageContextValue {
  language: Language;
  direction: "ltr" | "rtl";
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(
  undefined,
);

export function LanguageProvider({ children }: PropsWithChildren) {
  const [language, setLanguageState] = useState<Language>(() => {
    return localStorage.getItem("odin_language") === "ar" ? "ar" : "en";
  });

  function setLanguage(next: Language) {
    localStorage.setItem("odin_language", next);
    setLanguageState(next);
  }

  const direction = language === "ar" ? "rtl" : "ltr";

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      direction,
      setLanguage,
      t: (key) => (language === "ar" ? ar[key] : en[key]),
    }),
    [language, direction],
  );

  return (
    <LanguageContext.Provider value={value}>
      <div dir={direction} lang={language}>
        {children}
      </div>
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const value = useContext(LanguageContext);
  if (!value) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return value;
}