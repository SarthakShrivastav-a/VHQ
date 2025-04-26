import Phaser from 'phaser';
import Game from '../PhaserGame';

export default class OfficeScene extends Phaser.Scene {
  private player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private npc!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private textBubble!: Phaser.GameObjects.Container;
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private messageBubbleVisible = false;
  
  // Task-related properties
  private taskZones: Phaser.GameObjects.Zone[] = [];
  private activeTaskZone: string | null = null;

  constructor() {
    super('OfficeScene');
  }

  create() {
    const gameInstance = this.game as Game;
    
    // Add a solid color background first
    this.add.rectangle(400, 300, 800, 600, 0x87CEEB).setDepth(-2);
    
    // Add the pixel art background with transparency
    this.add.image(400, 300, 'bg-1').setScale(3).setAlpha(0.4).setDepth(-1);
    
    // Create animations
    this.createAnimations();
    
    // Create walls and floor as individual sprites instead of using tilemap
    const walls = this.createEnvironment();
    
    // Create player at a more central position using the selected character
    const selectedCharacter = gameInstance.gameData.selectedCharacter;
    this.player = this.physics.add.sprite(400, 300, `${selectedCharacter}-idle`);
    this.player.setCollideWorldBounds(true);
    this.player.setScale(1.5); // Scale up a bit
    
    // Create NPCs
    this.npc = this.physics.add.sprite(300, 200, 'npc1');
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
    
    // Create task zones for completing game tasks
    this.createTaskZones(gameInstance);
    
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
    
    // Add task zone overlap
    this.physics.add.overlap(
      this.player, 
      this.taskZones, 
      this.handleTaskZoneOverlap as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback, 
      undefined, 
      this
    );
    
    // Create message bubble (initially hidden)
    this.textBubble = this.add.container(this.npc.x, this.npc.y - 50);
    const bubble = this.add.graphics();
    bubble.fillStyle(0xffffff, 0.8);
    bubble.fillRoundedRect(-70, -25, 140, 50, 10);
    bubble.lineStyle(2, 0x000000, 1);
    bubble.strokeRoundedRect(-70, -25, 140, 50, 10);
    
    const message = this.add.text(-60, -15, `Hey ${gameInstance.gameData.playerName}!\nWelcome to the office!`, { 
      fontSize: '12px', 
      color: '#000000' 
    });
    
    this.textBubble.add([bubble, message]);
    this.textBubble.setAlpha(0); // Initially hidden
    
    // Setup keyboard controls
    const keyboard = this.input.keyboard;
    this.cursors = keyboard ? keyboard.createCursorKeys() : undefined;
    
    // Add spacebar interaction for tasks
    this.input.keyboard?.on('keydown-SPACE', this.handleTaskInteraction, this);
    
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
    this.player.play(`${selectedCharacter}-idle`);
    this.npc.play('npc1-idle');
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
    
    // Show task interaction hint if player is in a task zone
    this.updateTaskInteractionHint();
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
  
  private createTaskZones(gameInstance: Game) {
    // Create zones for each task
    const tileSize = 32;
    
    // Task 1: Check email (at a desk)
    const emailTask = this.add.zone(12 * tileSize + tileSize/2, 4 * tileSize + tileSize/2, 64, 64);
    emailTask.setData('taskId', '1');
    this.physics.world.enable(emailTask);
    this.taskZones.push(emailTask);
    
    // Task 2: Attend meeting (in meeting room)
    const meetingTask = this.add.zone(5 * tileSize + tileSize/2, 4 * tileSize + tileSize/2, 64, 64);
    meetingTask.setData('taskId', '2');
    this.physics.world.enable(meetingTask);
    this.taskZones.push(meetingTask);
    
    // Task 3: Meet with colleagues (near NPC)
    const colleagueTask = this.add.zone(400, 200, 64, 64);
    colleagueTask.setData('taskId', '3');
    this.physics.world.enable(colleagueTask);
    this.taskZones.push(colleagueTask);
    
    // Visualize the task zones with markers
    this.taskZones.forEach(zone => {
      const taskId = zone.getData('taskId');
      const task = gameInstance.gameData.tasks.find(t => t.id === taskId);
      
      // Add a subtle marker for each task
      const color = task?.completed ? 0x55aa55 : 0xffff00;
      const marker = this.add.circle(zone.x, zone.y, 8, color, 0.5);
      
      // Add a pulsing effect to active task markers
      if (!task?.completed) {
        this.tweens.add({
          targets: marker,
          alpha: 0.8,
          duration: 1000,
          yoyo: true,
          repeat: -1
        });
      }
    });
  }
  
  private handleTaskZoneOverlap(player: Phaser.GameObjects.GameObject, zone: Phaser.GameObjects.Zone) {
    this.activeTaskZone = zone.getData('taskId');
  }
  
  private updateTaskInteractionHint() {
    // Remove any existing hint
    const existingHint = this.children.getByName('task-hint');
    if (existingHint) {
      existingHint.destroy();
    }
    
    // If player is in a task zone, show a hint
    if (this.activeTaskZone) {
      const gameInstance = this.game as Game;
      const task = gameInstance.gameData.tasks.find(t => t.id === this.activeTaskZone);
      
      if (task && !task.completed) {
        const hint = this.add.text(
          this.player.x, 
          this.player.y - 40, 
          '[SPACE] to ' + task.text, 
          {
            fontSize: '12px',
            backgroundColor: '#00000080',
            padding: { x: 5, y: 2 },
            color: '#ffffff'
          }
        ).setOrigin(0.5).setName('task-hint');
      }
    }
    
    // Reset active zone (will be set again on next overlap if player still in zone)
    this.activeTaskZone = null;
  }
  
  private handleTaskInteraction() {
    if (!this.activeTaskZone) return;
    
    const gameInstance = this.game as Game;
    const task = gameInstance.gameData.tasks.find(t => t.id === this.activeTaskZone);
    
    if (task && !task.completed) {
      // Mark task as completed
      task.completed = true;
      
      // Visual feedback
      this.cameras.main.flash(500, 0, 255, 0);
      
      // Play sound (would add sound effect here)
      
      // Update the UI scene
      this.scene.get('UIScene').events.emit('updateTasks');
      
      // Show completion message
      const completionText = this.add.text(
        this.player.x, 
        this.player.y - 60, 
        'Task completed!', 
        {
          fontSize: '16px',
          fontStyle: 'bold',
          color: '#55ff55',
          stroke: '#000000',
          strokeThickness: 4
        }
      ).setOrigin(0.5);
      
      // Animate and remove the completion message
      this.tweens.add({
        targets: completionText,
        y: completionText.y - 50,
        alpha: 0,
        duration: 2000,
        onComplete: () => completionText.destroy()
      });
      
      // Check if all tasks are completed
      const allTasksCompleted = gameInstance.gameData.tasks.every(t => t.completed);
      if (allTasksCompleted) {
        this.showGameComplete();
      }
    }
  }
  
  private showGameComplete() {
    // Create a completion overlay
    const overlay = this.add.rectangle(400, 300, 800, 600, 0x000000, 0.7);
    overlay.setDepth(100);
    
    const completionText = this.add.text(
      400, 
      250, 
      'CONGRATULATIONS!\nYou completed all office tasks!', 
      {
        fontSize: '32px',
        fontStyle: 'bold',
        color: '#ffffff',
        align: 'center'
      }
    ).setOrigin(0.5).setDepth(101);
    
    const continueText = this.add.text(
      400, 
      350, 
      'Press SPACE to continue exploring\nor ESC to return to character selection', 
      {
        fontSize: '16px',
        color: '#ffffff',
        align: 'center'
      }
    ).setOrigin(0.5).setDepth(101);
    
    // Add input handlers
    this.input.keyboard?.once('keydown-SPACE', () => {
      overlay.destroy();
      completionText.destroy();
      continueText.destroy();
    });
    
    this.input.keyboard?.once('keydown-ESC', () => {
      this.scene.start('CharacterSelectScene');
    });
  }
  
  private createAnimations() {
    // Player animations for each character
    ['character1', 'character2', 'character3'].forEach(character => {
      this.anims.create({
        key: `${character}-idle`,
        frames: this.anims.generateFrameNumbers(`${character}-idle`, { start: 0, end: 3 }),
        frameRate: 10,
        repeat: -1
      });
      
      this.anims.create({
        key: `${character}-walk`,
        frames: this.anims.generateFrameNumbers(`${character}-run`, { start: 0, end: 5 }),
        frameRate: 10,
        repeat: -1
      });
    });
    
    // NPC animations
    this.anims.create({
      key: 'npc1-idle',
      frames: this.anims.generateFrameNumbers('npc1', { start: 0, end: 3 }),
      frameRate: 10,
      repeat: -1
    });
    
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
    
    // Get the selected character
    const gameInstance = this.game as Game;
    const selectedCharacter = gameInstance.gameData.selectedCharacter;
    
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
      this.player.play(`${selectedCharacter}-walk`, true);
    } else {
      this.player.play(`${selectedCharacter}-idle`, true);
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