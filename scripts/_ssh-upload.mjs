import { readFileSync } from "fs";
import { Client } from "ssh2";

const [,, host, password, localPath, remotePath] = process.argv;
if (!host || !password || !localPath || !remotePath) {
  console.error("Usage: node _ssh-upload.mjs <host> <password> <localPath> <remotePath>");
  process.exit(1);
}

const content = readFileSync(localPath);
const b64 = content.toString("base64");
const cmd = `echo '${b64}' | base64 -d > ${remotePath}`;

const conn = new Client();
conn
  .on("ready", () => {
    conn.exec(cmd, (err, stream) => {
      if (err) {
        console.error(err.message);
        conn.end();
        process.exit(1);
      }
      stream
        .on("close", (code) => {
          conn.end();
          process.exit(code ?? 0);
        })
        .on("data", (d) => process.stdout.write(d))
        .stderr.on("data", (d) => process.stderr.write(d));
    });
  })
  .on("error", (err) => {
    console.error(err.message);
    process.exit(1);
  })
  .connect({ host, port: 22, username: "root", password, readyTimeout: 30000 });
