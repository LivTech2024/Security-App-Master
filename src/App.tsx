import "./App.css";
import Layout from "./layout";
import { Route, Routes, useLocation } from "react-router-dom";
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
import PaymentsAndBilling from "./pages/payments_and_billing/PaymentsAndBilling";
import InvoiceGenerate from "./pages/payments_and_billing/invoice/InvoiceGenerate";
import InvoiceList from "./pages/payments_and_billing/invoice/InvoiceList";
import Clients from "./pages/client/Clients";
import CreateNewCompany from "./pages/super_admin/CreateNewCompany";
import ShiftView from "./pages/shifts/ShiftView";
import ClientCreateOrEdit from "./pages/client/ClientCreateOrEdit";
import ClientView from "./pages/client/ClientView";
import DocumentRepository from "./pages/document_repository/DocumentRepository";
import EquipmentList from "./pages/equipment_management/EquipmentList";
import EquipmentView from "./pages/equipment_management/EquipmentView";

function App() {
  useOnAuthStateChanged();

  const { company, admin, loading, superAdmin } = useAuthState();

  const { notification } = useListenNotifications();

  const location = useLocation();

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

  if (location.pathname.includes("/super_admin") && superAdmin) {
    return (
      <MantineProvider withGlobalClasses withCssVariables withStaticClasses>
        <ModalsProvider
          modals={{ loader: LoaderModal, confirmModal: ContextConfirmModal }}
        >
          <ToastContainer />
          <Routes>
            {" "}
            <Route
              path={PageRoutes.SUPER_ADMIN_CREATE_NEW_COMPANY}
              Component={CreateNewCompany}
            />
          </Routes>
        </ModalsProvider>
      </MantineProvider>
    );
  }

  if (
    !admin ||
    !company ||
    (location.pathname.includes("/super_admin") && !superAdmin)
  ) {
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
            <Route path={PageRoutes.SHIFT_VIEW} Component={ShiftView} />
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
            <Route
              path={PageRoutes.PAYMENTS_AND_BILLING}
              Component={PaymentsAndBilling}
            />
            <Route path={PageRoutes.INVOICE_LIST} Component={InvoiceList} />
            <Route
              path={PageRoutes.INVOICE_GENERATE}
              Component={InvoiceGenerate}
            />
            <Route path={PageRoutes.CLIENTS} Component={Clients} />
            <Route path={PageRoutes.CLIENT_VIEW} Component={ClientView} />
            <Route
              path={PageRoutes.CLIENT_CREATE_OR_EDIT}
              Component={ClientCreateOrEdit}
            />
            <Route
              path={PageRoutes.DOCUMENT_REPOSITORY}
              Component={DocumentRepository}
            />
            <Route path={PageRoutes.EQUIPMENT_LIST} Component={EquipmentList} />
            <Route path={PageRoutes.EQUIPMENT_VIEW} Component={EquipmentView} />
          </Routes>
        </Layout>
      </ModalsProvider>
    </MantineProvider>
  );
}

export default App;
