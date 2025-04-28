import React, { useState } from 'react';
import './App.css';
import VirtualHQ from './components/VirtualHQ';
import OfficeGame from './components/OfficeGame';

function App() {
  const [activeComponent, setActiveComponent] = useState<'virtualHQ' | 'officeGame'>('virtualHQ');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-blue-600 text-white p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">Virtual HQ</h1>
        <div className="flex space-x-3">
          <button 
            className={`px-3 py-1 rounded ${activeComponent === 'virtualHQ' ? 'bg-white text-blue-600' : 'bg-blue-700 text-white'}`}
            onClick={() => setActiveComponent('virtualHQ')}
          >
            Chat Mode
          </button>
          <button 
            className={`px-3 py-1 rounded ${activeComponent === 'officeGame' ? 'bg-white text-blue-600' : 'bg-blue-700 text-white'}`}
            onClick={() => setActiveComponent('officeGame')}
          >
            Game Mode
          </button>
        </div>
      </header>
      <main className="flex-grow flex justify-center p-4">
        {activeComponent === 'virtualHQ' ? <VirtualHQ /> : <OfficeGame />}
      </main>
      <footer className="bg-gray-200 p-2 text-center text-sm">
        <p>Created with React, TypeScript, Tailwind, Express and Socket.IO</p>
      </footer>
    </div>
  );
}

export default App;