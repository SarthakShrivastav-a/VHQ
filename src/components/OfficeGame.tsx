import React, { useEffect, useRef } from 'react';
import Game, { gameConfig } from '../game/PhaserGame';

const OfficeGame: React.FC = () => {
  const gameRef = useRef<Phaser.Game | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current && !gameRef.current) {
      gameRef.current = new Game({
        ...gameConfig,
        parent: containerRef.current
      });
    }

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, []);

  return (
    <div className="flex flex-col items-center w-full">
      <h1 className="text-2xl font-bold my-4">Office Simulation</h1>
      <div className="border-4 border-gray-300 rounded">
        <div ref={containerRef} id="game-container" className="w-full h-full" />
      </div>
      <div className="mt-4 p-4 bg-gray-100 rounded max-w-lg">
        <h2 className="text-lg font-semibold mb-2">Controls:</h2>
        <ul className="list-disc pl-6">
          <li>Use Arrow Keys to move your character</li>
          <li>Move close to the NPC to trigger a message</li>
        </ul>
      </div>
    </div>
  );
};

export default OfficeGame;