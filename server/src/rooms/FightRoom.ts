import { Room, Client } from 'colyseus'

export class FightRoom extends Room {
  firstId: string|null = null
  stateObj: any = { firstId: null, p1Wins:0, p2Wins:0, round:1, roundTimer: 99*60, mine:null, other:null }

  onCreate(){
    this.setState({})
    this.onMessage('input', (client, message: any)=>{
      const isFirst = client.id === this.firstId
      if(isFirst){ this.stateObj.mine = message.mine }
      else       { this.stateObj.other = message.mine }

      this.broadcast('state', {
        firstId: this.firstId,
        p1Wins: this.stateObj.p1Wins,
        p2Wins: this.stateObj.p2Wins,
        round: this.stateObj.round,
        roundTimer: this.stateObj.roundTimer,
        mine: isFirst ? this.stateObj.mine : this.stateObj.other,
        other: isFirst ? this.stateObj.other : this.stateObj.mine,
      })
    })
  }

  onJoin(client: Client){
    if(!this.firstId) this.firstId = client.id
    this.stateObj.firstId = this.firstId
    client.send('state', { ...this.stateObj })
  }

  onLeave(client: Client){
    if(client.id === this.firstId) this.firstId = null
  }
}
