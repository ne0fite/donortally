import { Config } from '@stencil/core';
import { postcss } from '@stencil-community/postcss';
import autoprefixer from 'autoprefixer';
import tailwindcss from 'tailwindcss';

export const config: Config = {
  namespace: 'donor-tally',
  globalStyle: 'src/global/app.css',
  outputTargets: [
    {
      type: 'www',
      serviceWorker: null,
      baseUrl: '/',
    },
  ],
  plugins: [
    postcss({
      plugins: [tailwindcss(), autoprefixer()],
    }),
  ],
  devServer: {
    port: 3333,
  },
};
