import { createApp } from './app';
import { config } from './config';

const app = createApp();

app.listen(config.port, '0.0.0.0', () => {
  console.log(`Server listening on port ${config.port}`);
});
