import tailwindcss from '@tailwindcss/vite'; // <-- Importação do plugin v4
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';


// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
})
