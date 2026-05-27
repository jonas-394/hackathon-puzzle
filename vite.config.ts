import { defineConfig } from 'vite';

export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/hackathon-puzzle/' : '/',
  build: {
    target: 'es2020',
  },
}));
