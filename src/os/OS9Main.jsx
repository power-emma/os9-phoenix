import "bootstrap/dist/css/bootstrap.min.css";
import Window from './window';
import TContent from './testContent';
import Desktop from './desktop';
import WM from './windowmanager';
import '../index.css'
import MenuBar from "./menubar";
function OS9Main() {
  return (
    <div className="Top Level">

      <Desktop />
      <WM />
      <MenuBar />
      </div>

  );
}

export default OS9Main;
