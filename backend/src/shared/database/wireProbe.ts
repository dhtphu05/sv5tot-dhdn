/**
 * 5TOT ĐHĐN — Native PostgreSQL Wire Protocol Probe
 * Implements standard PostgreSQL v3 frontend/backend SSL and SCRAM-SHA-256 handshake
 * to verify live PostgreSQL connectivity without external library dependencies.
 */

import net from 'node:net';
import tls from 'node:tls';
import crypto from 'node:crypto';

export interface WireProbeResult {
  connected: boolean;
  latencyMs?: number;
  serverVersion?: string;
  database?: string;
  error?: string;
}

function parseScramAttributes(msg: string): Record<string, string> {
  const parts = msg.split(',');
  const map: Record<string, string> = {};
  for (const part of parts) {
    const eq = part.indexOf('=');
    if (eq > 0) {
      map[part.slice(0, eq)] = part.slice(eq + 1);
    }
  }
  return map;
}

function xorBuffers(a: Buffer, b: Buffer): Buffer {
  const len = Math.min(a.length, b.length);
  const out = Buffer.alloc(len);
  for (let i = 0; i < len; i++) out[i] = a[i] ^ b[i];
  return out;
}

function hmacSha256(key: Buffer | string, data: string): Buffer {
  return crypto.createHmac('sha256', key).update(data).digest();
}

function sha256Hash(data: Buffer): Buffer {
  return crypto.createHash('sha256').update(data).digest();
}

