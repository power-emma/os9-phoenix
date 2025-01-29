import './App.css';
import "bootstrap/dist/css/bootstrap.min.css";
import Window from './window.js';
import TContent from './testContent';
import Desktop from './desktop';
import WM from './windowmanager';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <Desktop />
        <div>
          <WM />
        </div>        
      </header>
    </div>
  );
}

export default App;
