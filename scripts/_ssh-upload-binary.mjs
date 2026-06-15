import { readFileSync } from "fs";
import { Client } from "ssh2";

const [,, host, password, localPath, remotePath] = process.argv;
const buf = readFileSync(localPath);
const chunkSize = 48000;
const conn = new Client();

function exec(cmd) {
  return new Promise((resolve, reject) => {
    conn.exec(cmd, (err, stream) => {
      if (err) return reject(err);
      let stderr = "";
      stream.stderr.on("data", (d) => (stderr += d));
      stream.on("close", (code) => {
        if (code !== 0) reject(new Error(stderr || `exit ${code}`));
        else resolve();
      });
    });
  });
}

conn
  .on("ready", async () => {
    try {
      await exec(`rm -f ${remotePath}.b64 ${remotePath}`);
      for (let i = 0; i < buf.length; i += chunkSize) {
        const chunk = buf.subarray(i, i + chunkSize).toString("base64");
        await exec(`printf '%s' '${chunk}' >> ${remotePath}.b64`);
        process.stdout.write(".");
      }
      console.log("\nDecoding...");
      await exec(`base64 -d ${remotePath}.b64 > ${remotePath} && rm ${remotePath}.b64`);
      conn.end();
    } catch (e) {
      console.error(e.message);
      conn.end();
      process.exit(1);
    }
  })
  .on("error", (e) => {
    console.error(e.message);
    process.exit(1);
  })
  .connect({ host, port: 22, username: "root", password, readyTimeout: 30000 });
