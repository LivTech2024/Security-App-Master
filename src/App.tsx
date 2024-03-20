import "./App.css";
import Layout from "./layout";
import { Route, Routes } from "react-router-dom";
import Home from "./pages/home/Home";
import { MantineProvider } from "@mantine/core";
import Employees from "./pages/employee/Employees";
import { ModalsProvider } from "@mantine/modals";
import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import Shifts from "./pages/shifts/Shifts";
import Schedule from "./pages/schedule/Schedule";
import LoaderModal from "./common/modals/LoaderModal";
import { ContextConfirmModal } from "./common/modals/ContextConfirmModal";
import { ToastContainer } from "react-toastify";
import { PageRoutes } from "./@types/enum";
import PatrollingList from "./pages/patrolling/PatrollingList";
import PatrollingCreateOrEdit from "./pages/patrolling/PatrollingCreateOrEdit";
import PatrollingView from "./pages/patrolling/PatrollingView";
import useListenIncidents from "./hooks/listeners/useListenIncidents";
import { useEffect } from "react";
import { showSnackbar } from "./utilities/TsxUtils";

function App() {
  const { incident } = useListenIncidents();

  useEffect(() => {
    if (incident) {
      const { IncidentNarrative } = incident;
      showSnackbar({ message: IncidentNarrative, type: "info" });
    }
  }, [incident]);

  return (
    <MantineProvider withGlobalClasses withCssVariables withStaticClasses>
      <ModalsProvider
        modals={{ loader: LoaderModal, confirmModal: ContextConfirmModal }}
      >
        <Layout>
          <ToastContainer />
          <Routes>
            <Route path={PageRoutes.HOME} Component={Home} />
            <Route path={PageRoutes.SHIFTS} Component={Shifts} />
            <Route path={PageRoutes.EMPLOYEES} Component={Employees} />
            <Route path={PageRoutes.SCHEDULES} Component={Schedule} />
            <Route
              path={PageRoutes.PATROLLING_LIST}
              Component={PatrollingList}
            />
            <Route
              path={PageRoutes.PATROLLING_CREATE_OR_EDIT}
              Component={PatrollingCreateOrEdit}
            />
            <Route
              path={PageRoutes.PATROLLING_VIEW}
              Component={PatrollingView}
            />
          </Routes>
        </Layout>
      </ModalsProvider>
    </MantineProvider>
  );
}

export default App;
