const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');

let SERVER_REF = null;

const parseArgs = () => {
  const args = process.argv.slice(2);
  const out = {};
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (!a.startsWith('--')) continue;
    const key = a.slice(2);
    const next = args[i + 1];
    if (next && !next.startsWith('--')) {
      out[key] = next;
      i++;
    } else {
      out[key] = true;
    }
  }
  return out;
};

const nowMs = () => Date.now();

const getLocalIp = () => {
  const ifaces = os.networkInterfaces();
  for (const name of Object.keys(ifaces)) {
    for (const iface of ifaces[name] || []) {
      if (iface && iface.family === 'IPv4' && !iface.internal) return iface.address;
    }
  }
  return '127.0.0.1';
};

const writeEnvFile = (outdirAbs, sessionId, apiUrl) => {
  const envPath = path.join(outdirAbs, `${sessionId}.env`);
  fs.writeFileSync(envPath, `DEBUG_SERVER_URL=${apiUrl}\nDEBUG_SESSION_ID=${sessionId}\n`, 'utf8');
  return envPath;
};

const main = () => {
  const args = parseArgs();
  const sessionId = String(args.session || '').trim();
  if (!sessionId) {
    process.stderr.write('Missing required --session\n');
    process.exit(2);
  }

  const outdir = String(args.outdir || '.dbg');
  const outdirAbs = path.resolve(process.cwd(), outdir);
  fs.mkdirSync(outdirAbs, { recursive: true });

  const clean = !!args.clean;
  const idleSec = Number.parseInt(String(args.idle || '0'), 10) || 0;
  const isRemote = !!args.remote;
  const host = isRemote ? '0.0.0.0' : '127.0.0.1';
  const hostForClient = isRemote ? getLocalIp() : '127.0.0.1';

  let portBase = Number.parseInt(String(args.port || '7777'), 10);
  if (!Number.isFinite(portBase) || portBase <= 0) portBase = 7777;

  const logFile = path.join(outdirAbs, `trae-debug-log-${sessionId}.ndjson`);
  if (clean && fs.existsSync(logFile)) fs.writeFileSync(logFile, '', 'utf8');

  let lastEventAt = nowMs();
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  const handler = (req, res) => {
    if (req.url !== '/event') {
      res.statusCode = 404;
      res.end('not found');
      return;
    }

    if (req.method === 'OPTIONS') {
      res.writeHead(204, corsHeaders);
      res.end();
      return;
    }

    if (req.method !== 'POST') {
      res.writeHead(405, corsHeaders);
      res.end('method not allowed');
      return;
    }

    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1024 * 1024) req.destroy();
    });
    req.on('end', () => {
      try {
        const event = JSON.parse(body || '{}');
        event.sessionId = event.sessionId || sessionId;
        if (!event.ts) event.ts = nowMs();
        if (!event.runId) event.runId = 'pre-fix';
        if (!event.hypothesisId) event.hypothesisId = 'NA';
        if (!event.msg) event.msg = 'event';

        fs.appendFileSync(logFile, JSON.stringify(event) + '\n', 'utf8');
        lastEventAt = nowMs();

        res.writeHead(200, { ...corsHeaders, 'Content-Type': 'text/plain' });
        res.end('ok');
      } catch (_) {
        res.writeHead(400, { ...corsHeaders, 'Content-Type': 'text/plain' });
        res.end('bad request');
      }
    });
  };

  const tryListen = (port, attempt) => {
    const server = http.createServer(handler);
    server.on('error', (err) => {
      if (err && err.code === 'EADDRINUSE' && attempt < 10) {
        tryListen(port + 1, attempt + 1);
        return;
      }
      process.stderr.write(String(err && err.stack ? err.stack : err) + '\n');
      process.exit(1);
    });

    server.listen(port, host, () => {
      SERVER_REF = server;
      const actualPort = server.address().port;
      const apiUrl = `http://${hostForClient}:${actualPort}/event`;
      const envFile = writeEnvFile(outdirAbs, sessionId, apiUrl);

      const info = {
        api_url: apiUrl,
        session_id: sessionId,
        log_dir: outdirAbs,
        log_file: logFile,
        env_file: envFile,
      };

      process.stdout.write('@@DEBUG_SERVER_INFO\n');
      process.stdout.write(JSON.stringify(info, null, 2) + '\n');
      process.stdout.write('@@END_DEBUG_SERVER_INFO\n');

      process.stdin.resume();

      if (idleSec > 0) {
        setInterval(() => {
          const idleMs = nowMs() - lastEventAt;
          if (idleMs >= idleSec * 1000) process.exit(0);
        }, 1000);
      }
    });
  };

  tryListen(portBase, 0);
};

main();

