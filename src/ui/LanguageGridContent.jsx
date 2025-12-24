// src/components/LanguageGridContent.jsx
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { INDIAN_LANGUAGES } from "../i18n"; // The list from step 1
import { useModal } from "../context/ModalContext"; // To close it after selection

const LanguageGridContent = () => {
  const { i18n } = useTranslation();
  const { closeModal } = useModal(); // Use context to close self
  const [searchQuery, setSearchQuery] = useState("");

  const filteredLanguages = INDIAN_LANGUAGES.filter(
    (lang) =>
      lang.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lang.native.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = (code, dir) => {
    i18n.changeLanguage(code);
    document.body.dir = dir || "ltr";
    closeModal(); // Close the global modal
  };

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-2xl poppins-bold">Select Language</h3>

      {/* Search Input */}
      <input
        type="text"
        placeholder="Search language..."
        className="input input-bordered w-full"
        onChange={(e) => setSearchQuery(e.target.value)}
        autoFocus
      />

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[60vh] overflow-y-auto custom-scrollbar p-1">
        {filteredLanguages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => handleSelect(lang.code, lang.dir)}
            className={`btn h-auto py-3 flex flex-col items-start gap-1 normal-case border-2 
              ${
                i18n.language === lang.code
                  ? "border-primary bg-primary/10"
                  : "border-base-200"
              }
            `}
          >
            <span className="text-lg font-bold">{lang.native}</span>
            <span className="text-xs uppercase opacity-70">{lang.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default LanguageGridContent;
