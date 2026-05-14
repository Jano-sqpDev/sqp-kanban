import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

mongoose.set("bufferCommands", false);

const app = express();

const PORT = process.env.PORT || 4000;
const MONGO_URI =
  process.env.MONGO_URI || "mongodb://127.0.0.1:27017/sqp-kanban";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const projectSchema = new mongoose.Schema({
  _id: { type: String },
  name: { type: String, required: true },
  color: { type: String, default: "#64748b" }
});

const taskSchema = new mongoose.Schema({
  _id: { type: String },
  title: { type: String, required: true },
  description: { type: String, default: "" },
  projectId: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
  startedAt: { type: Date, default: null },
  finishedAt: { type: Date, default: null }
});

const columnSchema = new mongoose.Schema({
  _id: { type: String },
  title: { type: String, required: true },
  color: { type: String, required: true },
  tasks: [taskSchema]
});

const boardSchema = new mongoose.Schema(
  {
    title: { type: String, default: "SQP Kanban" },
    projects: [projectSchema],
    columns: [columnSchema]
  },
  { timestamps: true }
);

const Board = mongoose.model("Board", boardSchema);

const defaultBoard = {
  title: "SQP Kanban",
  projects: [],
  columns: [
    {
      title: "To Do",
      color: "#f97316",
      tasks: [
        {
          title: "Example task",
          projectId: "",
          description: "",
          createdAt: new Date(),
          startedAt: null,
          finishedAt: null
        }
      ]
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

function migrateBoard(board) {
  let changed = false;

  if (!board.title) {
    board.title = "SQP Kanban";
    changed = true;
  }

  if (!Array.isArray(board.projects)) {
    board.projects = [];
    changed = true;
  }

  if (!Array.isArray(board.columns) || board.columns.length === 0) {
    board.columns = defaultBoard.columns;
    changed = true;
  }

  board.columns.forEach(column => {
    if (!column.title) {
      column.title = "Untitled";
      changed = true;
    }

    if (!column.color) {
      column.color = "#334155";
      changed = true;
    }

    if (!Array.isArray(column.tasks)) {
      column.tasks = [];
      changed = true;
    }

    column.tasks.forEach(task => {
      if (!task.title) {
        task.title = "Untitled task";
        changed = true;
      }

      if (typeof task.description !== "string") {
        task.description = "";
        changed = true;
      }

      if (typeof task.projectId !== "string") {
        task.projectId = "";
        changed = true;
      }

      if (!task.createdAt) {
        task.createdAt = new Date();
        changed = true;
      }

      if (task.startedAt === undefined) {
        task.startedAt = null;
        changed = true;
      }

      if (task.finishedAt === undefined) {
        task.finishedAt = null;
        changed = true;
      }
    });
  });

  return changed;
}

app.get("/api/health", (req, res) => {
  res.json({
    app: "SQP Kanban",
    mongoState: mongoose.connection.readyState
  });
});

app.get("/api/board", async (req, res) => {
  try {
    let board = await Board.findOne();

    if (!board) {
      board = await Board.create(defaultBoard);
    }

    const changed = migrateBoard(board);

    if (changed) {
      await board.save();
    }

    res.json(board);
  } catch (error) {
    console.error("Could not load board:", error);

    res.status(500).json({
      error: "Could not load board",
      details: error.message
    });
  }
});

app.put("/api/board/:id", async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);

    if (!board) {
      return res.status(404).json({ error: "Board not found" });
    }

    board.title = req.body.title;
    board.projects = req.body.projects;
    board.columns = req.body.columns;

    await board.save();

    res.json(board);
  } catch (error) {
    console.error("Could not save board:", error);

    res.status(500).json({
      error: "Could not save board",
      details: error.message
    });
  }
});

console.log("Connecting to MongoDB:", MONGO_URI);

try {
  await mongoose.connect(MONGO_URI, {
    serverSelectionTimeoutMS: 5000
  });

  console.log("MongoDB connected");

  app.listen(PORT, () => {
    console.log(`SQP Kanban running at http://localhost:${PORT}`);
  });
} catch (error) {
  console.error("Failed to connect to MongoDB:", error.message);
  process.exit(1);
}
