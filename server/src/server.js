const { createApp } = require('./app');
const { env } = require('./config/env');

const app = createApp();

app.listen(env.port, () => {
  console.log(`Blizz server started on http://localhost:${env.port}`);
});
