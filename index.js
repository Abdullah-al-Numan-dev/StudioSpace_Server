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

let db;
async function connectDB() {
  if (db) return db;
  await client.connect();
  db = client.db("studiospace");
  return db;
}

app.get("/", (req, res) => {
  res.send({ name: "StudioSpace API", status: "running" });
});

connectDB()
  .then(() => {
    console.log("MongoDB connected");
    app.listen(port, () => console.log(`Server on port ${port}`));
  })
  .catch((err) => {
    console.error("DB connection failed:", err.message);
    process.exit(1);
  });

module.exports = { connectDB };