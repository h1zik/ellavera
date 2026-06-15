import { createReadStream } from "fs";
import { Client } from "ssh2";

const [,, host, password, localPath, remotePath] = process.argv;
if (!host || !password || !localPath || !remotePath) {
  console.error("Usage: node _ssh-sftp-upload.mjs <host> <password> <localPath> <remotePath>");
  process.exit(1);
}

const conn = new Client();
conn
  .on("ready", () => {
    conn.sftp((err, sftp) => {
      if (err) {
        console.error(err.message);
        conn.end();
        process.exit(1);
      }
      const stream = createReadStream(localPath);
      const write = sftp.createWriteStream(remotePath);
      write.on("close", () => {
        console.log(`Uploaded ${localPath} -> ${remotePath}`);
        conn.end();
      });
      write.on("error", (e) => {
        console.error(e.message);
        conn.end();
        process.exit(1);
      });
      stream.pipe(write);
    });
  })
  .on("error", (err) => {
    console.error(err.message);
    process.exit(1);
  })
  .connect({ host, port: 22, username: "root", password, readyTimeout: 30000 });
