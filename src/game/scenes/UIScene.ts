import Phaser from 'phaser';
import Game from '../PhaserGame';

export default class UIScene extends Phaser.Scene {
  private taskListPanel?: Phaser.GameObjects.Container;
  private settingsPanel?: Phaser.GameObjects.Container;
  private helpPanel?: Phaser.GameObjects.Container;
  private playerNameText?: Phaser.GameObjects.Text;
  private taskCompletionText?: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'UIScene', active: false });
  }

  create() {
    const gameInstance = this.game as Game;
    
    // Create top bar
    this.createTopBar(gameInstance);
    
    // Create UI buttons
    this.createUIButtons();
    
    // Create panels (initially hidden)
    this.createTaskListPanel(gameInstance);
    this.createSettingsPanel();
    this.createHelpPanel();
    
    // Hide all panels initially
    this.togglePanel(this.taskListPanel, false);
    this.togglePanel(this.settingsPanel, false);
    this.togglePanel(this.helpPanel, false);
    
    // Listen for events from the main scene
    this.listenForEvents();
  }

  update() {
    // Update task completion counter
    this.updateTaskCompletion();
  }

  private createTopBar(gameInstance: Game) {
    // Top bar background
    const topBar = this.add.rectangle(400, 25, 800, 50, 0x333333, 0.8);
    
    // Player name
    this.playerNameText = this.add.text(20, 25, gameInstance.gameData.playerName, {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#ffffff'
    }).setOrigin(0, 0.5);
    
    // Task completion tracker
    this.taskCompletionText = this.add.text(780, 25, '0/3 Tasks', {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#ffffff'
    }).setOrigin(1, 0.5);
  }

  private createUIButtons() {
    // Task list button
    const taskButton = this.add.circle(730, 25, 15, 0x55aa55);
    taskButton.setInteractive();
    
    const taskIcon = this.add.image(730, 25, 'task-icon').setScale(0.8);
    
    taskButton.on('pointerup', () => {
      this.togglePanel(this.taskListPanel, true);
      this.togglePanel(this.settingsPanel, false);
      this.togglePanel(this.helpPanel, false);
    });
    
    // Settings button
    const settingsButton = this.add.circle(770, 25, 15, 0x5555aa);
    settingsButton.setInteractive();
    
    const settingsIcon = this.add.image(770, 25, 'settings-icon').setScale(0.8);
    
    settingsButton.on('pointerup', () => {
      this.togglePanel(this.taskListPanel, false);
      this.togglePanel(this.settingsPanel, true);
      this.togglePanel(this.helpPanel, false);
    });
    
    // Help button
    const helpButton = this.add.circle(690, 25, 15, 0xaa5555);
    helpButton.setInteractive();
    
    const helpIcon = this.add.image(690, 25, 'help-icon').setScale(0.8);
    
    helpButton.on('pointerup', () => {
      this.togglePanel(this.taskListPanel, false);
      this.togglePanel(this.settingsPanel, false);
      this.togglePanel(this.helpPanel, true);
    });
  }

  private createTaskListPanel(gameInstance: Game) {
    this.taskListPanel = this.add.container(400, 300);
    
    // Panel background
    const panel = this.add.rectangle(0, 0, 400, 300, 0x333333, 0.9);
    panel.setStrokeStyle(2, 0x55aa55);
    
    // Title
    const title = this.add.text(0, -130, 'TASKS', {
      fontFamily: 'Arial',
      fontSize: '24px',
      color: '#ffffff'
    }).setOrigin(0.5);
    
    // Close button
    const closeButton = this.add.circle(180, -130, 12, 0xaa5555);
    closeButton.setInteractive();
    
    const closeText = this.add.text(180, -130, 'X', {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#ffffff'
    }).setOrigin(0.5);
    
    closeButton.on('pointerup', () => {
      this.togglePanel(this.taskListPanel, false);
    });
    
    // Task list
    const taskItems = gameInstance.gameData.tasks.map((task, index) => {
      const y = -70 + (index * 50);
      
      const taskItem = this.add.rectangle(0, y, 350, 40, 0x444444, 0.8);
      
      const checkbox = this.add.rectangle(-150, y, 24, 24, 0x666666);
      checkbox.setStrokeStyle(2, 0xffffff);
      
      const taskText = this.add.text(-130, y, task.text, {
        fontFamily: 'Arial',
        fontSize: '16px',
        color: '#ffffff'
      }).setOrigin(0, 0.5);
      
      checkbox.setInteractive();
      checkbox.setData('taskId', task.id);
      
      checkbox.on('pointerup', () => {
        this.toggleTaskCompletion(task.id);
        
        // Update the checkbox visually
        const isCompleted = gameInstance.gameData.tasks.find(t => t.id === task.id)?.completed;
        if (isCompleted) {
          checkbox.setFillStyle(0x55aa55);
        } else {
          checkbox.setFillStyle(0x666666);
        }
      });
      
      return [taskItem, checkbox, taskText];
    }).flat();
    
    // Add all elements to container
    this.taskListPanel.add([panel, title, closeButton, closeText, ...taskItems]);
  }

  private createSettingsPanel() {
    this.settingsPanel = this.add.container(400, 300);
    
    // Panel background
    const panel = this.add.rectangle(0, 0, 400, 300, 0x333333, 0.9);
    panel.setStrokeStyle(2, 0x5555aa);
    
    // Title
    const title = this.add.text(0, -130, 'SETTINGS', {
      fontFamily: 'Arial',
      fontSize: '24px',
      color: '#ffffff'
    }).setOrigin(0.5);
    
    // Close button
    const closeButton = this.add.circle(180, -130, 12, 0xaa5555);
    closeButton.setInteractive();
    
    const closeText = this.add.text(180, -130, 'X', {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#ffffff'
    }).setOrigin(0.5);
    
    closeButton.on('pointerup', () => {
      this.togglePanel(this.settingsPanel, false);
    });
    
    // Settings options
    const musicText = this.add.text(-150, -70, 'Music Volume', {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#ffffff'
    });
    
    const musicSlider = this.add.rectangle(50, -70, 200, 20, 0x666666);
    musicSlider.setInteractive();
    const musicLevel = this.add.rectangle(-50, -70, 100, 20, 0x55aa55);
    
    const sfxText = this.add.text(-150, -30, 'SFX Volume', {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#ffffff'
    });
    
    const sfxSlider = this.add.rectangle(50, -30, 200, 20, 0x666666);
    sfxSlider.setInteractive();
    const sfxLevel = this.add.rectangle(-50, -30, 100, 20, 0x55aa55);
    
    // Character change button
    const changeCharacterButton = this.add.rectangle(0, 40, 250, 40, 0x5555aa);
    changeCharacterButton.setInteractive();
    
    const changeCharacterText = this.add.text(0, 40, 'Change Character', {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#ffffff'
    }).setOrigin(0.5);
    
    changeCharacterButton.on('pointerup', () => {
      this.scene.start('CharacterSelectScene');
    });
    
    // Restart button
    const restartButton = this.add.rectangle(0, 90, 250, 40, 0xaa5555);
    restartButton.setInteractive();
    
    const restartText = this.add.text(0, 90, 'Restart Game', {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#ffffff'
    }).setOrigin(0.5);
    
    restartButton.on('pointerup', () => {
      this.scene.start('BootScene');
    });
    
    // Add all elements to container
    this.settingsPanel.add([
      panel, title, closeButton, closeText,
      musicText, musicSlider, musicLevel,
      sfxText, sfxSlider, sfxLevel,
      changeCharacterButton, changeCharacterText,
      restartButton, restartText
    ]);
  }

  private createHelpPanel() {
    this.helpPanel = this.add.container(400, 300);
    
    // Panel background
    const panel = this.add.rectangle(0, 0, 400, 300, 0x333333, 0.9);
    panel.setStrokeStyle(2, 0xaa5555);
    
    // Title
    const title = this.add.text(0, -130, 'HELP', {
      fontFamily: 'Arial',
      fontSize: '24px',
      color: '#ffffff'
    }).setOrigin(0.5);
    
    // Close button
    const closeButton = this.add.circle(180, -130, 12, 0xaa5555);
    closeButton.setInteractive();
    
    const closeText = this.add.text(180, -130, 'X', {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#ffffff'
    }).setOrigin(0.5);
    
    closeButton.on('pointerup', () => {
      this.togglePanel(this.helpPanel, false);
    });
    
    // Help content
    const helpContent = [
      'CONTROLS:',
      '- Use Arrow Keys to move',
      '- Approach NPCs to talk to them',
      '- Complete tasks to progress',
      '',
      'TIPS:',
      '- Explore the office environment',
      '- Talk to colleagues to get hints',
      '- Check your task list regularly'
    ].join('\n');
    
    const helpText = this.add.text(0, 0, helpContent, {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#ffffff',
      align: 'center'
    }).setOrigin(0.5);
    
    // Add all elements to container
    this.helpPanel.add([panel, title, closeButton, closeText, helpText]);
  }

  private togglePanel(panel?: Phaser.GameObjects.Container, visible: boolean = true) {
    if (!panel) return;
    
    panel.setVisible(visible);
    panel.setActive(visible);
  }

  private toggleTaskCompletion(taskId: string) {
    const gameInstance = this.game as Game;
    const task = gameInstance.gameData.tasks.find(t => t.id === taskId);
    
    if (task) {
      task.completed = !task.completed;
      this.updateTaskCompletion();
    }
  }

  private updateTaskCompletion() {
    const gameInstance = this.game as Game;
    const completedTasks = gameInstance.gameData.tasks.filter(t => t.completed).length;
    const totalTasks = gameInstance.gameData.tasks.length;
    
    if (this.taskCompletionText) {
      this.taskCompletionText.setText(`${completedTasks}/${totalTasks} Tasks`);
    }
  }

  private listenForEvents() {
    // Listen for task update events from the main scene
    this.events.on('updateTasks', this.updateTaskCompletion, this);
  }
} 