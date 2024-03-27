import "./App.css";
import Layout from "./layout";
import { Route, Routes } from "react-router-dom";
import Home from "./pages/home/Home";
import { MantineProvider } from "@mantine/core";
import { ModalsProvider } from "@mantine/modals";
import "@mantine/core/styles.css";
import "@mantine/dates/styles.css";
import "react-toastify/dist/ReactToastify.min.css";
import Schedule from "./pages/schedule/Schedule";
import LoaderModal from "./common/modals/LoaderModal";
import { ContextConfirmModal } from "./common/modals/ContextConfirmModal";
import { ToastContainer } from "react-toastify";
import { PageRoutes } from "./@types/enum";
import PatrollingList from "./pages/patrolling/PatrollingList";
import PatrollingCreateOrEdit from "./pages/patrolling/PatrollingCreateOrEdit";
import PatrollingView from "./pages/patrolling/PatrollingView";
import { useEffect } from "react";
import { showSnackbar } from "./utilities/TsxUtils";
import { useAuthState } from "./store";
import Login from "./pages/login/Login";
import useOnAuthStateChanged from "./hooks/useOnAuthStateChanged";
import SplashScreen from "./component/splash_screen/SplashScreen";
import Locations from "./pages/locations/Locations";
import CompanyBranches from "./pages/company_branches/CompanyBranches";
import EmployeeList from "./pages/employee/EmployeeList";
import EmployeeCreateOrEdit from "./pages/employee/EmployeeCreateOrEdit";
import ShiftList from "./pages/shifts/ShiftList";
import ShiftCreateOrEdit from "./pages/shifts/ShiftCreateOrEdit";
import Reports from "./pages/reports/Reports";
import Settings from "./pages/settings/Settings";
import useListenNotifications from "./hooks/listeners/useListenNotifications";

function App() {
  useOnAuthStateChanged();

  const { company, admin, loading } = useAuthState();

  const { notification } = useListenNotifications();

  useEffect(() => {
    if (notification) {
      const { NotificationTitle } = notification;
      showSnackbar({
        message: `New notification received \n${NotificationTitle}`,
        type: "info",
      });
    }
  }, [notification]);

  if (loading) {
    return <SplashScreen />;
  }

  if (!admin || !company) {
    return (
      <MantineProvider withGlobalClasses withCssVariables withStaticClasses>
        <ModalsProvider
          modals={{ loader: LoaderModal, confirmModal: ContextConfirmModal }}
        >
          <ToastContainer /> <Login />
        </ModalsProvider>
      </MantineProvider>
    );
  }

  return (
    <MantineProvider withGlobalClasses withCssVariables withStaticClasses>
      <ModalsProvider
        modals={{ loader: LoaderModal, confirmModal: ContextConfirmModal }}
      >
        <Layout>
          <ToastContainer />
          <Routes>
            <Route path={PageRoutes.HOME} Component={Home} />
            <Route path={PageRoutes.SHIFT_LIST} Component={ShiftList} />
            <Route
              path={PageRoutes.SHIFT_CREATE_OR_EDIT}
              Component={ShiftCreateOrEdit}
            />
            <Route path={PageRoutes.EMPLOYEE_LIST} Component={EmployeeList} />
            <Route
              path={PageRoutes.EMPLOYEE_CREATE_OR_EDIT}
              Component={EmployeeCreateOrEdit}
            />
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
            <Route path={PageRoutes.LOCATIONS} Component={Locations} />
            <Route
              path={PageRoutes.COMPANY_BRANCHES}
              Component={CompanyBranches}
            />
            <Route path={PageRoutes.REPORTS} Component={Reports} />
            <Route path={PageRoutes.SETTINGS} Component={Settings} />
          </Routes>
        </Layout>
      </ModalsProvider>
    </MantineProvider>
  );
}

export default App;
