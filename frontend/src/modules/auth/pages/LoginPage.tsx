import {
  BarChart3,
  Eye,
  EyeOff,
  LockKeyhole,
  MapPinned,
  Network,
  ShieldCheck,
  Swords,
  UserRound,
} from "lucide-react";
import { type FormEvent, useState } from "react";
import emblem from "../../../assets/jcws-emblem.webp";
import { useAuth } from "../../../auth";
import { useLanguage } from "../../../i18n";

const capabilities = [
  { icon: Swords, en: "Wargaming at the core", ar: "الحرب والمحاكاة في صميم النظام" },
  { icon: Network, en: "Joint and multi-domain", ar: "عمليات مشتركة ومتعددة المجالات" },
  { icon: MapPinned, en: "Tactical mapping and symbology", ar: "خرائط تكتيكية ورموز عسكرية" },
  { icon: BarChart3, en: "Replay, evaluation and AAR", ar: "إعادة العرض والتقييم والمراجعة" },
];

export function LoginPage() {
  const { login } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("ChangeMe123!");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setBusy(true);

    try {
      await login(username, password);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t("loginError"));
    } finally {
      setBusy(false);
    }
  }

  const arabic = language === "ar";

  return (
    <div className="jcws-login-screen">
      <div className="jcws-login-watermark" aria-hidden="true">
        <img src={emblem} alt="" />
      </div>
      <div className="jcws-login-grid" aria-hidden="true" />

      <section className="jcws-brand-story">
        <div className="jcws-wordmark">
          <strong>JCWS</strong>
          <span>JOINT COMMAND &amp; <b>WARGAMING</b> SYSTEM</span>
        </div>

        <div className="jcws-hero-copy">
          <p className="jcws-kicker">PLAN. <b>GAME.</b> DECIDE. WIN.</p>
          <h1>{arabic ? "نظام القيادة والحرب المشتركة" : "Wargame. Plan. Execute. Learn."}</h1>
          <p>
            {arabic
              ? "منصة متقدمة للحرب والمحاكاة تمكّن القوات المشتركة من تصميم السيناريوهات، اختبار مسارات العمل، تنفيذ التمارين، تقييم النتائج والتعلم من القرارات في بيئة واقعية وآمنة."
              : "An advanced military wargaming platform for designing scenarios, testing courses of action, executing exercises, adjudicating outcomes and learning from every decision."}
          </p>
        </div>

        <div className="jcws-capability-list">
          {capabilities.map(({ icon: Icon, en, ar }) => (
            <div className="jcws-capability" key={en}>
              <span><Icon size={20} /></span>
              <div>
                <strong>{arabic ? ar : en}</strong>
                <small>
                  {arabic
                    ? "قدرات متكاملة لدعم دورة التمرين كاملة"
                    : "Integrated capabilities across the full exercise lifecycle"}
                </small>
              </div>
            </div>
          ))}
        </div>

        <div className="jcws-brand-footer">
          <span>SECURE • INTEROPERABLE • RELIABLE</span>
          <small>BUILT FOR MODERN WARGAMING SUPERIORITY</small>
        </div>
      </section>

      <section className="jcws-access-zone">
        <div className="jcws-language-switch" role="group" aria-label="Language">
          <button className={language === "en" ? "active" : ""} onClick={() => setLanguage("en")}>English</button>
          <button className={language === "ar" ? "active" : ""} onClick={() => setLanguage("ar")}>العربية</button>
        </div>

        <form className="jcws-login-card" onSubmit={submit}>
          <img className="jcws-card-emblem" src={emblem} alt="JCWS emblem" />
          <div className="jcws-card-title">
            <span>JCWS</span>
            <strong>{arabic ? "نظام القيادة والحرب المشتركة" : "JOINT COMMAND & WARGAMING SYSTEM"}</strong>
          </div>

          <div className="jcws-welcome">
            <span>{arabic ? "دخول آمن" : "SECURE ACCESS"}</span>
            <h2>{arabic ? "مرحباً بعودتك" : "Welcome back"}</h2>
            <p>{arabic ? "سجّل الدخول للمتابعة إلى بيئة التمرين" : "Sign in to enter the active wargaming environment."}</p>
          </div>

          <label>
            <span>{t("username")}</span>
            <div className="input-shell jcws-input-shell">
              <UserRound size={18} />
              <input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" required />
            </div>
          </label>

          <label>
            <span>{t("password")}</span>
            <div className="input-shell jcws-input-shell">
              <LockKeyhole size={18} />
              <input value={password} onChange={(event) => setPassword(event.target.value)} type={showPassword ? "text" : "password"} autoComplete="current-password" required />
              <button type="button" className="password-toggle" onClick={() => setShowPassword((value) => !value)} aria-label="Toggle password visibility">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>

          {error && <div className="form-error">{error}</div>}

          <button className="jcws-signin-button" disabled={busy}>
            <ShieldCheck size={18} />
            {busy ? t("signingIn") : t("signIn")}
          </button>

          <div className="jcws-secure-notice">
            <LockKeyhole size={18} />
            <div>
              <strong>{arabic ? "وصول مصرح به فقط" : "AUTHORIZED ACCESS ONLY"}</strong>
              <span>{arabic ? "جميع الأنشطة خاضعة للمراقبة والتسجيل." : "All activity is monitored, audited and recorded."}</span>
            </div>
          </div>
        </form>
      </section>

      <footer className="jcws-login-footer">
        <span>© 2026 Tatweer Global</span>
        <strong>UNCLASSIFIED</strong>
        <span>LEARN • ADAPT • WIN</span>
      </footer>
    </div>
  );
}
