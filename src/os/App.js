import './App.css';
import Window from './window.js';
import TContent from './testContent';
import Desktop from './desktop';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <Desktop />
        <div>
        <Window init={{
          x: 300,
          y: 200,
          height: 300,
          width: 400,
          name: "Skibidi Ohio",
          content: <TContent />
        }}/>

        <Window init={{
          x: 800,
          y: 300,
          height: 300,
          width: 400,
          name: "Rizzler",
          content: <TContent />
        }}/>
        
        </div>
        
        
        
      </header>
    </div>
  );
}

export default App;
