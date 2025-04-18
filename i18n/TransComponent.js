// Đây là một wrapper đơn giản cho Trans từ react-i18next
// Phù hợp với môi trường Snack.expo.dev
import React from 'react';
import { Trans as ReactI18nextTrans } from 'react-i18next';

// Re-export Trans từ react-i18next
export const Trans = ReactI18nextTrans;

// Export mặc định để tương thích với cả hai cách import
export default ReactI18nextTrans;
