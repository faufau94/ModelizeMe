#!/usr/bin/env node

import { WebSocketServer } from 'ws'
import { setupWSConnection } from '@y/websocket-server/utils'

const host = process.env.HOST || 'localhost'
const port = process.env.PORT || 1234

const wss = new WebSocketServer({ host, port })

wss.on('connection', setupWSConnection)

console.log(`WebSocket server running on ws://${host}:${port}`)

process.on('SIGINT', () => {
  console.log('Received SIGINT. Shutting down WebSocket server...')
  wss.close(() => {
    console.log('WebSocket server closed')
    process.exit(0)
  })
})
