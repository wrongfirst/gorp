import http from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import url from "node:url";
import zlib from "node:zlib";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, "dist");

function parseArgs(argv) {
  let port = parseInt(process.env.PORT || "8080", 10);
  let host = process.env.HOST || undefined;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--port" && argv[i + 1]) {
      const parsed = parseInt(argv[i + 1], 10);
      if (Number.isFinite(parsed) && parsed > 0) port = parsed;
      i++;
    } else if (arg.startsWith("--port=")) {
      const parsed = parseInt(arg.slice("--port=".length), 10);
      if (Number.isFinite(parsed) && parsed > 0) port = parsed;
    } else if (arg === "--host") {
      const next = argv[i + 1];
      if (next && !next.startsWith("-")) {
        host = next;
        i++;
      } else {
        host = "0.0.0.0";
      }
    } else if (arg.startsWith("--host=")) {
      host = arg.slice("--host=".length) || "0.0.0.0";
    }
  }

  return { port, host };
}

function isTailscaleIpv4(address) {
  const parts = address.split(".").map(Number);
  return parts.length === 4 && parts[0] === 100 && parts[1] >= 64 && parts[1] <= 127;
}

function getTailscaleAddresses() {
  const results = [];
  const seen = new Set();
  for (const [name, entries] of Object.entries(os.networkInterfaces())) {
    if (!entries) continue;
    for (const entry of entries) {
      if (entry.internal || entry.family !== "IPv4") continue;
      if (name.toLowerCase().startsWith("tailscale") || isTailscaleIpv4(entry.address)) {
        if (!seen.has(entry.address)) {
          seen.add(entry.address);
          results.push({ name, address: entry.address });
        }
      }
    }
  }
  return results;
}

function getNetworkIpv4Addresses() {
  const results = [];
  for (const [name, entries] of Object.entries(os.networkInterfaces())) {
    if (!entries) continue;
    for (const entry of entries) {
      if (entry.internal || entry.family !== "IPv4") continue;
      results.push({ name, address: entry.address });
    }
  }
  return results;
}

const { port, host } = parseArgs(process.argv.slice(2));

const mimeTypes = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "application/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".wav": "audio/wav",
  ".mp4": "video/mp4",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".eot": "application/vnd.ms-fontobject",
  ".otf": "font/otf",
  ".wasm": "application/wasm",
  ".ico": "image/x-icon",
  ".webp": "image/webp",
  ".webmanifest": "application/manifest+json",
};

const securityHeaders = {
  "Content-Security-Policy": "default-src 'self'; script-src 'self' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net; font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net; img-src 'self' data: https:; connect-src 'self' https: http:; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'none'; frame-ancestors 'none';",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
};

const compressibleExts = new Set([
  ".html",
  ".css",
  ".js",
  ".json",
  ".svg",
  ".wasm",
  ".webmanifest",
]);

const COMPRESS_MIN_BYTES = 1024;
const compressedCache = new Map();

function pickEncoding(req, ext, byteLength) {
  if (byteLength < COMPRESS_MIN_BYTES || !compressibleExts.has(ext)) {
    return null;
  }
  const accept = String(req.headers["accept-encoding"] || "");
  if (/\bbr\b/i.test(accept)) return "br";
  if (/\bgzip\b/i.test(accept)) return "gzip";
  return null;
}

function compressBuffer(fullPath, mtimeMs, encoding, data, callback) {
  const cacheKey = `${fullPath}:${encoding}`;
  const cached = compressedCache.get(cacheKey);
  if (cached && cached.mtimeMs === mtimeMs) {
    callback(null, cached.buffer);
    return;
  }

  const onDone = (err, buffer) => {
    if (err) {
      callback(err);
      return;
    }
    compressedCache.set(cacheKey, { mtimeMs, buffer });
    callback(null, buffer);
  };

  if (encoding === "br") {
    zlib.brotliCompress(
      data,
      { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 4 } },
      onDone
    );
  } else {
    zlib.gzip(data, { level: 6 }, onDone);
  }
}

