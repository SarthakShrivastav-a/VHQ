import Phaser from 'phaser';
import Game from '../PhaserGame';

export default class UIScene extends Phaser.Scene {
  private connectedPlayersText?: Phaser.GameObjects.Text;
  private connectionStatusText?: Phaser.GameObjects.Text;
  
  constructor() {
    super({ key: 'UIScene', active: false });
    console.log('UIScene constructor called');
  }

  init() {
    console.log('UIScene init called');
  }

  create() {
    console.log('UIScene create started');
    const gameInstance = this.game as Game;
    
    // Create top bar with minimal information
    this.createTopBar(gameInstance);
    
    // Listen for socket events from the OfficeScene
    this.listenForEvents();
    
    console.log('UIScene create completed');
  }

  private createTopBar(gameInstance: Game) {
    // Top bar background
    const topBar = this.add.rectangle(400, 25, 800, 50, 0x333333, 0.8);
    
    // Player name
    this.add.text(20, 25, `Player: ${gameInstance.gameData.playerName}`, {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#ffffff'
    }).setOrigin(0, 0.5);
    
    // Connected players count
    this.connectedPlayersText = this.add.text(400, 25, 'Connected Players: 1', {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#ffffff'
    }).setOrigin(0.5, 0.5);
    
    // Connection status
    this.connectionStatusText = this.add.text(780, 25, 'Connected', {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#55ff55'
    }).setOrigin(1, 0.5);
  }
  
  private listenForEvents() {
    // Listen for player count updates from OfficeScene
    this.scene.get('OfficeScene').events.on('playerCountUpdated', (count: number) => {
      if (this.connectedPlayersText) {
        this.connectedPlayersText.setText(`Connected Players: ${count}`);
      }
    });
    
    // Listen for connection status changes
    this.scene.get('OfficeScene').events.on('connectionStatus', (isConnected: boolean) => {
      if (this.connectionStatusText) {
        this.connectionStatusText.setText(isConnected ? 'Connected' : 'Disconnected');
        this.connectionStatusText.setColor(isConnected ? '#55ff55' : '#ff5555');
      }
    });
  }
} 