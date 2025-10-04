import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
  server: { host: true, port: 5173 },
  resolve: {
    alias: {
      '@scenes': path.resolve(__dirname, 'src/scenes'),
      '@objects': path.resolve(__dirname, 'src/objects'),
      '@net': path.resolve(__dirname, 'src/net'),
    }
  }
})
