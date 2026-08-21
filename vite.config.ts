import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // host: true expõe o dev server na rede local (acesso de outras máquinas)
  server: { host: true, port: 5173 },
})
