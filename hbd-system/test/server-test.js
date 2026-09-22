const { app, startServer } = require('../server/server.js');

async function run() {
  console.log('Testing server initialization...');
  const server = await startServer();
  console.log('Server started successfully on port', server.address().port);
  server.close(() => {
    console.log('Server closed gracefully.');
    process.exit(0);
  });
}

run().catch(err => {
  console.error('Boot test failed:', err);
  process.exit(1);
});
