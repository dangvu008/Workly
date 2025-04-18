"use client";

import { useTranslation as useI18nTranslation } from "react-i18next";
import { useCallback } from "react";

export const useTranslation = () => {
  const { t, i18n } = useI18nTranslation();

  // Hàm thay đổi ngôn ngữ với xử lý lỗi
  const changeLanguage = useCallback(
    (language) => {
      if (!language) {
        console.warn("Language code is required");
        return false;
      }

      try {
        i18n.changeLanguage(language);
        return true;
      } catch (error) {
        console.error("Error changing language:", error);
        return false;
      }
    },
    [i18n]
  );

  // Hàm lấy ngôn ngữ hiện tại
  const getCurrentLanguage = useCallback(() => {
    return i18n.language || "vi"; // Fallback to Vietnamese
  }, [i18n]);

  // Hàm dịch với thay thế biến
  const translate = useCallback(
    (key, options) => {
      if (!key) {
        console.warn("Translation key is required");
        return "";
      }

      try {
        return t(key, options);
      } catch (error) {
        console.error(`Error translating key "${key}":`, error);
        return key; // Fallback to key
      }
    },
    [t]
  );

  return {
    t: translate,
    changeLanguage,
    getCurrentLanguage,
    // Không cần export Trans nữa vì đã sử dụng hàm t trực tiếp
  };
};

// Không cần export Trans nữa vì đã sử dụng hàm t trực tiếp
