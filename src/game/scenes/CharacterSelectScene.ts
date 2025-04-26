import Phaser from 'phaser';
import Game, { GameData } from '../PhaserGame';

export default class CharacterSelectScene extends Phaser.Scene {
  private characters: {id: string, name: string, description: string}[] = [
    {
      id: 'character1',
      name: 'Office Warrior',
      description: 'Fast runner with excellent paper-pushing skills'
    },
    {
      id: 'character2',
      name: 'IT Wizard',
      description: 'Technical expert who can fix any computer problem'
    },
    {
      id: 'character3',
      name: 'HR Champion',
      description: 'Strong people skills and great at organizing'
    }
  ];
  
  private selectedCharacter: string = 'character1';
  private characterSprites: Phaser.GameObjects.Sprite[] = [];
  private nameInput?: Phaser.GameObjects.DOMElement;

  constructor() {
    super('CharacterSelectScene');
  }

  create() {
    // Background
    this.add.rectangle(400, 300, 800, 600, 0x000000).setAlpha(0.7);
    
    // Title
    this.add.text(400, 100, 'SELECT YOUR CHARACTER', {
      fontFamily: 'Arial',
      fontSize: '28px',
      color: '#ffffff'
    }).setOrigin(0.5);
    
    // Create character selection UI
    this.createCharacterSelectionUI();
    
    // Create input for player name
    this.createPlayerNameInput();
    
    // Create start button
    this.createStartButton();
  }

  private createCharacterSelectionUI() {
    const startX = 200;
    const characterSpacing = 200;
    const characterY = 300;
    
    // Create character options
    this.characters.forEach((character, index) => {
      const x = startX + (index * characterSpacing);
      const characterContainer = this.add.container(x, characterY);
      
      // Character preview sprite
      const sprite = this.add.sprite(0, -40, `${character.id}-preview`);
      sprite.setScale(3);
      
      // Animation frame
      const frame = this.add.rectangle(0, -40, 100, 100, 0x333333);
      frame.setStrokeStyle(2, 0xffffff);
      
      // Name
      const nameText = this.add.text(0, 30, character.name, {
        fontFamily: 'Arial',
        fontSize: '18px',
        color: '#ffffff'
      }).setOrigin(0.5);
      
      // Description
      const descText = this.add.text(0, 60, character.description, {
        fontFamily: 'Arial',
        fontSize: '12px',
        color: '#cccccc',
        wordWrap: { width: 180 }
      }).setOrigin(0.5);
      
      // Selection indicator
      const selectionIndicator = this.add.rectangle(0, 100, 180, 180, 0xffff00, 0);
      selectionIndicator.setStrokeStyle(2, 0xffff00);
      
      // Add to container
      characterContainer.add([frame, sprite, nameText, descText, selectionIndicator]);
      
      // Selection functionality
      sprite.setInteractive();
      sprite.on('pointerdown', () => {
        this.selectCharacter(character.id);
      });
      
      // Store reference to selection indicator
      this.characterSprites.push(sprite);
      
      // Initial selection
      if (character.id === this.selectedCharacter) {
        selectionIndicator.setFillStyle(0xffff00, 0.3);
      }
    });
  }

  private createPlayerNameInput() {
    // Create input element for player name
    const nameInputHTML = `
      <div style="background-color: #333333; padding: 10px; border-radius: 5px; width: 300px; text-align: center;">
        <label for="playerName" style="color: white; display: block; margin-bottom: 5px;">Enter Your Name:</label>
        <input type="text" id="playerName" name="playerName" value="Employee" 
               style="width: 90%; padding: 8px; border-radius: 3px; border: none; background-color: #555555; color: white;">
      </div>
    `;
    
    this.nameInput = this.add.dom(400, 450).createFromHTML(nameInputHTML);
  }

  private createStartButton() {
    // Create start button
    const startButton = this.add.rectangle(400, 520, 200, 50, 0x33cc33);
    startButton.setInteractive();
    
    // Add text
    const startText = this.add.text(400, 520, 'START GAME', {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#ffffff'
    }).setOrigin(0.5);
    
    // Hover effect
    startButton.on('pointerover', () => {
      startButton.setFillStyle(0x44dd44);
    });
    
    startButton.on('pointerout', () => {
      startButton.setFillStyle(0x33cc33);
    });
    
    // Click effect
    startButton.on('pointerdown', () => {
      startButton.setFillStyle(0x228822);
    });
    
    startButton.on('pointerup', () => {
      this.startGame();
    });
  }

  private selectCharacter(characterId: string) {
    this.selectedCharacter = characterId;
    
    // Update selection indicators
    const containers = this.children.list.filter(child => child.type === 'Container') as Phaser.GameObjects.Container[];
    
    containers.forEach((container, index) => {
      const selectionIndicator = container.getAt(4) as Phaser.GameObjects.Rectangle;
      const character = this.characters[index];
      
      if (character.id === this.selectedCharacter) {
        selectionIndicator.setFillStyle(0xffff00, 0.3);
      } else {
        selectionIndicator.setFillStyle(0xffff00, 0);
      }
    });
  }

  private startGame() {
    // Get player name from input
    const playerName = this.nameInput ? 
      (document.getElementById('playerName') as HTMLInputElement)?.value || 'Employee' : 
      'Employee';
    
    // Save selection to game data
    const gameInstance = this.game as Game;
    gameInstance.gameData.selectedCharacter = this.selectedCharacter;
    gameInstance.gameData.playerName = playerName;
    
    // Start the game
    this.scene.start('OfficeScene');
    
    // Start the UI scene as an overlay
    this.scene.launch('UIScene');
  }
} 