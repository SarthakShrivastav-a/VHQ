import React from 'react';
import './App.css';
import VirtualHQ from './components/VirtualHQ';

function App() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-blue-600 text-white p-4">
        <h1 className="text-xl font-bold">Virtual HQ</h1>
      </header>
      <main className="flex-grow flex justify-center p-4">
        <VirtualHQ />
      </main>
      <footer className="bg-gray-200 p-2 text-center text-sm">
        <p>Created with React, TypeScript, Tailwind, Express and Socket.IO</p>
      </footer>
    </div>
  );
}

export default App;