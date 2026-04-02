module.exports = {
  apps: [
    {
      name: 'dms-backend',
      cwd: __dirname,
      script: 'src/index.js',
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      max_restarts: 10,
      time: true,
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};

