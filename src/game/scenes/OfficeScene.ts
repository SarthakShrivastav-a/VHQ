import Phaser from 'phaser';
import Game from '../PhaserGame';
import { io, Socket } from 'socket.io-client';

interface User {
  id: string;
  name: string;
  position: { x: number; y: number };
  avatar: string;
}

export default class OfficeScene extends Phaser.Scene {
  private player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private otherPlayers: Map<string, Phaser.Types.Physics.Arcade.SpriteWithDynamicBody> = new Map();
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private socket: Socket | null = null;
  private playerNameText?: Phaser.GameObjects.Text;
  private proximityRadius: number = 250; // Increased from 200 to make it easier to detect nearby players
  private lastNearbyCheck: number = 0;
  private nearbyCheckInterval: number = 200; // Reduced from 300 for even more frequent checks
  
  constructor() {
    super('OfficeScene');
    console.log('OfficeScene constructor called');
  }

  init() {
    console.log('OfficeScene init called');
    // Initialize socket connection
    this.socket = io('http://localhost:3001');
    this.setupSocketListeners();
  }

  setupSocketListeners() {
    if (!this.socket) return;
    
    console.log('Setting up socket listeners');
    
    // Connection status events
    this.socket.on('connect', () => {
      console.log('Connected to server');
      this.events.emit('connectionStatus', true);
    });
    
    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
      this.events.emit('connectionStatus', false);
    });
    
    // Listen for new players joining
    this.socket.on('user-joined', (userData: User) => {
      console.log('User joined:', userData);
      this.addOtherPlayer(userData);
      this.updatePlayerCount();
      // Force a proximity check when a new player joins
      this.checkNearbyPlayers();
    });
    
    // Listen for players leaving
    this.socket.on('user-left', (userId: string) => {
      console.log('User left:', userId);
      this.removePlayer(userId);
      this.updatePlayerCount();
      // Force a proximity check when a player leaves
      this.checkNearbyPlayers();
    });
    
    // Listen for player movements
    this.socket.on('user-moved', (userData: any) => {
      this.updatePlayerPosition(userData);
      // We'll check proximity in updatePlayerPosition instead of here
    });
    
    // Get current players
    this.socket.on('users', (users: User[]) => {
      console.log('Received users list:', users);
      users.forEach(user => {
        if (user.id !== this.socket?.id) {
          this.addOtherPlayer(user);
        }
      });
      this.updatePlayerCount();
      // Force a proximity check when we get the initial user list
      this.checkNearbyPlayers();
    });
  }

  create() {
    console.log('OfficeScene create started');
    
    try {
      const gameInstance = this.game as Game;
      console.log('Game instance:', gameInstance);
      
      // Create a simple background
      this.add.rectangle(400, 300, 800, 600, 0x87CEEB).setDepth(-2);
      
      // Add a grid pattern for visual reference
      this.createGrid();
      
      // Create player with selected character
      const selectedCharacter = gameInstance.gameData.selectedCharacter;
      this.player = this.physics.add.sprite(400, 300, `${selectedCharacter}-idle`);
      this.player.setCollideWorldBounds(true);
      this.player.setScale(1.5);
      
      // Setup keyboard controls
      this.cursors = this.input.keyboard?.createCursorKeys();
      
      // Add player name above character
      this.playerNameText = this.add.text(
        this.player.x, 
        this.player.y - 30, 
        gameInstance.gameData.playerName, 
        { fontSize: '14px', color: '#ffffff', stroke: '#000000', strokeThickness: 3 }
      );
      this.playerNameText.setOrigin(0.5);
      
      // Set camera to follow player
      this.cameras.main.setBounds(0, 0, 800, 600);
      this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
      
      // Display simple instructions
      const instructions = this.add.text(10, 10, 
        'Use arrow keys to move\nApproach players to chat/call', 
        { fontSize: '14px', color: '#ffffff', backgroundColor: '#000000', padding: { x: 5, y: 5 } }
      );
      instructions.setScrollFactor(0);
      
      // Start player animation
      this.player.play(`${selectedCharacter}-idle`);
      
      // Join the server with player data
      if (this.socket) {
        const playerData = {
          id: this.socket.id,
          name: gameInstance.gameData.playerName,
          position: { x: this.player.x, y: this.player.y },
          avatar: selectedCharacter
        };
        console.log('Joining server with player data:', playerData);
        this.socket.emit('join', playerData);
      }
      
      // Initial UI update
      this.events.emit('connectionStatus', !!this.socket?.connected);
      this.updatePlayerCount();
      
      // Setup visual indicator for proximity range
      this.createProximityCircle();
      
      console.log('OfficeScene create completed');
    } catch (error) {
      console.error('Error in OfficeScene create:', error);
    }
  }
  
  update(time: number) {
    if (!this.player || !this.cursors || !this.socket) return;
    
    // Track if player moved
    const prevX = this.player.x;
    const prevY = this.player.y;
    
    // Handle player movement
    const speed = 160; // Increased from 140 for faster movement
    let isMoving = false;
    let velocityX = 0;
    let velocityY = 0;
    
    if (this.cursors.left.isDown) {
      velocityX = -speed;
      this.player.flipX = true;
      isMoving = true;
    } else if (this.cursors.right.isDown) {
      velocityX = speed;
      this.player.flipX = false;
      isMoving = true;
    }
    
    if (this.cursors.up.isDown) {
      velocityY = -speed;
      isMoving = true;
    } else if (this.cursors.down.isDown) {
      velocityY = speed;
      isMoving = true;
    }
    
    // Apply velocity
    this.player.setVelocity(velocityX, velocityY);
    
    // Update player animation
    const gameInstance = this.game as Game;
    const selectedCharacter = gameInstance.gameData.selectedCharacter;
    
    if (isMoving) {
      this.player.play(`${selectedCharacter}-walk`, true);
    } else {
      this.player.play(`${selectedCharacter}-idle`, true);
    }
    
    // Update name text position
    if (this.playerNameText) {
      this.playerNameText.setPosition(this.player.x, this.player.y - 30);
    }
    
    // Update proximity circle position
    if (this.proximityCircle) {
      this.proximityCircle.setPosition(this.player.x, this.player.y);
    }
    
    // Check if player moved enough to send an update (to reduce network traffic)
    const positionChanged = Math.abs(prevX - this.player.x) > 1 || Math.abs(prevY - this.player.y) > 1;
    
    // Send position update to server if player moved
    if (isMoving && positionChanged) {
      this.socket.emit('move', { x: this.player.x, y: this.player.y });
      
      // Check for nearby players immediately when player moves
      this.checkNearbyPlayers();
      this.lastNearbyCheck = time;
    } 
    // Check for nearby players periodically even when not moving
    else if (time > this.lastNearbyCheck + this.nearbyCheckInterval) {
      this.checkNearbyPlayers();
      this.lastNearbyCheck = time;
    }
  }
  
  private proximityCircle?: Phaser.GameObjects.Graphics;
  
  private createProximityCircle() {
    if (this.proximityCircle) {
      this.proximityCircle.destroy();
    }
    
    this.proximityCircle = this.add.graphics();
    this.proximityCircle.lineStyle(2, 0x00ff00, 0.5); // Make circle more visible
    this.proximityCircle.strokeCircle(0, 0, this.proximityRadius);
    this.proximityCircle.setDepth(-1);
    
    if (this.player) {
      this.proximityCircle.setPosition(this.player.x, this.player.y);
    }
  }
  
  public checkNearbyPlayers() {
    if (!this.player || !this.socket) {
      console.warn('Cannot check nearby players: player or socket is null');
      return;
    }
    
    const nearbyIds: string[] = [];
    const playerCount = this.otherPlayers.size;
    
    console.log(`Checking proximity for ${playerCount} players. Current position: (${this.player.x}, ${this.player.y})`);
    
    this.otherPlayers.forEach((otherPlayer, id) => {
      const distance = Phaser.Math.Distance.Between(
        this.player.x, this.player.y,
        otherPlayer.x, otherPlayer.y
      );
      
      console.log(`Distance to player ${id}: ${Math.round(distance)} px (threshold: ${this.proximityRadius} px)`);
      
      if (distance <= this.proximityRadius) {
        nearbyIds.push(id);
        
        // Highlight players in range (more visible green tint)
        otherPlayer.setTint(0x00ff00);
        
        // Add visual indicator connecting the players
        this.drawConnectionLine(this.player, otherPlayer);
      } else {
        // Remove highlight
        otherPlayer.clearTint();
      }
    });
    
    // Log results of proximity check
    if (nearbyIds.length > 0) {
      console.log(`Players in proximity: ${nearbyIds.join(', ')}`);
    } else if (playerCount > 0) {
      console.log('No players in proximity range');
    }
    
    // Update the list in the React component - Force this to always run
    if (typeof window !== 'undefined') {
      if (typeof (window as any).updateNearbyUsers === 'function') {
        console.log('Sending nearby players to React:', nearbyIds);
        (window as any).updateNearbyUsers(nearbyIds);
      } else {
        console.error('updateNearbyUsers function is not available on window!');
      }
    }
  }
  
  // New method to visually show connection between nearby players
  private drawConnectionLine(player1: Phaser.Physics.Arcade.Sprite, player2: Phaser.Physics.Arcade.Sprite) {
    const graphics = this.add.graphics({ lineStyle: { width: 1, color: 0x00ff00, alpha: 0.3 } });
    graphics.lineBetween(player1.x, player1.y, player2.x, player2.y);
    
    // Remove the line after a short delay to prevent graphics buildup
    this.time.delayedCall(250, () => {
      graphics.destroy();
    });
  }
  
  private updatePlayerCount() {
    // Count includes the local player
    const count = this.otherPlayers.size + 1;
    this.events.emit('playerCountUpdated', count);
  }
  
  private createGrid() {
    // Create a grid for visual reference
    const graphics = this.add.graphics();
    graphics.lineStyle(1, 0xffffff, 0.2);
    
    // Draw horizontal lines
    for (let y = 0; y < 600; y += 50) {
      graphics.beginPath();
      graphics.moveTo(0, y);
      graphics.lineTo(800, y);
      graphics.closePath();
      graphics.strokePath();
    }
    
    // Draw vertical lines
    for (let x = 0; x < 800; x += 50) {
      graphics.beginPath();
      graphics.moveTo(x, 0);
      graphics.lineTo(x, 600);
      graphics.closePath();
      graphics.strokePath();
    }
  }
  
  private addOtherPlayer(userData: User) {
    if (this.otherPlayers.has(userData.id)) return;
    
    console.log(`Adding player ${userData.id} at position:`, userData.position);
    
    // Create the player sprite
    const otherPlayer = this.physics.add.sprite(
      userData.position.x, 
      userData.position.y, 
      `${userData.avatar || 'character1'}-idle`
    );
    otherPlayer.setScale(1.5);
    
    // Store player data
    otherPlayer.setData('userData', userData);
    
    // Start playing animation
    otherPlayer.play(`${userData.avatar || 'character1'}-idle`);
    
    // Add name above player
    const nameText = this.add.text(
      userData.position.x, 
      userData.position.y - 30, 
      userData.name, 
      { fontSize: '14px', color: '#ffffff', stroke: '#000000', strokeThickness: 3 }
    );
    nameText.setOrigin(0.5);
    
    // Store the sprite and text in a container for easy management
    otherPlayer.setData('nameText', nameText);
    
    // Store the player
    this.otherPlayers.set(userData.id, otherPlayer);
    
    // Check if the new player is nearby
    this.checkNearbyPlayers();
  }
  
  private removePlayer(userId: string) {
    const player = this.otherPlayers.get(userId);
    if (player) {
      // Remove the name text
      const nameText = player.getData('nameText');
      if (nameText) nameText.destroy();
      
      // Remove the player sprite
      player.destroy();
      
      // Remove from our map
      this.otherPlayers.delete(userId);
      
      console.log(`Removed player ${userId}`);
      
      // Update nearby players list
      this.checkNearbyPlayers();
    }
  }
  
  private updatePlayerPosition(userData: any) {
    const player = this.otherPlayers.get(userData.id);
    if (player) {
      // Update stored position data
      const storedData = player.getData('userData');
      player.setData('userData', { ...storedData, position: userData.position });
      
      // Update player position
      this.tweens.add({
        targets: player,
        x: userData.position.x,
        y: userData.position.y,
        duration: 100,
        ease: 'Linear',
        onComplete: () => {
          // Force proximity check immediately after a player moves
          this.checkNearbyPlayers();
        }
      });
      
      // Update name text position
      const nameText = player.getData('nameText');
      if (nameText) {
        this.tweens.add({
          targets: nameText,
          x: userData.position.x,
          y: userData.position.y - 30,
          duration: 100,
          ease: 'Linear'
        });
      }
    }
  }
}