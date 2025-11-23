// client/src/pages/_app.js

import React from 'react';
import '../../styles/globals.css'; // <-- Bu yolu deneyelim

function CustomApp({ Component, pageProps }) {
  return <Component {...pageProps} />;
}

export default CustomApp;