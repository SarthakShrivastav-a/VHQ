import Phaser from 'phaser';

export default class OfficeScene extends Phaser.Scene {
  private player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private npc!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private textBubble!: Phaser.GameObjects.Container;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private messageBubbleVisible = false;
  private walls!: Phaser.Physics.Arcade.StaticGroup;

  constructor() {
    super('OfficeScene');
  }

  preload() {
    // We'll generate a simple texture for our player and NPC
    this.createPlayerTexture();
    this.createNpcTexture();
  }

  createPlayerTexture() {
    // Create a canvas texture for the player (blue square)
    const graphics = this.make.graphics({ x: 0, y: 0, add: false });
    graphics.fillStyle(0x0000ff); // Blue color
    graphics.fillRect(0, 0, 30, 30);
    graphics.generateTexture('playerTexture', 30, 30);
  }

  createNpcTexture() {
    // Create a canvas texture for the NPC (red square)
    const graphics = this.make.graphics({ x: 0, y: 0, add: false });
    graphics.fillStyle(0xff0000); // Red color
    graphics.fillRect(0, 0, 30, 30);
    graphics.generateTexture('npcTexture', 30, 30);
  }

  create() {
    // Create a simple office layout using graphics
    this.createOfficeLayout();
    
    // Create player using the generated texture
    this.player = this.physics.add.sprite(100, 100, 'playerTexture');
    this.player.setCollideWorldBounds(true);
    
    // Create NPC using the generated texture
    this.npc = this.physics.add.sprite(250, 150, 'npcTexture');
    this.npc.setImmovable(true);
    
    // Set collisions
    this.physics.add.collider(this.player, this.walls);
    this.physics.add.collider(this.player, this.npc);
    
    // Create message bubble (initially hidden)
    this.textBubble = this.add.container(this.npc.x, this.npc.y - 50);
    const bubble = this.add.graphics();
    bubble.fillStyle(0xffffff, 0.8);
    bubble.fillRoundedRect(-70, -25, 140, 50, 10);
    bubble.lineStyle(2, 0x000000, 1);
    bubble.strokeRoundedRect(-70, -25, 140, 50, 10);
    
    const message = this.add.text(-60, -15, "Hello there!\nHow are you?", { 
      fontSize: '12px', 
      color: '#000000' 
    });
    
    this.textBubble.add([bubble, message]);
    this.textBubble.setAlpha(0); // Initially hidden
    
    // Setup keyboard controls
    this.cursors = this.input.keyboard.createCursorKeys();
    
    // Enable world bounds
    this.physics.world.setBounds(0, 0, 800, 600);
    
    // Set the background color to a light beige (office-like)
    this.cameras.main.setBackgroundColor('#f5f5dc');
    
    // Add some instructions text
    this.add.text(10, 10, 'Use arrow keys to move\nApproach the red NPC to see a message', {
      fontSize: '16px',
      color: '#000000',
      backgroundColor: '#ffffff',
      padding: { x: 5, y: 5 }
    });
  }
  
  update() {
    if (!this.player || !this.npc) return;
    
    // Player movement
    this.movePlayer();
    
    // Check distance between player and NPC
    const distance = Phaser.Math.Distance.Between(
      this.player.x, this.player.y,
      this.npc.x, this.npc.y
    );
    
    // Show/hide message bubble based on distance (48 pixels ≈ 1 tile radius)
    if (distance <= 48 && !this.messageBubbleVisible) {
      this.showMessageBubble();
    } else if (distance > 48 && this.messageBubbleVisible) {
      this.hideMessageBubble();
    }
    
    // Update the position of the text bubble to follow the NPC
    this.textBubble.setPosition(this.npc.x, this.npc.y - 50);
  }
  
  private createOfficeLayout() {
    // Create a static group for walls and furniture
    this.walls = this.physics.add.staticGroup();
    
    // Create office boundaries (walls)
    this.createWall(0, 0, 800, 20); // Top wall
    this.createWall(0, 580, 800, 20); // Bottom wall
    this.createWall(0, 0, 20, 600); // Left wall
    this.createWall(780, 0, 20, 600); // Right wall
    
    // Create some office furniture (desks)
    this.createDesk(100, 200, 150, 80);
    this.createDesk(500, 200, 150, 80);
    this.createDesk(100, 400, 150, 80);
    this.createDesk(500, 400, 150, 80);
    
    // Create a meeting table in the center
    this.createMeetingTable(350, 300, 100, 100);
  }
  
  private createWall(x: number, y: number, width: number, height: number) {
    const wall = this.add.rectangle(x, y, width, height, 0x888888);
    wall.setOrigin(0, 0); // Set origin to top-left
    this.walls.add(wall);
  }
  
  private createDesk(x: number, y: number, width: number, height: number) {
    // Add desk visuals (brown rectangle)
    const desk = this.add.rectangle(x, y, width, height, 0x8B4513);
    desk.setOrigin(0, 0);
    
    // Add desk to walls group for collision
    this.walls.add(desk);
    
    // Add a chair (smaller green rectangle)
    const chair = this.add.rectangle(x + width/2 - 15, y + height + 5, 30, 30, 0x006400);
    chair.setOrigin(0, 0);
  }
  
  private createMeetingTable(x: number, y: number, width: number, height: number) {
    // Add meeting table visuals (gray oval)
    const table = this.add.ellipse(x + width/2, y + height/2, width, height, 0x444444);
    
    // Convert to rectangle for collision purposes
    const tableCollider = this.add.rectangle(x, y, width, height, 0x444444);
    tableCollider.setOrigin(0, 0);
    tableCollider.setAlpha(0); // Make it invisible
    
    // Add table to walls group for collision
    this.walls.add(tableCollider);
  }
  
  private movePlayer() {
    // Reset velocity
    this.player.setVelocity(0);
    
    // Handle movement
    const speed = 160;
    
    if (this.cursors.left.isDown) {
      this.player.setVelocityX(-speed);
    } else if (this.cursors.right.isDown) {
      this.player.setVelocityX(speed);
    }
    
    if (this.cursors.up.isDown) {
      this.player.setVelocityY(-speed);
    } else if (this.cursors.down.isDown) {
      this.player.setVelocityY(speed);
    }
  }
  
  private showMessageBubble() {
    this.messageBubbleVisible = true;
    this.tweens.add({
      targets: this.textBubble,
      alpha: 1,
      duration: 200,
      ease: 'Power2'
    });
  }
  
  private hideMessageBubble() {
    this.messageBubbleVisible = false;
    this.tweens.add({
      targets: this.textBubble,
      alpha: 0,
      duration: 200,
      ease: 'Power2'
    });
  }
}