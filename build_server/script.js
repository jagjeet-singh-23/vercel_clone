const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const mime = require("mime-types");
const Redis = require("ioredis");

const publisher = new Redis(process.env.REDIS_URL);

const PROJECT_ID = process.env.PROJECT_ID;
const S3_REGION = process.env.S3_REGION;
const S3_ACCESS_KEY = process.env.S3_ACCESS_KEY;
const S3_SECRET_KEY = process.env.S3_SECRET_KEY;
const BUCKET_NAME = process.env.BUCKET_NAME;
const BUCKET_KEY = `__outputs/${PROJECT_ID}/`;

function publishLogs(log) {
  publisher.publish(`logs:${PROJECT_ID}`, JSON.stringify({ log }));
}

const s3Client = new S3Client({
  region: S3_REGION,
  credentials: {
    accessKeyId: S3_ACCESS_KEY,
    secretAccessKey: S3_SECRET_KEY,
  },
});

async function init() {
  console.log("executing script.js");
  publishLogs("Build started");
  const outDirPath = path.join(__dirname, "output");
  const process = exec(`cd ${outDirPath} && npm install && npm run build`);

  process.stdout.on("data", function (data) {
    console.log(data.toString());
    publishLogs(data.toString());
  });

  process.stderr.on("error", function (data) {
    console.log("Error", data.toString());
    publishLogs(`error: ${data.toString()}`);
  });

  process.on("close", async function () {
    console.log("Build completed");
    publishLogs(`Build completed`);
    const distDirPath = path.join(__dirname, "output", "dist");
    const distDirContents = fs.readdirSync(distDirPath, { recursive: true });

    publishLogs(`Starting upload to S3`);
    for (const file of distDirContents) {
      const filePath = path.join(distDirPath, file);

      if (fs.lstatSync(filePath).isDirectory()) continue;

      console.log(`Uploading ${filePath} to S3`);
      publishLogs(`Uploading ${file} to S3`);

      const command = new PutObjectCommand({
        bucket: BUCKET_NAME,
        key: BUCKET_KEY + `${file}`,
        Body: fs.createReadStream(filePath),
        FileType: mime.lookup(filePath),
      });

      console.log(`Uploaded ${filePath} to S3`);
      publishLogs(`Uploaded ${file} to S3`);
      await s3Client.send(command);
    }

    console.log("Files uploaded to S3");
    publishLogs(`Files uploaded to S3`);
  });
}

init();
