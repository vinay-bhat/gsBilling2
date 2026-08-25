const os = require('os');

// Metro 0.81 calls os.availableParallelism() (Node 18.14+).
// Fallback for older Node if Metro is started outside nvm (IDE, stale process, etc.).
if (typeof os.availableParallelism !== 'function') {
  os.availableParallelism = () => os.cpus().length;
}
