require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { MongoClient, ServerApiVersion } = require("mongodb");

const app = express();
const port = process.env.PORT || 5000;

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

const client = new MongoClient(process.env.MONGODB_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

app.get("/", (req, res) => {
  res.send({ name: "StudioSpace API", status: "running" });
});

async function run() {
  await client.connect();
  const db = client.db("studiospace");
  console.log("MongoDB connected");

  app.use("/api/studios", require("./routes/studios")(db));

  app.use((req, res) => {
    res.status(404).send({ message: "Route not found" });
  });

  app.listen(port, () => console.log(`Server on port ${port}`));
}

run().catch((err) => {
  console.error("Startup failed:", err.message);
  process.exit(1);
});