function getCacheControl(filePath, ext) {
  if (filePath.startsWith("/assets/")) {
    return "public, max-age=31536000, immutable";
  }
  if (ext === ".html") {
    return "no-cache";
  }
  return "public, max-age=86400";
}

function handleRequest(req, res) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405, { Allow: "GET, HEAD", ...securityHeaders });
    res.end("Method Not Allowed");
    return;
  }

  // Remove query string before resolving default document
  let filePath = (req.url || "/").split("?")[0];
  if (filePath === "/") {
    filePath = "/index.html";
  }

  const ext = path.extname(filePath);
  const contentType = mimeTypes[ext] || "application/octet-stream";

  const fullPath = path.resolve(distDir, `.${filePath}`);

  // Prevent directory traversal
  if (fullPath !== distDir && !fullPath.startsWith(distDir + path.sep)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.stat(fullPath, (statErr, stat) => {
    if (statErr || !stat.isFile()) {
      res.writeHead(404);
      res.end("Not Found");
      return;
    }

    const etag = `W/"${stat.size.toString(16)}-${Math.trunc(stat.mtimeMs).toString(16)}"`;
    const cacheControl = getCacheControl(filePath, ext);
    const isCompressible = compressibleExts.has(ext);
    const baseHeaders = {
      "Content-Type": contentType,
      "Cache-Control": cacheControl,
      ETag: etag,
      ...(isCompressible ? { Vary: "Accept-Encoding" } : {}),
      ...securityHeaders,
    };

    if (req.headers["if-none-match"] === etag) {
      res.writeHead(304, baseHeaders);
      res.end();
      return;
    }

    fs.readFile(fullPath, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end("Not Found");
        return;
      }

      const encoding = pickEncoding(req, ext, data.length);
      if (!encoding) {
        res.writeHead(200, {
          ...baseHeaders,
          "Content-Length": data.length,
        });
        res.end(req.method === "HEAD" ? undefined : data);
        return;
      }

      compressBuffer(fullPath, stat.mtimeMs, encoding, data, (compErr, compressed) => {
        if (compErr) {
          res.writeHead(200, {
            ...baseHeaders,
            "Content-Length": data.length,
          });
          res.end(req.method === "HEAD" ? undefined : data);
          return;
        }

        res.writeHead(200, {
          ...baseHeaders,
          "Content-Encoding": encoding,
          "Content-Length": compressed.length,
        });
        res.end(req.method === "HEAD" ? undefined : compressed);
      });
    });
  });
}

function listenOn(bindHost) {
  return new Promise((resolve, reject) => {
    const server = http.createServer(handleRequest);
    server.once("error", reject);
    server.listen(port, bindHost, () => {
      server.removeListener("error", reject);
      resolve(server);
    });
  });
}

async function main() {
  const servers = [];

  if (host) {
    servers.push(await listenOn(host));
    console.log(`Serving files from ${distDir}`);
    if (host === "0.0.0.0" || host === "::") {
      console.log(`  Local:   http://localhost:${port}`);
      for (const iface of getNetworkIpv4Addresses()) {
        console.log(`  Network: http://${iface.address}:${port}  (${iface.name})`);
      }
    } else {
      console.log(`  Server:  http://${host}:${port}`);
    }
  } else {
    servers.push(await listenOn("127.0.0.1"));
    try {
      servers.push(await listenOn("::1"));
    } catch {
      // IPv6 loopback may be unavailable
    }

    const boundTailscale = [];
    for (const iface of getTailscaleAddresses()) {
      try {
        servers.push(await listenOn(iface.address));
        boundTailscale.push(iface);
      } catch (err) {
        console.warn(`[serve] Could not bind Tailscale interface ${iface.name} (${iface.address}): ${err.message}`);
      }
    }

    console.log(`Serving files from ${distDir}`);
    console.log(`  Local:     http://localhost:${port}`);
    for (const iface of boundTailscale) {
      console.log(`  Tailscale: http://${iface.address}:${port}  (${iface.name})`);
    }
  }

  const shutdown = () => {
    for (const s of servers) s.close();
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err) => {
  console.error(`[serve] Failed to start server: ${err.message}`);
  process.exit(1);
});
