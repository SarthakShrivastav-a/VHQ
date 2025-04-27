import React, { useEffect, useRef } from 'react';
import Game, { gameConfig } from '../game/PhaserGame';

const OfficeGame: React.FC = () => {
  const gameRef = useRef<Phaser.Game | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log('OfficeGame component mounted');
    console.log('Container ref exists:', !!containerRef.current);
    
    if (containerRef.current && !gameRef.current) {
      try {
        console.log('Attempting to create Phaser game with config:', gameConfig);
        
        // Add debug event listeners
        const debugGame = () => {
          window.addEventListener('phaser-created', () => console.log('Phaser game created event'));
          window.addEventListener('phaser-boot', () => console.log('Boot scene started'));
          window.addEventListener('phaser-character-select', () => console.log('Character select scene started'));
          window.addEventListener('phaser-office', () => console.log('Office scene started'));
        };
        debugGame();
        
        gameRef.current = new Game({
          ...gameConfig,
          parent: containerRef.current
        });
        
        console.log('Phaser game created successfully:', gameRef.current);
      } catch (error) {
        console.error('Error creating Phaser game:', error);
      }
    }

    return () => {
      console.log('OfficeGame component unmounting, cleaning up game instance');
      if (gameRef.current) {
        try {
          gameRef.current.destroy(true);
          console.log('Phaser game destroyed successfully');
          gameRef.current = null;
        } catch (error) {
          console.error('Error destroying Phaser game:', error);
        }
      }
    };
  }, []);

  return (
    <div className="flex flex-col items-center w-full">
      <h1 className="text-2xl font-bold my-4">Pixel Art Office Simulation</h1>
      <div className="border-4 border-gray-300 rounded">
        <div 
          ref={containerRef} 
          id="game-container" 
          className="w-full"
          style={{ width: '800px', height: '600px' }}
        />
      </div>
      <div className="mt-4 p-4 bg-gray-100 rounded max-w-lg">
        <h2 className="text-lg font-semibold mb-2">Game Features:</h2>
        <ul className="list-disc pl-6">
          <li>Choose from three unique office characters</li>
          <li>Complete office tasks to progress</li>
          <li>Interact with coworkers and office equipment</li>
          <li>Customize your experience with the settings panel</li>
          <li>Explore the vibrant pixel art office environment</li>
        </ul>
      </div>
    </div>
  );
};

export default OfficeGame;