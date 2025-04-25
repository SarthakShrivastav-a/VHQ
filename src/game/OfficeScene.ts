import Phaser from 'phaser';

export default class OfficeScene extends Phaser.Scene {
  private player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private npc!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private textBubble!: Phaser.GameObjects.Container;
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private messageBubbleVisible = false;

  constructor() {
    super('OfficeScene');
  }

  preload() {
    // Load character assets from craftpix
    this.load.spritesheet('player', 'craftpix-net-396765-free-simple-platformer-game-kit-pixel-art/1 Main Characters/1/Idle.png', {
      frameWidth: 32,
      frameHeight: 32
    });
    
    this.load.spritesheet('player-run', 'craftpix-net-396765-free-simple-platformer-game-kit-pixel-art/1 Main Characters/1/Run.png', {
      frameWidth: 32,
      frameHeight: 32
    });
    
    this.load.spritesheet('npc', 'craftpix-net-396765-free-simple-platformer-game-kit-pixel-art/1 Main Characters/2/Idle.png', {
      frameWidth: 32,
      frameHeight: 32
    });
    
    // Additional character for variety
    this.load.spritesheet('npc2', 'craftpix-net-396765-free-simple-platformer-game-kit-pixel-art/1 Main Characters/3/Idle.png', {
      frameWidth: 32,
      frameHeight: 32
    });
    
    // Load simple tile images for walls instead of using a tilemap
    this.load.image('wall', 'craftpix-net-396765-free-simple-platformer-game-kit-pixel-art/2 Locations/Tiles/Tile_42.png');
    this.load.image('floor', 'craftpix-net-396765-free-simple-platformer-game-kit-pixel-art/2 Locations/Tiles/Tile_43.png');
    this.load.image('table', 'craftpix-net-396765-free-simple-platformer-game-kit-pixel-art/2 Locations/Tiles/Tile_14.png');
    this.load.image('desk', 'craftpix-net-396765-free-simple-platformer-game-kit-pixel-art/2 Locations/Tiles/Tile_12.png');
    this.load.image('chair', 'craftpix-net-396765-free-simple-platformer-game-kit-pixel-art/2 Locations/Tiles/Tile_13.png');
    
    // Load furniture and objects
    this.load.image('box-1', 'craftpix-net-396765-free-simple-platformer-game-kit-pixel-art/3 Objects/Boxes/1_Idle.png');
    this.load.image('box-2', 'craftpix-net-396765-free-simple-platformer-game-kit-pixel-art/3 Objects/Boxes/2_Idle.png');
    this.load.image('box-3', 'craftpix-net-396765-free-simple-platformer-game-kit-pixel-art/3 Objects/Boxes/3_Idle.png');
    
    // Load gems as office items
    this.load.image('gem-1', 'craftpix-net-396765-free-simple-platformer-game-kit-pixel-art/3 Objects/Gems/1.png');
    this.load.image('gem-2', 'craftpix-net-396765-free-simple-platformer-game-kit-pixel-art/3 Objects/Gems/2.png');
    this.load.image('gem-3', 'craftpix-net-396765-free-simple-platformer-game-kit-pixel-art/3 Objects/Gems/3.png');
    
    // Load more gems for decoration
    this.load.image('gem-4', 'craftpix-net-396765-free-simple-platformer-game-kit-pixel-art/3 Objects/Gems/4.png');
    this.load.image('gem-5', 'craftpix-net-396765-free-simple-platformer-game-kit-pixel-art/3 Objects/Gems/5.png');
    this.load.image('gem-6', 'craftpix-net-396765-free-simple-platformer-game-kit-pixel-art/3 Objects/Gems/6.png');
    
    // Load checkpoint as water cooler or coffee machine
    this.load.image('coffee-machine', 'craftpix-net-396765-free-simple-platformer-game-kit-pixel-art/3 Objects/Checkpoints/Checkpoint_No_Flag.png');
    
    // Use an image instead of a spritesheet for the flag
    this.load.image('flag', 'craftpix-net-396765-free-simple-platformer-game-kit-pixel-art/3 Objects/Checkpoints/Checkpoint_Flag_Idle1.png');
    
    // Load additional backgrounds
    this.load.image('bg-1', 'craftpix-net-396765-free-simple-platformer-game-kit-pixel-art/2 Locations/Backgrounds/1.png');
    this.load.image('bg-2', 'craftpix-net-396765-free-simple-platformer-game-kit-pixel-art/2 Locations/Backgrounds/2.png');
  }

