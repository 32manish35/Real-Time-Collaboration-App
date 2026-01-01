const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http"); 
const { Server } = require("socket.io"); 
require("dotenv").config();


const Task = require("./models/Task");

const app = express();


const server = http.createServer(app);


const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173", 
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
});


app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

app.use(express.json());


const uri = process.env.MONGO_URI;

mongoose
  .connect(uri)
  .then(() => console.log("✅ SUCCESS: Connected to MongoDB Atlas Cluster!"))
  .catch((err) => {
    console.error("❌ CONNECTION ERROR:", err.message);
  });


io.on("connection", (socket) => {
  console.log(`⚡ Real-time: User connected (${socket.id})`);

  socket.on("disconnect", () => {
    console.log("❌ Real-time: User disconnected");
  });
});



/
app.get("/api/tasks", async (req, res) => {
  try {
    const tasks = await Task.find();
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
});


app.post("/api/tasks", async (req, res) => {
  try {
    const { title, status } = req.body;
    const newTask = new Task({ title, status });
    const savedTask = await newTask.save();

  
    io.emit("taskAdded", savedTask);

    res.status(201).json(savedTask);
  } catch (err) {
    res.status(400).json({ error: "Failed to create task" });
  }
});


app.put("/api/tasks/:id", async (req, res) => {
  try {
    const { status } = req.body;
    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );


    io.emit("taskUpdated", updatedTask);

    res.json(updatedTask);
  } catch (err) {
    res.status(400).json({ error: "Failed to update task" });
  }
});


app.delete("/api/tasks/:id", async (req, res) => {
  try {
    await Task.findByIdAndDelete(req.params.id);


    io.emit("taskDeleted", req.params.id);

    res.json({ message: "Task deleted successfully" });
  } catch (err) {
    res.status(400).json({ error: "Failed to delete task" });
  }
});


app.delete("/api/tasks", async (req, res) => {
  try {
    await Task.deleteMany({});


    io.emit("boardCleared");

    res.json({ message: "All tasks cleared successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to clear board" });
  }
});


app.get("/", (req, res) => {
  res.send("Kanban API with Real-Time Sockets is alive.");
});



const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`🚀 Real-time Server is running on http://localhost:${PORT}`);
});
