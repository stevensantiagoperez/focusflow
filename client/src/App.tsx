import { RouterProvider, createBrowserRouter, Navigate } from "react-router-dom";
import AppLayout from "./layouts/AppLayout";
import TasksPage from "./pages/TasksPage";
import TimerPage from "./pages/TimerPage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/tasks" replace /> },
      { path: "tasks", element: <TasksPage /> },
      { path: "timer", element: <TimerPage /> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