  create() {
    // Add a solid color background first
    this.add.rectangle(400, 300, 800, 600, 0x87CEEB).setDepth(-2);
    
    // Add the pixel art background with transparency
    this.add.image(400, 300, 'bg-1').setScale(3).setAlpha(0.4).setDepth(-1);
    
    // Create animations first so they're available
    this.createAnimations();
    
    // Create walls and floor as individual sprites instead of using tilemap
    const walls = this.createEnvironment();
    
    // Create player at a more central position
    this.player = this.physics.add.sprite(400, 300, 'player');
    this.player.setCollideWorldBounds(true);
    this.player.setScale(1.5); // Scale up a bit
    
    // Create NPC in a more visible position
    this.npc = this.physics.add.sprite(300, 200, 'npc');
    this.npc.setImmovable(true);
    this.npc.setScale(1.5); // Scale up a bit
    
    // Create a second NPC character in a different area
    const npc2 = this.physics.add.sprite(500, 400, 'npc2');
    npc2.setImmovable(true);
    npc2.setScale(1.5);
    npc2.play('npc2-idle');
    
    // Add some decorative objects
    const box1 = this.physics.add.image(300, 150, 'box-1');
    box1.setImmovable(true);
    
    const box2 = this.physics.add.image(500, 350, 'box-2');
    box2.setImmovable(true);
    
    const box3 = this.physics.add.image(150, 450, 'box-3');
    box3.setImmovable(true);
    
    const coffeeMachine = this.physics.add.image(650, 200, 'coffee-machine');
    coffeeMachine.setImmovable(true);
    
    // Add decorative flags (like for a company celebration) and set a larger scale
    const flag1 = this.physics.add.image(150, 150, 'flag');
    flag1.setImmovable(true);
    flag1.setScale(0.8);
    
    const flag2 = this.physics.add.image(700, 500, 'flag');
    flag2.setImmovable(true);
    flag2.setScale(0.8);
    
    // Add some decorative gems as office supplies with slightly larger scale
    this.add.image(300, 250, 'gem-1').setScale(1.2);
    this.add.image(400, 350, 'gem-2').setScale(1.2);
    this.add.image(500, 150, 'gem-3').setScale(1.2);
    this.add.image(250, 400, 'gem-4').setScale(1.2);
    this.add.image(550, 250, 'gem-5').setScale(1.2);
    this.add.image(350, 500, 'gem-6').setScale(1.2);
    
    // Set collisions
    this.physics.add.collider(this.player, walls);
    this.physics.add.collider(this.player, this.npc);
    this.physics.add.collider(this.player, npc2);
    this.physics.add.collider(this.player, box1);
    this.physics.add.collider(this.player, box2);
    this.physics.add.collider(this.player, box3);
    this.physics.add.collider(this.player, coffeeMachine);
    this.physics.add.collider(this.player, flag1);
    this.physics.add.collider(this.player, flag2);
    
    // Create message bubble (initially hidden)
    this.textBubble = this.add.container(this.npc.x, this.npc.y - 50);
    const bubble = this.add.graphics();
    bubble.fillStyle(0xffffff, 0.8);
    bubble.fillRoundedRect(-70, -25, 140, 50, 10);
    bubble.lineStyle(2, 0x000000, 1);
    bubble.strokeRoundedRect(-70, -25, 140, 50, 10);
    
    const message = this.add.text(-60, -15, "Hey there!\nWelcome to the office!", { 
      fontSize: '12px', 
      color: '#000000' 
    });
    
    this.textBubble.add([bubble, message]);
    this.textBubble.setAlpha(0); // Initially hidden
    
    // Setup keyboard controls
    const keyboard = this.input.keyboard;
    this.cursors = keyboard ? keyboard.createCursorKeys() : undefined;
    
    // Camera settings
    this.cameras.main.setBounds(0, 0, 800, 600);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.setZoom(1.2); // Slightly reduce zoom to see more of the environment
    
    // Instructions
    const instructions = this.add.text(10, 10, 'Use arrow keys to move\nApproach the NPC to see a message', {
      fontSize: '12px',
      color: '#ffffff',
      backgroundColor: '#333333',
      padding: { x: 5, y: 5 }
    });
    instructions.setScrollFactor(0); // Fix to camera
    
    // Play animations for the player and NPC
    this.player.play('player-idle');
    this.npc.play('npc-idle');
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
    this.textBubble.setPosition(this.npc.x, this.npc.y - 40);
  }
  
