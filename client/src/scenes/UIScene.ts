import Phaser from 'phaser'

export default class UIScene extends Phaser.Scene{
  gameRef!: any
  p1Bar!: Phaser.GameObjects.Graphics
  p2Bar!: Phaser.GameObjects.Graphics
  p1Special!: Phaser.GameObjects.Graphics
  p2Special!: Phaser.GameObjects.Graphics
  timerText!: Phaser.GameObjects.Text
  roundText!: Phaser.GameObjects.Text
  infoText!: Phaser.GameObjects.Text

  constructor(){ super('UIScene') }

  init(data:any){ this.gameRef = data.gameRef }

  create(){
    this.p1Bar = this.add.graphics()
    this.p2Bar = this.add.graphics()
    this.p1Special = this.add.graphics()
    this.p2Special = this.add.graphics()
    this.timerText = this.add.text(640, 40, '99', { fontFamily:'monospace', fontSize:'48px', color:'#E6F1FF' }).setOrigin(0.5)
    this.roundText = this.add.text(640, 90, 'Round 1', { fontFamily:'monospace', fontSize:'24px', color:'#9ad1ff' }).setOrigin(0.5)
    this.infoText = this.add.text(640, 670, 'Duplo toque para dash | Baixo + Forte para especial', {
      fontFamily:'monospace',
      fontSize:'18px',
      color:'#6fb5ff'
    }).setOrigin(0.5)
  }

  update(){
    const g = this.gameRef
    const [p1, p2] = g.fighters
    this.p1Bar.clear(); this.p1Bar.fillStyle(0x0b2940, 0.7).fillRect(36, 36, 408, 28); this.p1Bar.fillStyle(0x3aa1ff).fillRect(40, 40, 4*p1.hp, 20)
    this.p2Bar.clear(); this.p2Bar.fillStyle(0x40160b, 0.7).fillRect(1280-36-408, 36, 408, 28); this.p2Bar.fillStyle(0xff6a3a).fillRect(1280-40-4*p2.hp, 40, 4*p2.hp, 20)
    const meterWidth = 240
    this.p1Special.clear();
    this.p1Special.fillStyle(0x1a3b52, 0.8).fillRoundedRect(40, 68, meterWidth, 14, 6)
    this.p1Special.fillStyle(0x74d2ff).fillRoundedRect(40, 68, meterWidth*(p1.specialMeter/100), 14, 6)
    this.p2Special.clear();
    this.p2Special.fillStyle(0x521f1a, 0.8).fillRoundedRect(1280-40-meterWidth, 68, meterWidth, 14, 6)
    this.p2Special.fillStyle(0xffa874).fillRoundedRect(1280-40-meterWidth + (meterWidth*(1-p2.specialMeter/100)), 68, meterWidth*(p2.specialMeter/100), 14, 6)
    const secs = Math.ceil(g.roundTimer/60)
    this.timerText.setText(String(secs))
    this.roundText.setText(`Round ${g.round}  |  ${g.p1Wins} - ${g.p2Wins}`)
  }
}
