import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import OS9Main from './os/OS9Main';

import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <OS9Main/>
  </React.StrictMode>
);

reportWebVitals();