  private createEnvironment() {
    // Create a physics group for walls
    const walls = this.physics.add.staticGroup();
    
    // Create outer walls
    const tileSize = 32;
    const width = 800 / tileSize;
    const height = 600 / tileSize;
    
    // First, create floor tiles across the entire map
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        // Add floor tiles everywhere
        this.add.image(x * tileSize + tileSize/2, y * tileSize + tileSize/2, 'floor');
      }
    }

    // Add a special meeting area
    const meetingAreaX = 10;
    const meetingAreaY = 10;
    const meetingAreaWidth = 5;
    const meetingAreaHeight = 5;

    // Add a blue carpet-like area for the meeting space (with gem patterns)
    for (let x = meetingAreaX; x < meetingAreaX + meetingAreaWidth; x++) {
      for (let y = meetingAreaY; y < meetingAreaY + meetingAreaHeight; y++) {
        // Create a special blue rectangle for meeting area
        const carpetRect = this.add.rectangle(
          x * tileSize + tileSize/2, 
          y * tileSize + tileSize/2, 
          tileSize, 
          tileSize, 
          0x6688cc, 
          0.5
        );
        
        // Add a gem in the center of the meeting area
        if (x === meetingAreaX + Math.floor(meetingAreaWidth/2) && 
            y === meetingAreaY + Math.floor(meetingAreaHeight/2)) {
          this.add.image(x * tileSize + tileSize/2, y * tileSize + tileSize/2, 'gem-6').setScale(1.5);
        }
      }
    }
    
    // Create border walls
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        // Only place walls on the edges
        if (x === 0 || y === 0 || x === width - 1 || y === height - 1) {
          walls.create(x * tileSize + tileSize/2, y * tileSize + tileSize/2, 'wall');
        }
      }
    }
    
    // Create meeting room walls
    for (let x = 2; x < 10; x++) {
      for (let y = 2; y < 7; y++) {
        if (x === 2 || y === 2 || x === 9 || y === 6) {
          walls.create(x * tileSize + tileSize/2, y * tileSize + tileSize/2, 'wall');
        } else if (x === 5 && y === 4) {
          // Add a meeting table
          this.physics.add.staticImage(x * tileSize + tileSize/2, y * tileSize + tileSize/2, 'table');
        }
      }
    }
    
    // Add some desks and chairs
    for (let x = 12; x < 28; x += 5) {
      for (let y = 4; y < 17; y += 4) {
        // Add a gem next to each desk for decoration
        this.add.image((x+1) * tileSize + tileSize/2, y * tileSize + tileSize/2, 'gem-' + (((x+y) % 6) + 1));
        
        // Desk
        this.physics.add.staticImage(x * tileSize + tileSize/2, y * tileSize + tileSize/2, 'desk');
        // Chair
        this.physics.add.staticImage(x * tileSize + tileSize/2, (y + 1) * tileSize + tileSize/2, 'chair');
      }
    }
    
    // Add more decoration with boxes in corners
    this.physics.add.staticImage(3 * tileSize, 3 * tileSize, 'box-1');
    this.physics.add.staticImage((width-3) * tileSize, 3 * tileSize, 'box-2');
    this.physics.add.staticImage(3 * tileSize, (height-3) * tileSize, 'box-3');
    this.physics.add.staticImage((width-3) * tileSize, (height-3) * tileSize, 'box-2');
    
    return walls;
  }
  
  private createAnimations() {
    // Player animations
    this.anims.create({
      key: 'player-idle',
      frames: this.anims.generateFrameNumbers('player', { start: 0, end: 3 }),
      frameRate: 10,
      repeat: -1
    });
    
    this.anims.create({
      key: 'player-walk',
      frames: this.anims.generateFrameNumbers('player-run', { start: 0, end: 5 }),
      frameRate: 10,
      repeat: -1
    });
    
    // NPC animations
    this.anims.create({
      key: 'npc-idle',
      frames: this.anims.generateFrameNumbers('npc', { start: 0, end: 3 }),
      frameRate: 10,
      repeat: -1
    });
    
    // NPC2 animations
    this.anims.create({
      key: 'npc2-idle',
      frames: this.anims.generateFrameNumbers('npc2', { start: 0, end: 3 }),
      frameRate: 10,
      repeat: -1
    });
  }
  
  private movePlayer() {
    // Early return if player or cursors are not defined
    if (!this.player || !this.cursors) return;
    
    // Reset velocity
    this.player.setVelocity(0);
    
    const speed = 140;
    let isMoving = false;
    
    if (this.cursors.left.isDown) {
      this.player.setVelocityX(-speed);
      this.player.flipX = true; // Flip sprite when moving left
      isMoving = true;
    } else if (this.cursors.right.isDown) {
      this.player.setVelocityX(speed);
      this.player.flipX = false; // Reset flip when moving right
      isMoving = true;
    }
    
    if (this.cursors.up.isDown) {
      this.player.setVelocityY(-speed);
      isMoving = true;
    } else if (this.cursors.down.isDown) {
      this.player.setVelocityY(speed);
      isMoving = true;
    }
    
    // Play appropriate animation
    if (isMoving) {
      this.player.play('player-walk', true);
    } else {
      this.player.play('player-idle', true);
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