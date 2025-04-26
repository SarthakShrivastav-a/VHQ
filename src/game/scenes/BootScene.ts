import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    // Create loading bar
    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(240, 270, 320, 50);
    
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    
    // Loading text
    const loadingText = this.make.text({
      x: width / 2,
      y: height / 2 - 50,
      text: 'Loading...',
      style: {
        font: '20px monospace',
        color: '#ffffff'
      }
    });
    loadingText.setOrigin(0.5, 0.5);
    
    // Percent text
    const percentText = this.make.text({
      x: width / 2,
      y: height / 2 - 5,
      text: '0%',
      style: {
        font: '18px monospace',
        color: '#ffffff'
      }
    });
    percentText.setOrigin(0.5, 0.5);
    
    // Loading assets text
    const assetText = this.make.text({
      x: width / 2,
      y: height / 2 + 50,
      text: '',
      style: {
        font: '18px monospace',
        color: '#ffffff'
      }
    });
    assetText.setOrigin(0.5, 0.5);
    
    // Update progress bar
    this.load.on('progress', (value: number) => {
      percentText.setText(parseInt((value * 100).toString()) + '%');
      progressBar.clear();
      progressBar.fillStyle(0xffffff, 1);
      progressBar.fillRect(250, 280, 300 * value, 30);
    });
    
    // Update file progress text
    this.load.on('fileprogress', (file: Phaser.Loader.File) => {
      assetText.setText('Loading asset: ' + file.key);
    });
    
    // Remove progress bar when complete
    this.load.on('complete', () => {
      progressBar.destroy();
      progressBox.destroy();
      loadingText.destroy();
      percentText.destroy();
      assetText.destroy();
      
      // Add a short delay before transitioning
      this.time.delayedCall(500, () => {
        this.scene.start('CharacterSelectScene');
      });
    });
    
    // Load all game assets
    this.loadAssets();
  }

  loadAssets() {
    // Load UI assets
    this.load.image('button', 'craftpix-net-396765-free-simple-platformer-game-kit-pixel-art/5 GUI/button.png');
    this.load.image('panel', 'craftpix-net-396765-free-simple-platformer-game-kit-pixel-art/5 GUI/panel.png');
    this.load.image('window', 'craftpix-net-396765-free-simple-platformer-game-kit-pixel-art/5 GUI/window.png');
    
    // Character preview images for selection screen
    this.load.image('character1-preview', 'craftpix-net-396765-free-simple-platformer-game-kit-pixel-art/1 Main Characters/1/Idle.png');
    this.load.image('character2-preview', 'craftpix-net-396765-free-simple-platformer-game-kit-pixel-art/1 Main Characters/2/Idle.png');
    this.load.image('character3-preview', 'craftpix-net-396765-free-simple-platformer-game-kit-pixel-art/1 Main Characters/3/Idle.png');
    
    // Load character assets
    this.load.spritesheet('character1-idle', 'craftpix-net-396765-free-simple-platformer-game-kit-pixel-art/1 Main Characters/1/Idle.png', {
      frameWidth: 32,
      frameHeight: 32
    });
    
    this.load.spritesheet('character1-run', 'craftpix-net-396765-free-simple-platformer-game-kit-pixel-art/1 Main Characters/1/Run.png', {
      frameWidth: 32,
      frameHeight: 32
    });
    
    this.load.spritesheet('character2-idle', 'craftpix-net-396765-free-simple-platformer-game-kit-pixel-art/1 Main Characters/2/Idle.png', {
      frameWidth: 32,
      frameHeight: 32
    });
    
    this.load.spritesheet('character2-run', 'craftpix-net-396765-free-simple-platformer-game-kit-pixel-art/1 Main Characters/2/Run.png', {
      frameWidth: 32,
      frameHeight: 32
    });
    
    this.load.spritesheet('character3-idle', 'craftpix-net-396765-free-simple-platformer-game-kit-pixel-art/1 Main Characters/3/Idle.png', {
      frameWidth: 32,
      frameHeight: 32
    });
    
    this.load.spritesheet('character3-run', 'craftpix-net-396765-free-simple-platformer-game-kit-pixel-art/1 Main Characters/3/Run.png', {
      frameWidth: 32,
      frameHeight: 32
    });
    
    // Load NPC assets
    this.load.spritesheet('npc1', 'craftpix-net-396765-free-simple-platformer-game-kit-pixel-art/1 Main Characters/2/Idle.png', {
      frameWidth: 32,
      frameHeight: 32
    });
    
    this.load.spritesheet('npc2', 'craftpix-net-396765-free-simple-platformer-game-kit-pixel-art/1 Main Characters/3/Idle.png', {
      frameWidth: 32,
      frameHeight: 32
    });
    
    // Load tile assets
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
    
    // Load UI icons
    this.load.image('task-icon', 'craftpix-net-396765-free-simple-platformer-game-kit-pixel-art/3 Objects/Gems/1.png');
    this.load.image('settings-icon', 'craftpix-net-396765-free-simple-platformer-game-kit-pixel-art/3 Objects/Gems/2.png');
    this.load.image('help-icon', 'craftpix-net-396765-free-simple-platformer-game-kit-pixel-art/3 Objects/Gems/3.png');
  }
} 