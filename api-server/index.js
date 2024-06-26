const express = require("express");
const { generateSlug } = require("random-word-slugs");
const { ECSClient, RunTaskCommand } = require("@aws-sdk/client-ecs");
const { Server } = require("socket.io");
const Redis = require("ioredis");

const app = express();
const PORT = 9000;
const SOCKET_PORT = 9001;
const subscriber = new Redis(process.env.REDIS_URL);

const ECS_REGION = process.env.S3_REGION;
const ECS_ACCESS_KEY = process.env.ECS_ACCESS_KEY;
const ECS_SECRET_KEY = process.env.ECS_SECRET_KEY;

const io = new Server({ cors: { origin: "*" } });

io.on("connection", (socket) => {
  socket.on("subscribe", (channel) => {
    socket.join(channel);
    socket.emit("message", `subscribed to ${channel}`);
  });
});

io.listen(SOCKET_PORT, () => {
  console.log(`Socket Server listening on port ${SOCKET_PORT}`);
});

const config = {
  CLUSTER: process.env.CLUSTER,
  TASK_DEFINATION: process.env.TASK,
};

const ecsClient = new ECSClient({
  region: ECS_REGION,
  credentials: {
    accessKeyId: ECS_ACCESS_KEY,
    secretAccessKey: ECS_SECRET_KEY,
  },
});

app.use(express.json());

app.post("/project", async (req, res) => {
  const { gitUrl, slug } = req.body;
  const projectSlug = slug ? slug : generateSlug();
  // Spin the docker container
  const command = new RunTaskCommand({
    cluster: config.CLUSTER,
    taskDefinition: config.TASK_DEFINATION,
    launchType: "FARGATE",
    count: 1,
    networkConfiguration: {
      awsvpcConfiguration: {
        subnets: ["subnet-0f9c1d7b"],
        securityGroups: ["sg-0f9c1d7b"],
        assignPublicIp: "ENABLED",
      },
    },
    overrides: {
      containerOverrides: [
        {
          name: "vercel-clone",
          environment: [
            {
              name: "PROJECT_ID",
              value: projectSlug,
            },
            {
              name: "GIT_REPOSITORY_URL",
              value: gitUrl,
            },
          ],
        },
      ],
    },
  });

  await ecsClient.send(command);

  return res.json({
    status: "queued",
    data: { projectSlug, url: `http://${projectSlug}/localhost:8000` },
  });
});

async function initRedisSubscribe() {
  console.log("Subscribing to logs...");
  subscriber.psubscribe("logs:*");
  subscriber.on("pmessage", (pattern, channel, message) => {
    io.to(channel).emit("log", message);
  });
}

initRedisSubscribe();

app.listen(PORT, () => {
  console.log(`API server is running on port ${PORT}`);
});
