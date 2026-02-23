import "bootstrap/dist/css/bootstrap.min.css";
import { useState, useCallback } from 'react';
import Window from './window';
import TContent from './testContent';
import Desktop from './desktop';
import WM from './windowmanager';
import '../index.css'
import MenuBar from "./menubar";
import BootScreen from './BootScreen';

function OS9Main() {
  const [wmReady, setWmReady] = useState(false);
  const [desktopReady, setDesktopReady] = useState(false);
  const [bootDone, setBootDone] = useState(false);
  const handleReady = useCallback(() => setWmReady(true), []);
  const handleDesktopLoad = useCallback(() => setDesktopReady(true), []);
  const handleBootDone = useCallback(() => setBootDone(true), []);

  // Boot screen stays up until both the desktop image AND the server config are loaded
  const allReady = wmReady && desktopReady;

  return (
    <div className="Top Level">
      <Desktop onLoad={handleDesktopLoad} />
      <WM onReady={handleReady} />
      <MenuBar />
      {!bootDone && (
        <BootScreen ready={allReady} onDone={handleBootDone} />
      )}
    </div>
  );
}

export default OS9Main;
