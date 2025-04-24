import Phaser from 'phaser';

export default class OfficeScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private npc!: Phaser.Physics.Arcade.Sprite;
  private textBubble!: Phaser.GameObjects.Container;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private messageBubbleVisible = false;

  constructor() {
    super('OfficeScene');
  }

  preload() {
    // Load assets
    this.load.image('tiles', '/assets/office_tileset.png');
    this.load.tilemapTiledJSON('office-map', '/assets/office_map.json');
    this.load.spritesheet('player', '/assets/character.png', { frameWidth: 32, frameHeight: 48 });
    this.load.spritesheet('npc', '/assets/npc.png', { frameWidth: 32, frameHeight: 48 });
  }

  create() {
    // Create the office map
    const map = this.make.tilemap({ key: 'office-map' });
    const tileset = map.addTilesetImage('office_tileset', 'tiles');
    
    // Create layers
    const floorLayer = map.createLayer('Floor', tileset, 0, 0);
    const furnitureLayer = map.createLayer('Furniture', tileset, 0, 0);
    
    // Set collisions for furniture
    furnitureLayer.setCollisionByProperty({ collides: true });
    
    // Create player
    this.player = this.physics.add.sprite(100, 100, 'player');
    this.player.setCollideWorldBounds(true);
    
    // Create NPC
    this.npc = this.physics.add.sprite(250, 150, 'npc');
    this.npc.setImmovable(true);
    
    // Set collisions
    this.physics.add.collider(this.player, furnitureLayer);
    this.physics.add.collider(this.player, this.npc);
    
    // Create message bubble (initially hidden)
    this.textBubble = this.add.container(this.npc.x, this.npc.y - 50);
    const bubble = this.add.graphics();
    bubble.fillStyle(0xffffff, 0.8);
    bubble.fillRoundedRect(0, 0, 140, 40, 10);
    bubble.lineStyle(2, 0x000000, 1);
    bubble.strokeRoundedRect(0, 0, 140, 40, 10);
    
    const message = this.add.text(10, 10, "Hello there!", { 
      fontSize: '12px', 
      color: '#000000' 
    });
    
    this.textBubble.add([bubble, message]);
    this.textBubble.setAlpha(0); // Initially hidden
    
    // Setup player animations
    this.createPlayerAnimations();
    
    // Setup keyboard controls
    this.cursors = this.input.keyboard.createCursorKeys();
    
    // Enable world bounds
    this.physics.world.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    
    // Follow the player with the camera
    this.cameras.main.startFollow(this.player);
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
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
    
    // Show/hide message bubble based on distance
    if (distance <= 48 && !this.messageBubbleVisible) { // 48 = approximately 1 tile radius
      this.showMessageBubble();
    } else if (distance > 48 && this.messageBubbleVisible) {
      this.hideMessageBubble();
    }
    
    //position update alowwing text bubble to follow user
    this.textBubble.setPosition(this.npc.x - 70, this.npc.y - 50);
  }
  
  private movePlayer() {
    // resettting velocity 
    this.player.setVelocity(0);
    
    //movement
    if (this.cursors.left.isDown) {
      this.player.setVelocityX(-100);
      this.player.anims.play('walk-left', true);
    } else if (this.cursors.right.isDown) {
      this.player.setVelocityX(100);
      this.player.anims.play('walk-right', true);
    } else if (this.cursors.up.isDown) {
      this.player.setVelocityY(-100);
      this.player.anims.play('walk-up', true);
    } else if (this.cursors.down.isDown) {
      this.player.setVelocityY(100);
      this.player.anims.play('walk-down', true);
    } else {
      // no animations if no keys are pressed 
      this.player.anims.stop();
    }
  }
  
  private createPlayerAnimations() {
    
    this.anims.create({ // player animations
      key: 'walk-left',
      frames: this.anims.generateFrameNumbers('player', { start: 3, end: 5 }),
      frameRate: 10,
      repeat: -1
    });
    
    this.anims.create({
      key: 'walk-right',
      frames: this.anims.generateFrameNumbers('player', { start: 6, end: 8 }),
      frameRate: 10,
      repeat: -1
    });
    
    this.anims.create({
      key: 'walk-up',
      frames: this.anims.generateFrameNumbers('player', { start: 9, end: 11 }),
      frameRate: 10,
      repeat: -1
    });
    
    this.anims.create({
      key: 'walk-down',
      frames: this.anims.generateFrameNumbers('player', { start: 0, end: 2 }),
      frameRate: 10,
      repeat: -1
    });
  }
  
  private showMessageBubble() {
    this.messageBubbleVisible = true;
    this.add.tween({
      targets: this.textBubble,
      alpha: 1,
      duration: 200,
      ease: 'Power2'
    });
  }
  
  private hideMessageBubble() {
    this.messageBubbleVisible = false;
    this.add.tween({
      targets: this.textBubble,
      alpha: 0,
      duration: 200,
      ease: 'Power2'
    });
  }
}