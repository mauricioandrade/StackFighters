import Phaser from 'phaser'
import Fighter from '@objects/Fighter'
import UIScene from './UIScene'
import NetClient from '@net/NetClient'

type Mode = 'local' | 'online'

export default class Game extends Phaser.Scene {
  mode: Mode = 'local'
  fighters: Fighter[] = []
  ground!: Phaser.Physics.Arcade.StaticGroup
  cursors1: any
  cursors2: any
  round = 1
  p1Wins = 0
  p2Wins = 0
  roundTimer = 99 * 60
  paused = false

  // feedback visual quando um golpe acerta
  hitFlash(target: Phaser.GameObjects.Sprite){
    const fx = this.add.rectangle(
      target.x,
      target.y - target.displayHeight * 0.4,
      22, 22,
      0xffffff, 0.9
    )
    this.tweens.add({
      targets: fx,
      alpha: 0,
      y: (fx.y as number) - 10,
      duration: 90,
      onComplete: () => fx.destroy()
    })
  }

  constructor(){ super('Game') }

  init(data:any){ this.mode = data?.mode ?? 'local' }

  create(){
    const { width, height } = this.scale

    // chão
    this.ground = this.physics.add.staticGroup()
    const floor = this.add.rectangle(width/2, height-30, width*1.2, 60, 0x222b3a)
    this.physics.add.existing(floor, true)
    this.ground.add(floor)

    // limites do mundo (um pouco mais apertados)
    this.physics.world.setBounds(20, 0, width-40, height)

    // fighters (usando seus sprites)
    const p1 = new Fighter(this, width*0.35, height-120, 'P1', 'fighter-js')
    const p2 = new Fighter(this, width*0.65, height-120, 'P2', 'fighter-vasco')
    this.fighters = [p1, p2]

    // colisões
    this.physics.add.collider(this.fighters, this.ground)
    // impede os personagens de atravessarem um ao outro
    this.physics.add.collider(p1, p2)

    // câmera
    this.cameras.main.setBounds(0,0,width,height)
    this.cameras.main.startFollow(p1, true, 0.06, 0.06)

    // inputs
    this.cursors1 = this.makeControls({ left:'A', right:'D', up:'W', down:'S', light:'J', heavy:'K', block:'L' })
    this.cursors2 = this.makeControls({ left:'LEFT', right:'RIGHT', up:'UP', down:'DOWN', light:'NUMPAD_ONE', heavy:'NUMPAD_TWO', block:'NUMPAD_THREE' })

    // modo
    if(this.mode==='local'){
      p1.owner = true
    } else {
      const net = NetClient.get()
      const ownerIsP1 = net.isFirstClient
      p1.owner = ownerIsP1
      p2.owner = !ownerIsP1
      net.onState((s)=>{
        const mine = p1.owner ? p1 : p2
        const other = p1.owner ? p2 : p1
        if(s.mine) mine.fromNet(s.mine)
        if(s.other) other.fromNet(s.other)
        this.round = s.round; this.p1Wins = s.p1Wins; this.p2Wins = s.p2Wins; this.roundTimer = s.roundTimer
      })
    }

    // UI Scene
    this.scene.run('UIScene', { gameRef: this })

    // pausa
    this.input.keyboard!.on('keydown-ESC', ()=>{ this.paused = !this.paused })
  }

  update(){
    if(this.paused) return

    const [p1, p2] = this.fighters

    if(this.mode==='local'){
      p1.applyInput(this.cursors1)
      const p2Human = true
      if(p2Human) p2.applyInput(this.cursors2)
      else this.simpleAI(p2, p1)
    } else {
      const owner = p1.owner ? p1 : p2
      owner.applyInput(this.cursors1)
      this.sendNet(owner)
    }

    // câmera acompanha o meio dos dois
    const midX = (p1.x + p2.x)/2
    this.cameras.main.setLerp(0.08, 0.08)
    this.cameras.main.pan(midX, this.cameras.main.midPoint.y, 50)

    // lógica de round
    if(this.roundTimer>0) this.roundTimer--
    if(this.roundTimer===0 || p1.hp<=0 || p2.hp<=0){
      const winner = p1.hp===p2.hp ? 0 : (p1.hp>p2.hp ? 1 : 2)
      if(winner===1) this.p1Wins++; else if(winner===2) this.p2Wins++
      if(this.p1Wins===2 || this.p2Wins===2){
        this.scene.start('Menu')
      } else {
        this.newRound()
      }
    }
  }

  sendNet(owner:Fighter){
    const net = NetClient.get()
    net.sendState(owner.toNet())
  }

  newRound(){
    const { width, height } = this.scale
    this.round++
    this.roundTimer = 99*60
    this.fighters.forEach((f,i)=>{
      f.hp = 100
      f.setVelocity(0)
      f.x = i===0? width*0.35 : width*0.65
      f.y = height-120
      f.specialMeter = 0
      f.state = 'idle'
      f.block = false
      f.setCrouch(false)
    })
  }

  makeControls(keys:{left:string,right:string,up:string,down:string,light:string,heavy:string,block:string}){
    const input = this.input.keyboard!
    return {
      left: input.addKey(keys.left),
      right: input.addKey(keys.right),
      up: input.addKey(keys.up),
      down: input.addKey(keys.down),
      light: input.addKey(keys.light),
      heavy: input.addKey(keys.heavy),
      block: input.addKey(keys.block)
    }
  }

  simpleAI(me:Fighter, foe:Fighter){
    const dist = foe.x - me.x
    const dir = Math.sign(dist)
    me.setVelocityX(200*dir) // um pouco mais suave
    const body = me.body as Phaser.Physics.Arcade.Body | null
    if(Math.abs(dist)<80 && body?.blocked.down){
      me.attack(false)
    }
  }
}
