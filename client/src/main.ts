import Phaser from 'phaser'
import Boot from '@scenes/Boot'
import Menu from '@scenes/Menu'
import Game from '@scenes/Game'
import UIScene from '@scenes/UIScene'

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'app',
  backgroundColor: '#0b0e13',
  scale: { width: 1280, height: 720, mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  physics: { default: 'arcade', arcade: { gravity: { x: 0, y: 2000 }, debug: false } },
  scene: [Boot, Menu, Game, UIScene]
})

export default game
