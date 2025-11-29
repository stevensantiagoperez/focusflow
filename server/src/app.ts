import express from "express";
import cors from "cors";
import taskRoutes from "./modules/tasks/task.routes";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("FocusFlow API is live 🚀");
});

app.use("/api/tasks", taskRoutes);

export default app;
