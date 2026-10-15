import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { devSave } from './tools/vite-dev-save.ts'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), devSave(import.meta.dirname)],
  // host: true expõe o dev server na rede local (acesso de outras máquinas)
  server: { host: true, port: 5173 },
})
