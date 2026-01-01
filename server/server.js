const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http"); // Required for Socket.io
const { Server } = require("socket.io"); // Required for Socket.io
require("dotenv").config();

// 1. IMPORT THE MODEL
const Task = require("./models/Task");

const app = express();

// 2. CREATE HTTP SERVER
// Socket.io needs to wrap the express app in a standard Node HTTP server
const server = http.createServer(app);

// 3. INITIALIZE SOCKET.IO
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", // Your Vite frontend URL
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
});

// 4. ROBUST CORS & MIDDLEWARE
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use(express.json());

// 5. DATABASE CONNECTION
const uri = process.env.MONGO_URI;

mongoose
  .connect(uri)
  .then(() => console.log("✅ SUCCESS: Connected to MongoDB Atlas Cluster!"))
  .catch((err) => {
    console.error("❌ CONNECTION ERROR:", err.message);
  });

// 6. SOCKET.IO CONNECTION LOGIC
io.on("connection", (socket) => {
  console.log(`⚡ Real-time: User connected (${socket.id})`);

  socket.on("disconnect", () => {
    console.log("❌ Real-time: User disconnected");
  });
});

// 7. API ROUTES (With Real-Time Broadcasting)

// GET: Fetch all tasks
app.get("/api/tasks", async (req, res) => {
  try {
    const tasks = await Task.find();
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
});

// POST: Create a new task
app.post("/api/tasks", async (req, res) => {
  try {
    const { title, status } = req.body;
    const newTask = new Task({ title, status });
    const savedTask = await newTask.save();

    // 📢 BROADCAST: Notify all users a task was added
    io.emit("taskAdded", savedTask);

    res.status(201).json(savedTask);
  } catch (err) {
    res.status(400).json({ error: "Failed to create task" });
  }
});

// PUT: Update task status (Used for Drag and Drop)
app.put("/api/tasks/:id", async (req, res) => {
  try {
    const { status } = req.body;
    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    // 📢 BROADCAST: Notify all users a task moved/updated
    io.emit("taskUpdated", updatedTask);

    res.json(updatedTask);
  } catch (err) {
    res.status(400).json({ error: "Failed to update task" });
  }
});

// DELETE: Remove a specific task
app.delete("/api/tasks/:id", async (req, res) => {
  try {
    await Task.findByIdAndDelete(req.params.id);

    // 📢 BROADCAST: Notify all users a task was deleted
    io.emit("taskDeleted", req.params.id);

    res.json({ message: "Task deleted successfully" });
  } catch (err) {
    res.status(400).json({ error: "Failed to delete task" });
  }
});

// DELETE ALL: Clear the entire board
app.delete("/api/tasks", async (req, res) => {
  try {
    await Task.deleteMany({});

    // 📢 BROADCAST: Notify all users the board is cleared
    io.emit("boardCleared");

    res.json({ message: "All tasks cleared successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to clear board" });
  }
});

// Health check route
app.get("/", (req, res) => {
  res.send("Kanban API with Real-Time Sockets is alive.");
});

// 8. START SERVER
// Use server.listen instead of app.listen to support WebSockets
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`🚀 Real-time Server is running on http://localhost:${PORT}`);
});
