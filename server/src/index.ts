import express from 'express'
import { Server } from 'colyseus'
import { createServer } from 'http'
import { FightRoom } from './rooms/FightRoom'

const app = express()
app.get('/', (_req,res)=>res.send('Stack Fighters Server OK'))

const httpServer = createServer(app)
const gameServer = new Server({ server: httpServer })

gameServer.define('fight_room', FightRoom)

const PORT = Number(process.env.PORT) || 2567
httpServer.listen(PORT, ()=> console.log('Colyseus on', PORT))