export async function probePostgresConnection(
  databaseUrl: string,
  timeoutMs = 5000
): Promise<WireProbeResult> {
  const start = Date.now();

  return new Promise((resolve) => {
    let timer: NodeJS.Timeout | null = null;
    let finished = false;

    const cleanup = () => {
      if (timer) clearTimeout(timer);
      finished = true;
    };

    timer = setTimeout(() => {
      if (!finished) {
        cleanup();
        resolve({
          connected: false,
          error: `Kết nối đến PostgreSQL vượt quá thời gian chờ (${timeoutMs}ms).`,
        });
      }
    }, timeoutMs);

    try {
      const parsedUrl = new URL(databaseUrl);
      const host = parsedUrl.hostname;
      const port = parseInt(parsedUrl.port || '5432', 10);
      const user = parsedUrl.username;
      const password = parsedUrl.password;
      const database = parsedUrl.pathname ? parsedUrl.pathname.slice(1) : 'postgres';

      const clientNonce = crypto.randomBytes(18).toString('base64');
      const clientFirstBare = 'n=,r=' + clientNonce;
      const clientFirstMessage = 'n,,' + clientFirstBare;

      const rawSocket = net.createConnection({ host, port, timeout: timeoutMs }, () => {
        // SSLRequest: Int32(8), Int32(80877103)
        const sslBuf = Buffer.alloc(8);
        sslBuf.writeInt32BE(8, 0);
        sslBuf.writeInt32BE(80877103, 4);
        rawSocket.write(sslBuf);
      });

      rawSocket.on('error', (err) => {
        if (!finished) {
          cleanup();
          resolve({ connected: false, error: `Lỗi kết nối socket: ${err.message}` });
        }
      });

      rawSocket.once('data', (data) => {
        const reply = data.toString('utf8');
        if (reply !== 'S') {
          if (!finished) {
            cleanup();
            rawSocket.destroy();
            resolve({ connected: false, error: 'Máy chủ từ chối kết nối mã hóa SSL.' });
          }
          return;
        }

        const tlsSocket = tls.connect(
          { socket: rawSocket, servername: host, rejectUnauthorized: false },
          () => {
            // StartupMessage v3.0
            const params = [
              'user\0' + user + '\0',
              'database\0' + database + '\0',
              'client_encoding\0UTF8\0',
              '\0',
            ];
            const paramBuf = Buffer.from(params.join(''));
            const len = 4 + 4 + paramBuf.length;
            const startupBuf = Buffer.alloc(len);
            startupBuf.writeInt32BE(len, 0);
            startupBuf.writeInt32BE(196608, 4);
            paramBuf.copy(startupBuf, 8);
            tlsSocket.write(startupBuf);
          }
        );

        let serverFirstMessage = '';
        let querySent = false;

        tlsSocket.on('data', (rawChunk: Buffer | string) => {
          const chunk = Buffer.isBuffer(rawChunk) ? rawChunk : Buffer.from(rawChunk);
          let offset = 0;
          while (offset < chunk.length) {
            const type = String.fromCharCode(chunk[offset]);
            const len = chunk.readInt32BE(offset + 1);
            const payload: Buffer = chunk.subarray(offset + 5, offset + 1 + len);
            offset += 1 + len;

            if (type === 'R') {
              const authType = payload.readInt32BE(0);
              if (authType === 10) {
                // AuthenticationSASL
                const mech = 'SCRAM-SHA-256\0';
                const cfBuf = Buffer.from(clientFirstMessage);
                const pLen = mech.length + 4 + cfBuf.length;
                const msg = Buffer.alloc(1 + 4 + pLen);
                msg[0] = 0x70; // 'p'
                msg.writeInt32BE(4 + pLen, 1);
                let pOff = 5;
                msg.write(mech, pOff);
                pOff += mech.length;
                msg.writeInt32BE(cfBuf.length, pOff);
                pOff += 4;
                cfBuf.copy(msg, pOff);
                tlsSocket.write(msg);
              } else if (authType === 11) {
                // AuthenticationSASLContinue
                serverFirstMessage = payload.subarray(4).toString('utf8');
                const attr = parseScramAttributes(serverFirstMessage);
                const combinedNonce = attr.r;
                const salt = Buffer.from(attr.s, 'base64');
                const iterations = parseInt(attr.i, 10);

                const clientFinalWithoutProof =
                  'c=' + Buffer.from('n,,').toString('base64') + ',r=' + combinedNonce;
                const saltedPassword = crypto.pbkdf2Sync(
                  password,
                  salt,
                  iterations,
                  32,
                  'sha256'
                );
                const clientKey = hmacSha256(saltedPassword, 'Client Key');
                const storedKey = sha256Hash(clientKey);
                const authMessage =
                  clientFirstBare + ',' + serverFirstMessage + ',' + clientFinalWithoutProof;
                const clientSignature = hmacSha256(storedKey, authMessage);
                const clientProof = xorBuffers(clientKey, clientSignature);

                const clientFinalMessage =
                  clientFinalWithoutProof + ',p=' + clientProof.toString('base64');
                const cfBuf = Buffer.from(clientFinalMessage);
                const msg = Buffer.alloc(1 + 4 + cfBuf.length);
                msg[0] = 0x70;
                msg.writeInt32BE(4 + cfBuf.length, 1);
                cfBuf.copy(msg, 5);
                tlsSocket.write(msg);
              } else if (authType === 0) {
                // AuthenticationOk
              }
            } else if (type === 'E') {
              if (!finished) {
                cleanup();
                tlsSocket.destroy();
                resolve({
                  connected: false,
                  error: 'PostgreSQL trả về lỗi xác thực danh tính.',
                });
              }
              return;
            } else if (type === 'Z' && !querySent) {
              querySent = true;
              const queryStr =
                'SELECT 1 as connected, current_database() as db, version() as ver;\0';
              const qBuf = Buffer.from(queryStr);
              const qMsg = Buffer.alloc(1 + 4 + qBuf.length);
              qMsg[0] = 0x51; // 'Q'
              qMsg.writeInt32BE(4 + qBuf.length, 1);
              qBuf.copy(qMsg, 5);
              tlsSocket.write(qMsg);
            } else if (type === 'D') {
              const colCount = payload.readInt16BE(0);
              let dOff = 2;
              const vals: (string | null)[] = [];
              for (let c = 0; c < colCount; c++) {
                const colLen = payload.readInt32BE(dOff);
                dOff += 4;
                if (colLen === -1) {
                  vals.push(null);
                } else {
                  vals.push(payload.slice(dOff, dOff + colLen).toString('utf8'));
                  dOff += colLen;
                }
              }

              if (!finished) {
                cleanup();
                tlsSocket.end();
                const latencyMs = Date.now() - start;
                resolve({
                  connected: vals[0] === '1',
                  latencyMs,
                  database: vals[1] || undefined,
                  serverVersion: vals[2]?.split(',')[0]?.trim() || undefined,
                });
              }
            }
          }
        });

        tlsSocket.on('error', (err) => {
          if (!finished) {
            cleanup();
            resolve({ connected: false, error: `Lỗi kết nối TLS: ${err.message}` });
          }
        });
      });
    } catch (err: unknown) {
      if (!finished) {
        cleanup();
        const msg = err instanceof Error ? err.message : String(err);
        resolve({ connected: false, error: msg });
      }
    }
  });
}
