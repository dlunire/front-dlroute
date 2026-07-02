import { defineConfig } from 'vite';
import path from 'path';
export default defineConfig({
    resolve: {
        alias: {
            // Ajusta la ruta relativa para que apunte al index.ts de tu enrutador en desarrollo
            '@dlunire/front-dlroute': path.resolve(__dirname, '../front-dlroute/index.ts')
        }
    }
});
