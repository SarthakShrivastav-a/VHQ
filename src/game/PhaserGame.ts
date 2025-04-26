import Phaser from 'phaser';
import OfficeScene from './scenes/OfficeScene';
import BootScene from './scenes/BootScene';
import CharacterSelectScene from './scenes/CharacterSelectScene';
import UIScene from './scenes/UIScene';

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

export default class Game extends Phaser.Game {
  public gameData: GameData;

  constructor(config: Phaser.Types.Core.GameConfig) {
    super(config);
    this.gameData = {...defaultGameData};
  }
}