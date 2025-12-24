import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import HttpBackend from "i18next-http-backend";
import LanguageDetector from "i18next-browser-languagedetector";

const INDIAN_LANGUAGES = [
  { code: "en", name: "English", native: "English" },
  { code: "hi", name: "Hindi", native: "हिंदी" },
  { code: "mr", name: "Marathi", native: "मराठी" },
  { code: "bn", name: "Bengali", native: "বাংলা" },
  { code: "te", name: "Telugu", native: "తెలుగు" },
  { code: "ta", name: "Tamil", native: "தமிழ்" },
  { code: "gu", name: "Gujarati", native: "ગુજરાતી" },
  { code: "kn", name: "Kannada", native: "ಕನ್ನಡ" },
  { code: "ml", name: "Malayalam", native: "മലയാളം" },
  { code: "or", name: "Odia", native: "ଓଡ଼ିଆ" },
  { code: "pa", name: "Punjabi", native: "ਪੰਜਾਬੀ" },
  { code: "as", name: "Assamese", native: "অসমীয়া" },
  { code: "ur", name: "Urdu", native: "اردو", dir: "rtl" },
];

/* 
  { code: "gu", name: "Gujarati", native: "ગુજરાતી" },
  { code: "kn", name: "Kannada", native: "ಕನ್ನಡ" },
  { code: "ml", name: "Malayalam", native: "മലയാളം" },
  { code: "or", name: "Odia", native: "ଓଡ଼ିଆ" },
  { code: "pa", name: "Punjabi", native: "ਪੰਜਾਬੀ" },
  { code: "as", name: "Assamese", native: "অসমীয়া" },
  { code: "mai", name: "Maithili", native: "मैथिली" },
  { code: "sat", name: "Santali", native: "ᱥᱟᱱᱛᱟᱲᱤ" },
  { code: "ks", name: "Kashmiri", native: "कश्मीरी / كشميري", dir: "rtl" },
  { code: "ne", name: "Nepali", native: "नेपाली" },
  { code: "kok", name: "Konkani", native: "कोंकणी" },
  { code: "sd", name: "Sindhi", native: "सिन्धी / سنڌي", dir: "rtl" },
  { code: "doi", name: "Dogri", native: "डोगरी" },
  { code: "mni", name: "Manipuri (Meitei)", native: "ꯃꯩꯇꯩꯂꯣꯟ" },
  { code: "brx", name: "Bodo", native: "बर’" },
  { code: "sa", name: "Sanskrit", native: "संस्कृतम्" },
*/
i18n
  .use(HttpBackend) // Load translations via http (public/locales)
  .use(LanguageDetector) // Detect user language
  .use(initReactI18next) // Pass i18n instance to react-i18next
  .init({
    fallbackLng: "en", // Default to English if detection fails
    supportedLngs: ["en", ...INDIAN_LANGUAGES.map((l) => l.code)],

    // Config for loading files from public/locales
    backend: {
      loadPath: "/locales/{{lng}}/translation.json",
    },

    interpolation: {
      escapeValue: false, // React already safes from XSS
    },

    // React specific options
    react: {
      useSuspense: true,
    },
  });

export { INDIAN_LANGUAGES }; // Export for use in Language Switcher
export default i18n;
