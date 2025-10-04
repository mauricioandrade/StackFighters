import Phaser from 'phaser'
import jsPng from '../assets/js_fighter.png'
import vascoPng from '../assets/vasco_fighter.png'

export default class Boot extends Phaser.Scene {
  constructor(){ super('Boot') }
  preload(){
    this.load.image('fighter-js', jsPng)
    this.load.image('fighter-vasco', vascoPng)
  }
  create(){ this.scene.start('Menu') }
}
