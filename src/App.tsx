import "./App.css";
import Layout from "./layout";
import { Route, Routes } from "react-router-dom";
import Home from "./pages/home/Home";
import { MantineProvider } from "@mantine/core";
import Employees from "./pages/employee/Employees";
import { ModalsProvider } from "@mantine/modals";
import { Notifications } from "@mantine/notifications";
import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import Shifts from "./pages/shifts/Shifts";
import Schedule from "./pages/schedule/Schedule";

function App() {
  return (
    <MantineProvider>
      <ModalsProvider>
        <Notifications />
        <Layout>
          <Routes>
            <Route path="/" Component={Home} />
            <Route path="/home" Component={Home} />
            <Route path="/shifts" Component={Shifts} />
            <Route path="/employees" Component={Employees} />
            <Route path="/schedules" Component={Schedule} />
          </Routes>
        </Layout>
      </ModalsProvider>
    </MantineProvider>
  );
}

export default App;
