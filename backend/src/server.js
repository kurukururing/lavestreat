import { env } from './config/env.js';
import { createApp } from './app.js';

const app = createApp({ distDir: env.FRONTEND_DIST_DIR, trustProxyHops: env.TRUST_PROXY_HOPS });

app.listen(env.PORT, () => {
  console.log(`Express berjalan di port ${env.PORT}`);
});
