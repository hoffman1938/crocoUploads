// server.js (updated with socket.io for real-time updates)
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path"); // Для путей
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const port = 3000;
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, ".."))); // Статические файлы из корня проекта (excel-site)

// Ваш URI (пароль закодирован)
let password = "Hoffman1938@"; // Актуальный пароль
password = encodeURIComponent(password);
const mongoURI = `mongodb+srv://giowulaia76:${password}@cluster0croco.3zvffx2.mongodb.net/excel-site-db?retryWrites=true&w=majority`;

// Подключение к MongoDB
mongoose
  .connect(mongoURI)
  .then(() => console.log("Connected to MongoDB Atlas"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Схемы и модели
const dataSchema = new mongoose.Schema({
  callDate: String,
  userId: String,
  regDate: String,
  operator: String,
  contact: String,
  comment: String,
  otherNote: String,
  deleted: Boolean,
});
const Data = mongoose.model("Data", dataSchema, "data");

const progressSchema = new mongoose.Schema({
  date: String,
  hour: String,
  source: String,
  operator: String,
  userId: String,
  contact: String,
  result: String,
  nextCall: String,
  note: String,
  repeat: String,
  operator2: String,
  contact2: String,
  result2: String,
  comment: String,
  verified: String,
  category: String,
  count: Number,
  deleted: Boolean,
});
const Progress = mongoose.model("Progress", progressSchema, "progress");

const uploadSchema = new mongoose.Schema({
  currentDate: String,
  operator: String,
  type: String,
  userId: String,
  day: String,
  month: String,
  year: String,
  uploadTime: String,
  deleted: Boolean,
});
const Upload = mongoose.model("Upload", uploadSchema, "upload");

// Роут для главной страницы
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "index.html")); // Путь к index.html в корне
});

// Эндпоинты для data
app.get("/data", async (req, res) => {
  try {
    const data = await Data.find({ deleted: false });
    res.json(data);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.post("/save", async (req, res) => {
  try {
    const newData = req.body;
    await Data.deleteMany({});
    await Data.insertMany(newData);
    io.emit('data-updated', { type: 'data' }); // Emit real-time update
    res.sendStatus(200);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Эндпоинты для progress
app.get("/progress-data", async (req, res) => {
  try {
    const data = await Progress.find({ deleted: false });
    res.json(data);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.post("/save-progress", async (req, res) => {
  try {
    const newData = req.body;
    await Progress.deleteMany({});
    await Progress.insertMany(newData);
    io.emit('data-updated', { type: 'progress' }); // Emit real-time update
    res.sendStatus(200);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

// Эндпоинты для upload
app.get("/upload-data", async (req, res) => {
  try {
    const data = await Upload.find({ deleted: false });
    res.json(data);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.post("/save-upload", async (req, res) => {
  try {
    const newData = req.body;
    await Upload.deleteMany({});
    await Upload.insertMany(newData);
    io.emit('data-updated', { type: 'upload' }); // Emit real-time update
    res.sendStatus(200);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});