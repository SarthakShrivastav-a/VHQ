import Phaser from 'phaser';
import OfficeScene from './scenes/OfficeScene';
import BootScene from './scenes/BootScene';
import CharacterSelectScene from './scenes/CharacterSelectScene';
import UIScene from './scenes/UIScene';

console.log('PhaserGame module loaded');

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: 800,
  height: 600,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0, x: 0 },
      debug: false
    }
  },
  scene: [BootScene, CharacterSelectScene, OfficeScene, UIScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  dom: {
    createContainer: true
  },
  pixelArt: true
};

console.log('Phaser game config initialized:', gameConfig);

export interface GameData {
  selectedCharacter: string;
  playerName: string;
  tasks: Array<{id: string, text: string, completed: boolean}>;
}

// Default game data
export const defaultGameData: GameData = {
  selectedCharacter: 'character1',
  playerName: 'Employee',
  tasks: [
    {id: '1', text: 'Check email', completed: false},
    {id: '2', text: 'Attend meeting', completed: false},
    {id: '3', text: 'Meet with colleagues', completed: false}
  ]
};

console.log('Default game data initialized:', defaultGameData);

export default class Game extends Phaser.Game {
  public gameData: GameData;

  constructor(config: Phaser.Types.Core.GameConfig) {
    console.log('Initializing Phaser Game with config:', config);
    try {
      super(config);
      console.log('Phaser Game initialized successfully');
      this.gameData = {...defaultGameData};
      console.log('Game data initialized:', this.gameData);
      
      // Dispatch custom event for debugging
      window.dispatchEvent(new Event('phaser-created'));
      
      // Add listeners for important Phaser events
      this.events.on('ready', () => console.log('Phaser game ready event fired'));
      this.events.on('blur', () => console.log('Phaser game blur event fired'));
      this.events.on('focus', () => console.log('Phaser game focus event fired'));
      this.events.on('hidden', () => console.log('Phaser game hidden event fired'));
      this.events.on('visible', () => console.log('Phaser game visible event fired'));
      this.events.on('resize', (width: number, height: number) => 
        console.log(`Phaser game resize event fired: ${width}x${height}`));
    } catch (error) {
      console.error('Error initializing Phaser Game:', error);
      throw error;
    }
  }
}