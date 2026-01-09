import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";

import AppLayout from "./layouts/AppLayout";
import TasksPage from "./pages/TasksPage";
import TimerPage from "./pages/TimerPage";
import DashboardPage from "./pages/DashBoardPage";


const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <TasksPage /> },
      { path: "timer", element: <TimerPage /> },
      { path: "dashboard", element: <DashboardPage /> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
