import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function LoginPage() {
  const { t, i18n } = useTranslation();
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("ChangeMe123!");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await login(username, password);
      navigate(location.state?.from?.pathname || "/", { replace: true });
    } catch {
      setError(t("invalidCredentials"));
    } finally {
      setSubmitting(false);
    }
  };

  const changeLanguage = async () => {
    const next = i18n.language === "ar" ? "en" : "ar";
    await i18n.changeLanguage(next);
    localStorage.setItem("odin-language", next);
    document.documentElement.lang = next;
    document.documentElement.dir = next === "ar" ? "rtl" : "ltr";
  };

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-emblem">O</div>
        <span className="eyebrow">ODIN WEB V3</span>
        <h1>{t("loginTitle")}</h1>
        <p>{t("loginSubtitle")}</p>

        <form onSubmit={submit}>
          <label>
            <span>{t("username")}</span>
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
              required
            />
          </label>

          <label>
            <span>{t("password")}</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
          </label>

          {error && <div className="login-error">{error}</div>}

          <button type="submit" disabled={submitting}>
            {submitting ? t("signingIn") : t("signIn")}
          </button>
        </form>

        <button className="language-link" onClick={changeLanguage}>
          {t("language")}
        </button>
      </section>
    </main>
  );
}