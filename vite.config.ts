import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      // Cuando veas el import del paquete, lee directamente el archivo fuente TS
      '@dlunire/front-dlroute': path.resolve(__dirname, '../parsing/index.ts') 
    }
  }
})