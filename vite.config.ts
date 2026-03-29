import { defineConfig } from 'vite-plus'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  lint: {"options":{"typeAware":true,"typeCheck":true}},
  base: "/allergen-checker/",
    plugins: [react(), tailwindcss()],
})
