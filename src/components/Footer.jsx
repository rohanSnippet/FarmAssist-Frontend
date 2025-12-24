import { Leaf } from "lucide-react";
import { useTranslation } from "react-i18next";

const Footer = () => {
  const { t } = useTranslation();
  return (
    <footer className="footer footer-center p-10 bg-base-200 text-base-content mt-auto">
      <aside>
        <Leaf className="w-8 h-8 text-primary mb-2 opacity-80" />
        <p className="font-bold">
          FarmAssist <br />
          {t("footer.slogan")}
        </p>
        <p className="opacity-60">{t("footer.copyright")}</p>
      </aside>
    </footer>
  );
};

export default Footer;
