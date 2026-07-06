module.exports = {
  apps: [
    {
      name: "autoadz",
      script: "server.js",
      instances: "max",
      exec_mode: "cluster",
      max_memory_restart: "400M",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      error_file: "logs/err.log",
      out_file: "logs/out.log",
      merge_logs: true,
      restart_delay: 3000,
      max_restarts: 10,
    },
  ],
};
