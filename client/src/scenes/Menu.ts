import Phaser from 'phaser'
import NetClient from '@net/NetClient'

export default class Menu extends Phaser.Scene {
  private title!: Phaser.GameObjects.Text
  constructor(){ super('Menu') }

  create(){
    const { width, height } = this.scale
    this.title = this.add.text(width/2, height*0.25, 'STACK FIGHTERS', { fontFamily: 'monospace', fontSize: '64px', color: '#E6F1FF' }).setOrigin(0.5)

    const localBtn = this.makeButton(width/2, height*0.5, 'Local Versus', () => {
      this.scene.start('Game', { mode: 'local' })
    })
    const onlineBtn = this.makeButton(width/2, height*0.62, 'Online 1v1', async () => {
      const net = NetClient.get()
      await net.connect()
      await net.joinOrCreate('fight_room')
      this.scene.start('Game', { mode: 'online' })
    })
    this.input.keyboard!.on('keydown-ESC', () => this.game.destroy(true))
  }

  private makeButton(x:number, y:number, label:string, onClick:()=>void){
    const t = this.add.text(x, y, label, { fontFamily: 'monospace', fontSize: '32px', color: '#9ad1ff' }).setOrigin(0.5).setInteractive({ useHandCursor: true })
    t.on('pointerover', () => t.setColor('#ffffff'))
    t.on('pointerout',  () => t.setColor('#9ad1ff'))
    t.on('pointerdown', onClick)
    return t
  }
}
