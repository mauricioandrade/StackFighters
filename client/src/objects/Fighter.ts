import Phaser from 'phaser'

type Dir = -1 | 1

export type FighterNetState = {
  id: string
  x: number
  y: number
  vx: number
  vy: number
  facing: Dir
  hp: number
  state: 'idle'|'run'|'jump'|'fall'|'attackL'|'attackH'|'block'|'hit'|'ko'
  skin: string
}

export default class Fighter extends Phaser.Physics.Arcade.Sprite {
  id: string
  facing: Dir = 1
  hp = 100
  canDouble = true
  hitstop = 0
  block = false
  stunned = 0
  owner = false
  skinKey: string

  constructor(scene: Phaser.Scene, x:number, y:number, id:string, skinKey:string){
    super(scene, x, y, skinKey)
    this.id = id
    this.skinKey = skinKey

    scene.add.existing(this)
    scene.physics.add.existing(this)

    // --- Tamanho padrão (~120px de altura na tela)
    const targetHeight = 120
    const tex = scene.textures.get(skinKey)
    // @ts-ignore
    const srcImg = tex.getSourceImage() as HTMLImageElement
    const srcH = srcImg?.naturalHeight || srcImg?.height || 120
    const scale = targetHeight / srcH
    this.setScale(scale)

    // --- Física / movimento
    this.setCollideWorldBounds(true)
    this.setDrag(1400, 0)
    this.setMaxVelocity(520, 1600)
    this.setBounce(0)

    // --- Corpo Arcade (tamanho não escala automaticamente)
    this.body.setSize(28, 88) // largura x altura
    this.body.setOffset(
      Math.max(0, (this.width / scale - 28) / 2),
      Math.max(0, (this.height / scale - 88) / 2)
    )
  }

  applyInput(cursors: any){
    if(this.hitstop>0){ this.hitstop--; return }
    if(this.stunned>0){ this.stunned--; return }

    const speed = 340
    const jumpV = -680

    if(!this.block){
      if(cursors.left.isDown){ this.setVelocityX(-speed); this.facing = -1 as Dir }
      else if(cursors.right.isDown){ this.setVelocityX(speed); this.facing = 1 as Dir }
      else if(this.body.blocked.down){ this.setVelocityX(0) }
    } else {
      this.setVelocityX(0)
    }

    if(Phaser.Input.Keyboard.JustDown(cursors.up)){
      if(this.body.blocked.down){ this.setVelocityY(jumpV); this.canDouble = true }
      else if(this.canDouble){ this.setVelocityY(jumpV*0.95); this.canDouble = false }
    }

    this.block = cursors.block.isDown && this.body.blocked.down

    if(Phaser.Input.Keyboard.JustDown(cursors.light)) this.attack(false)
    if(Phaser.Input.Keyboard.JustDown(cursors.heavy)) this.attack(true)
  }

  attack(heavy:boolean){
    if(this.stunned>0 || this.block) return
    const range = heavy ? 58 : 46
    const dmg   = heavy ? 20 : 12
    const kb    = heavy ? 460 : 320
    const rectW = Math.abs(range)
    const rectH = 36

    // Hitbox à frente do lutador, um pouco acima do centro
    const xOffset = (this.displayWidth*0.25 + rectW/2) * this.facing
    const hitbox = new Phaser.Geom.Rectangle(
      this.x + xOffset - rectW/2,
      this.getBottomCenter().y - this.displayHeight*0.65,
      rectW,
      rectH
    )

    const foes = (this.scene as any).fighters as Fighter[]
    foes.filter(f=>f!==this).forEach(fo=>{
      if(Phaser.Geom.Rectangle.Overlaps(hitbox, fo.getBounds())){
        fo.takeHit(dmg, kb*this.facing as number)
        ;(this.scene as any).hitFlash?.(fo)
        this.hitstop = 5
      }
    })
  }

  takeHit(dmg:number, kbX:number){
    if(this.block){ dmg = Math.floor(dmg*0.3) }
    this.hp = Math.max(0, this.hp - dmg)
    this.setVelocityX(kbX)
    this.setVelocityY(-160)
    this.stunned = 16
    this.setTintFill(0xffffff)
    this.scene.time.delayedCall(60, ()=> this.clearTint())
  }

  toNet(): FighterNetState {
    return {
      id:this.id,
      x:this.x, y:this.y,
      vx:(this.body as any).velocity.x, vy:(this.body as any).velocity.y,
      facing:this.facing, hp:this.hp, state:'idle', skin:this.skinKey
    }
  }

  fromNet(s:FighterNetState){
    this.x = s.x; this.y = s.y; this.facing = s.facing; this.hp = s.hp
    if(s.skin && s.skin!==this.skinKey){ this.setTexture(s.skin); this.skinKey = s.skin }
  }
}
