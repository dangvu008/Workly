// Đây là một wrapper đơn giản cho Trans từ react-i18next
// Phù hợp với môi trường Snack.expo.dev
import React from 'react';
import { Trans as ReactI18nextTrans } from 'react-i18next';

const TransWrapper = (props) => {
  return <ReactI18nextTrans {...props} />;
};

export default TransWrapper;
