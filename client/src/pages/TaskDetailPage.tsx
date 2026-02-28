import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  getTasks,
  getSessions,
  updateTask,
} from "../services/apiClient";
import type { FocusSession } from "../services/apiClient";

type Task = {
  id: number;
  title: string;
  completed: boolean;
};