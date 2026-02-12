import React from "react";
import { useTranslation } from "react-i18next";

const Contact = () => {
  const { t } = useTranslation();
  return (
    <div>
      {" "}
      <div className="hero bg-base-200 min-h-screen">
        <div className="hero-content text-center">
          <div className="max-w-md">
            <h1 className="text-5xl poppins-extrabold">{t("Contact.title")}</h1>
            <p className="py-6 raleway-regular">
              {t("Contact.description")}
            </p>
            <button className="btn btn-primary">  {t("Contact.cta")}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
