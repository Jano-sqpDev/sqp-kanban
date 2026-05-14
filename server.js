import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

await mongoose.connect(
  process.env.MONGO_URI || "mongodb://127.0.0.1:27017/sqp-kanban"
);

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now }
});

const columnSchema = new mongoose.Schema({
  title: { type: String, required: true },
  color: { type: String, required: true },
  tasks: [taskSchema]
});

const boardSchema = new mongoose.Schema(
  {
    title: { type: String, default: "SQP Kanban" },
    columns: [columnSchema]
  },
  { timestamps: true }
);

const Board = mongoose.model("Board", boardSchema);

const defaultBoard = {
  title: "SQP Kanban",
  columns: [
    {
      title: "To Do",
      color: "#f97316",
      tasks: [{ title: "Example task", description: "" }]
    },
    {
      title: "In Progress",
      color: "#1e3a8a",
      tasks: []
    },
    {
      title: "Completed",
      color: "#16a34a",
      tasks: []
    },
    {
      title: "Omit",
      color: "#374151",
      tasks: []
    }
  ]
};

app.get("/api/board", async (req, res) => {
  let board = await Board.findOne();

  if (!board) {
    board = await Board.create(defaultBoard);
  }

  res.json(board);
});

app.put("/api/board/:id", async (req, res) => {
  const board = await Board.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true
    }
  );

  res.json(board);
});

app.listen(PORT, () => {
  console.log(`SQP Kanban running at http://localhost:${PORT}`);
});