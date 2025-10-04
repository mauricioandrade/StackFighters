import Phaser from 'phaser'

export default class UIScene extends Phaser.Scene{
  gameRef!: any
  p1Bar!: Phaser.GameObjects.Graphics
  p2Bar!: Phaser.GameObjects.Graphics
  timerText!: Phaser.GameObjects.Text
  roundText!: Phaser.GameObjects.Text

  constructor(){ super('UIScene') }

  init(data:any){ this.gameRef = data.gameRef }

  create(){
    this.p1Bar = this.add.graphics()
    this.p2Bar = this.add.graphics()
    this.timerText = this.add.text(640, 40, '99', { fontFamily:'monospace', fontSize:'48px', color:'#E6F1FF' }).setOrigin(0.5)
    this.roundText = this.add.text(640, 90, 'Round 1', { fontFamily:'monospace', fontSize:'24px', color:'#9ad1ff' }).setOrigin(0.5)
  }

  update(){
    const g = this.gameRef
    const [p1, p2] = g.fighters
    this.p1Bar.clear(); this.p1Bar.fillStyle(0x3aa1ff).fillRect(40, 40, 4*p1.hp, 20)
    this.p2Bar.clear(); this.p2Bar.fillStyle(0xff6a3a).fillRect(1280-40-4*p2.hp, 40, 4*p2.hp, 20)
    const secs = Math.ceil(g.roundTimer/60)
    this.timerText.setText(String(secs))
    this.roundText.setText(`Round ${g.round}  |  ${g.p1Wins} - ${g.p2Wins}`)
  }
}
