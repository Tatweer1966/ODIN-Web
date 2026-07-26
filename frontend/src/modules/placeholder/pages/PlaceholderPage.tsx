import { Construction } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useLanguage } from "../../../i18n";

export function PlaceholderPage() {
  const location = useLocation();
  const { t } = useLanguage();
  const pageName = location.pathname
    .replace("/", "")
    .replace(/(^\w|\s\w)/g, (letter) => letter.toUpperCase());

  return (
    <div className="placeholder-page">
      <div className="placeholder-icon">
        <Construction size={35} />
      </div>
      <span className="eyebrow">JCWS</span>
      <h1>{pageName}</h1>
      <p>{t("comingSoon")}</p>
    </div>
  );
}