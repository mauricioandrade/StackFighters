import Phaser from 'phaser'

type Dir = -1 | 1

export type FighterState =
  | 'idle'
  | 'run'
  | 'jump'
  | 'fall'
  | 'dash'
  | 'crouch'
  | 'attackL'
  | 'attackH'
  | 'special'
  | 'block'
  | 'hit'
  | 'ko'

export type FighterNetState = {
  id: string
  x: number
  y: number
  vx: number
  vy: number
  facing: Dir
  hp: number
  state: FighterState
  special: number
  skin: string
}

export default class Fighter extends Phaser.Physics.Arcade.Sprite {
  id: string
  facing: Dir = 1
  hp = 100
  state: FighterState = 'idle'
  canDouble = true
  hitstop = 0
  block = false
  stunned = 0
  owner = false
  skinKey: string
  attackCooldown = 0
  dashTimer = 0
  dashDir: Dir = 1
  specialMeter = 0
  crouching = false
  lastTapDir: Dir | 0 = 0
  lastTapTime = 0
  baseBody = { width: 28, height: 88, offsetX: 0, offsetY: 0 }

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
    const body = this.body as Phaser.Physics.Arcade.Body
    const baseWidth = 28
    const baseHeight = 88
    const baseOffsetX = Math.max(0, (this.width / scale - baseWidth) / 2)
    const baseOffsetY = Math.max(0, (this.height / scale - baseHeight) / 2)
    body.setSize(baseWidth, baseHeight) // largura x altura
    body.setOffset(baseOffsetX, baseOffsetY)
    this.baseBody = { width: baseWidth, height: baseHeight, offsetX: baseOffsetX, offsetY: baseOffsetY }
  }

  applyInput(cursors: any){
    if(this.hitstop>0 || this.stunned>0) return
    if(this.dashTimer>0) return

    const body = this.body as Phaser.Physics.Arcade.Body
    const speed = 340
    const jumpV = -680
    const grounded = body.blocked.down
    const now = this.scene.time.now

    if(Phaser.Input.Keyboard.JustDown(cursors.left)) this.registerDashTap(-1 as Dir, now)
    if(Phaser.Input.Keyboard.JustDown(cursors.right)) this.registerDashTap(1 as Dir, now)

    this.block = cursors.block.isDown && grounded
    const wantsCrouch = cursors.down.isDown && grounded && !this.block
    this.setCrouch(wantsCrouch)

    if(!this.block){
      if(!this.crouching){
        if(cursors.left.isDown){ this.setVelocityX(-speed); this.facing = -1 as Dir }
        else if(cursors.right.isDown){ this.setVelocityX(speed); this.facing = 1 as Dir }
        else if(grounded){ this.setVelocityX(0) }
      } else {
        this.setVelocityX(0)
      }
    } else {
      this.setVelocityX(0)
    }

    if(Phaser.Input.Keyboard.JustDown(cursors.up)){
      if(grounded){ this.setVelocityY(jumpV); this.canDouble = true }
      else if(this.canDouble){ this.setVelocityY(jumpV*0.95); this.canDouble = false }
    }

    const allowSpecial = cursors.down.isDown
    if(Phaser.Input.Keyboard.JustDown(cursors.light)) this.attack(false)
    if(Phaser.Input.Keyboard.JustDown(cursors.heavy)) this.attack(true, allowSpecial)
  }

  attack(heavy:boolean, allowSpecial = false){
    if(this.stunned>0 || this.block || this.attackCooldown>0) return false
    if(allowSpecial && heavy && this.performSpecial()) return true
    const range = heavy ? 58 : 46
    const dmg   = heavy ? 20 : 12
    const kb    = heavy ? 460 : 320
    const rectW = Math.abs(range)
    const rectH = 36
    this.state = heavy ? 'attackH' : 'attackL'
    this.attackCooldown = heavy ? 24 : 16

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
        this.gainSpecial(10)
      }
    })
    return true
  }

  takeHit(dmg:number, kbX:number){
    if(this.block){ dmg = Math.floor(dmg*0.3) }
    this.hp = Math.max(0, this.hp - dmg)
    this.setVelocityX(kbX)
    this.setVelocityY(-160)
    this.stunned = 16
    this.state = 'hit'
    this.block = false
    this.gainSpecial(6)
    this.setTintFill(0xffffff)
    this.scene.time.delayedCall(60, ()=> this.clearTint())
  }

  performSpecial(){
    if(!this.spendSpecial(50)) return false
    const rect = this.scene.add.rectangle(
      this.x + this.facing * (this.displayWidth * 0.4),
      this.getCenter().y - this.displayHeight * 0.2,
      46,
      20,
      0x74d2ff,
      0.9
    )
    this.scene.physics.add.existing(rect)
    const body = rect.body as Phaser.Physics.Arcade.Body
    body.allowGravity = false
    body.setVelocityX(720 * this.facing)
    body.setSize(rect.width, rect.height)
    body.setOffset(-rect.width/2, -rect.height/2)
    const overlaps: Phaser.Physics.Arcade.Collider[] = []
    const foes = (this.scene as any).fighters as Fighter[]
    foes.filter(f=>f!==this).forEach(fo=>{
      const collider = this.scene.physics.add.overlap(rect, fo, ()=>{
        if(!rect.active) return
        fo.takeHit(28, 540*this.facing)
        ;(this.scene as any).hitFlash?.(fo)
        this.gainSpecial(12)
        rect.destroy()
      })
      overlaps.push(collider)
    })
    rect.once('destroy', ()=> overlaps.forEach(o=>o.destroy()))
    this.scene.time.delayedCall(500, ()=> rect.destroy())
    this.state = 'special'
    this.attackCooldown = 36
    this.hitstop = 8
    return true
  }

  gainSpecial(amount:number){
    this.specialMeter = Math.min(100, this.specialMeter + amount)
  }

  spendSpecial(amount:number){
    if(this.specialMeter < amount) return false
    this.specialMeter -= amount
    return true
  }

  registerDashTap(dir:Dir, time:number){
    if((this.scene as any).paused) return
    if(this.lastTapDir === dir && time - this.lastTapTime < 250 && (this.body as Phaser.Physics.Arcade.Body).blocked.down){
      this.startDash(dir)
    }
    this.lastTapDir = dir
    this.lastTapTime = time
  }

  startDash(dir:Dir){
    this.dashDir = dir
    this.facing = dir
    this.dashTimer = 14
    this.state = 'dash'
    this.attackCooldown = Math.max(this.attackCooldown, 10)
  }

  setCrouch(active:boolean){
    if(this.crouching === active) return
    this.crouching = active
    const body = this.body as Phaser.Physics.Arcade.Body
    if(active){
      body.setSize(this.baseBody.width, this.baseBody.height * 0.7)
      body.setOffset(this.baseBody.offsetX, this.baseBody.offsetY + this.baseBody.height * 0.3)
    } else {
      body.setSize(this.baseBody.width, this.baseBody.height)
      body.setOffset(this.baseBody.offsetX, this.baseBody.offsetY)
    }
  }

  preUpdate(time:number, delta:number){
    super.preUpdate(time, delta)
    if(this.hitstop>0) this.hitstop = Math.max(0, this.hitstop-1)
    if(this.stunned>0) this.stunned = Math.max(0, this.stunned-1)
    if(this.attackCooldown>0) this.attackCooldown = Math.max(0, this.attackCooldown-1)
    const body = this.body as Phaser.Physics.Arcade.Body
    if(this.dashTimer>0){
      this.dashTimer = Math.max(0, this.dashTimer-1)
      this.setVelocityX(520 * this.dashDir)
    }
    if(!body.blocked.down){
      this.setCrouch(false)
    }
    if(body.blocked.down){
      this.canDouble = true
    }
    if(this.specialMeter < 100){
      this.specialMeter = Math.min(100, this.specialMeter + delta * 0.01)
    }
    this.updateState()
  }

  updateState(){
    if(this.hp<=0){ this.state = 'ko'; return }
    if(this.hitstop>0) return
    if(this.stunned>0){ this.state = 'hit'; return }
    if(this.attackCooldown>0 && ['attackL','attackH','special'].includes(this.state)) return
    if(this.block){ this.state = 'block'; return }
    if(this.crouching){ this.state = 'crouch'; return }
    const body = this.body as Phaser.Physics.Arcade.Body
    if(!body.blocked.down){
      this.state = body.velocity.y < 0 ? 'jump' : 'fall'
      return
    }
    if(this.dashTimer>0){ this.state = 'dash'; return }
    if(Math.abs(body.velocity.x) > 40){ this.state = 'run'; return }
    this.state = 'idle'
  }

  toNet(): FighterNetState {
    return {
      id:this.id,
      x:this.x, y:this.y,
      vx:(this.body as any).velocity.x, vy:(this.body as any).velocity.y,
      facing:this.facing, hp:this.hp, state:this.state, special:this.specialMeter, skin:this.skinKey
    }
  }

  fromNet(s:FighterNetState){
    this.x = s.x; this.y = s.y; this.facing = s.facing; this.hp = s.hp
    ;(this.body as Phaser.Physics.Arcade.Body).setVelocity(s.vx, s.vy)
    this.state = s.state
    this.specialMeter = s.special ?? this.specialMeter
    if(s.skin && s.skin!==this.skinKey){ this.setTexture(s.skin); this.skinKey = s.skin }
  }
}
