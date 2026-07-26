import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  en: {
    translation: {
      product: "ODIN Web",
      subtitle: "Operational Decision and Intelligence Network",
      dashboard: "Dashboard",
      projects: "Projects",
      map: "Map Workspace",
      operations: "Operations",
      reports: "Reports",
      administration: "Administration",
      systemStatus: "System Status",
      frontend: "Frontend",
      backend: "Backend API",
      database: "Database",
      ready: "Ready",
      unavailable: "Unavailable",
      foundationTitle: "Enterprise foundation is ready",
      foundationText: "The bilingual application shell, NestJS API and PostgreSQL/PostGIS foundation are connected.",
      nextModule: "Next module: project manager and project membership.",
      language: "Ø§Ù„Ø¹Ø±Ø¨ÙŠØ©",
      loginTitle: "Secure access",
      loginSubtitle: "Sign in to the operational planning environment.",
      username: "Username or email",
      password: "Password",
      signIn: "Sign in",
      signingIn: "Signing in...",
      invalidCredentials: "Invalid username or password.",
      logout: "Sign out",
      signedInAs: "Signed in as"
    }
  },
  ar: {
    translation: {
      product: "Ø£ÙˆØ¯ÙŠÙ† ÙˆÙŠØ¨",
      subtitle: "Ø´Ø¨ÙƒØ© Ø§Ù„Ù‚Ø±Ø§Ø± ÙˆØ§Ù„Ù…Ø¹Ù„ÙˆÙ…Ø§Øª Ø§Ù„Ø¹Ù…Ù„ÙŠØ§ØªÙŠØ©",
      dashboard: "Ù„ÙˆØ­Ø© Ø§Ù„Ù‚ÙŠØ§Ø¯Ø©",
      projects: "Ø§Ù„Ù…Ø´Ø±ÙˆØ¹Ø§Øª",
      map: "Ù…Ø³Ø§Ø­Ø© Ø§Ù„Ø®Ø±Ø§Ø¦Ø·",
      operations: "Ø§Ù„Ø¹Ù…Ù„ÙŠØ§Øª",
      reports: "Ø§Ù„ØªÙ‚Ø§Ø±ÙŠØ±",
      administration: "Ø§Ù„Ø¥Ø¯Ø§Ø±Ø©",
      systemStatus: "Ø­Ø§Ù„Ø© Ø§Ù„Ù†Ø¸Ø§Ù…",
      frontend: "Ø§Ù„ÙˆØ§Ø¬Ù‡Ø©",
      backend: "ÙˆØ§Ø¬Ù‡Ø© Ø§Ù„Ø®Ø§Ø¯Ù…",
      database: "Ù‚Ø§Ø¹Ø¯Ø© Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª",
      ready: "Ø¬Ø§Ù‡Ø²",
      unavailable: "ØºÙŠØ± Ù…ØªØ§Ø­",
      foundationTitle: "ØªÙ… ØªØ¬Ù‡ÙŠØ² Ø§Ù„Ø£Ø³Ø§Ø³ Ø§Ù„Ù…Ø¤Ø³Ø³ÙŠ",
      foundationText: "ØªÙ… Ø±Ø¨Ø· ÙˆØ§Ø¬Ù‡Ø© Ø§Ù„ØªØ·Ø¨ÙŠÙ‚ Ø«Ù†Ø§Ø¦ÙŠØ© Ø§Ù„Ù„ØºØ© Ù…Ø¹ Ø®Ø§Ø¯Ù… NestJS ÙˆÙ‚Ø§Ø¹Ø¯Ø© PostgreSQL/PostGIS.",
      nextModule: "Ø§Ù„ÙˆØ­Ø¯Ø© Ø§Ù„ØªØ§Ù„ÙŠØ©: Ù…Ø¯ÙŠØ± Ø§Ù„Ù…Ø´Ø±ÙˆØ¹Ø§Øª ÙˆØ¹Ø¶ÙˆÙŠØ© Ø§Ù„Ù…Ø´Ø±ÙˆØ¹.",
      language: "English",
      loginTitle: "Ø¯Ø®ÙˆÙ„ Ø¢Ù…Ù†",
      loginSubtitle: "Ø³Ø¬Ù„ Ø§Ù„Ø¯Ø®ÙˆÙ„ Ø¥Ù„Ù‰ Ø¨ÙŠØ¦Ø© Ø§Ù„ØªØ®Ø·ÙŠØ· Ø§Ù„Ø¹Ù…Ù„ÙŠØ§ØªÙŠ.",
      username: "Ø§Ø³Ù… Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù… Ø£Ùˆ Ø§Ù„Ø¨Ø±ÙŠØ¯ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ",
      password: "ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ±",
      signIn: "ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¯Ø®ÙˆÙ„",
      signingIn: "Ø¬Ø§Ø±Ù ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¯Ø®ÙˆÙ„...",
      invalidCredentials: "Ø§Ø³Ù… Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù… Ø£Ùˆ ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ± ØºÙŠØ± ØµØ­ÙŠØ­Ø©.",
      logout: "ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø®Ø±ÙˆØ¬",
      signedInAs: "ØªÙ… Ø§Ù„Ø¯Ø®ÙˆÙ„ Ø¨Ø§Ø³Ù…"
    }
  }
};

const savedLanguage = localStorage.getItem("odin-language") || "en";

i18n.use(initReactI18next).init({
  resources,
  lng: savedLanguage,
  fallbackLng: "en",
  interpolation: { escapeValue: false }
});

document.documentElement.lang = savedLanguage;
document.documentElement.dir = savedLanguage === "ar" ? "rtl" : "ltr";

export default i18n;