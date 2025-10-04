import { Client, Room } from 'colyseus.js'

class NetClient{
  private static _i: NetClient
  client!: Client
  room!: Room
  isFirstClient = false

  static get(){
    if(!this._i) this._i = new NetClient()
    return this._i
  }

  async connect(){
    if(this.client) return
    this.client = new Client(`ws://${location.hostname}:2567`)
  }

  async joinOrCreate(roomName:string){
    this.room = await this.client.joinOrCreate(roomName)
    this.isFirstClient = this.room.sessionId === (this.room.state as any).firstId
  }

  onState(cb:(s:any)=>void){
    this.room.onMessage('state', (s)=> cb(s))
  }

  sendState(mine:any){
    this.room.send('input', { mine })
  }
}

export default NetClient
