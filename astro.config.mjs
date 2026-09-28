import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';
import vercel from '@astrojs/vercel';

export default defineConfig({
  integrations: [tailwind(), react()],
  adapter: vercel(),
  server: {
    host: '0.0.0.0',
    port: 4321,
  },
});
