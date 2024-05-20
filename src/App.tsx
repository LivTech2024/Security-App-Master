import './App.css';
import Layout from './layout';
import { Route, Routes, useLocation } from 'react-router-dom';
import Home from './pages/home/Home';
import { MantineProvider } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import 'react-toastify/dist/ReactToastify.min.css';
import Schedule from './pages/schedule/Schedule';
import LoaderModal from './common/modals/LoaderModal';
import { ContextConfirmModal } from './common/modals/ContextConfirmModal';
import { ToastContainer } from 'react-toastify';
import { PageRoutes } from './@types/enum';
import PatrollingList from './pages/patrolling/PatrollingList';
import PatrollingCreateOrEdit from './pages/patrolling/PatrollingCreateOrEdit';
import PatrollingView from './pages/patrolling/PatrollingView';

import { showSnackbar } from './utilities/TsxUtils';
import { useAuthState } from './store';
import Login from './pages/login/Login';
import useOnAuthStateChanged from './hooks/useOnAuthStateChanged';
import SplashScreen from './component/splash_screen/SplashScreen';
import Locations from './pages/locations/Locations';
import CompanyBranches from './pages/company_branches/CompanyBranches';
import EmployeeList from './pages/employee/EmployeeList';
import EmployeeCreateOrEdit from './pages/employee/EmployeeCreateOrEdit';
import ShiftList from './pages/shifts/ShiftList';
import ShiftCreateOrEdit from './pages/shifts/ShiftCreateOrEdit';
import Reports from './pages/reports/Reports';
import Settings from './pages/settings/Settings';
import PaymentsAndBilling from './pages/payments_and_billing/PaymentsAndBilling';
import InvoiceGenerate from './pages/payments_and_billing/invoice/InvoiceGenerate';
import InvoiceList from './pages/payments_and_billing/invoice/InvoiceList';
import Clients from './pages/client/Clients';
import CreateNewCompany from './pages/super_admin/CreateNewCompany';
import ShiftView from './pages/shifts/ShiftView';
import ClientCreateOrEdit from './pages/client/ClientCreateOrEdit';
import ClientView from './pages/client/ClientView';
import DocumentRepository from './pages/document_repository/DocumentRepository';
import EquipmentList from './pages/equipment_management/EquipmentList';
import EquipmentView from './pages/equipment_management/EquipmentView';
import ReportView from './pages/reports/ReportView';
import ClientHome from './pages/client_portal/ClientHome';
import ClientReports from './pages/client_portal/report/ClientReports';
import ClientPatrolsList from './pages/client_portal/patrol/ClientPatrolsList';
import ClientPatrolView from './pages/client_portal/patrol/ClientPatrolView';
import ClientReportView from './pages/client_portal/report/ClientReportView';
import ClientShifts from './pages/client_portal/shift/ClientShifts';
import ClientShiftView from './pages/client_portal/shift/ClientShiftView';
import Messaging from './pages/messaging/Messaging';
import ClientMessaging from './pages/client_portal/ClientMessaging';
import PatrolLogs from './pages/patrolling/PatrolLogs';
import ClientPatrolLog from './pages/client_portal/patrol/ClientPatrolLog';
import ClientEmpDarList from './pages/client_portal/emp_dar/ClientEmpDarList';
import ClientEmpDarView from './pages/client_portal/emp_dar/ClientEmpDarView';
import VisitorList from './pages/visitor_management/VisitorList';
import VisitorView from './pages/visitor_management/VisitorView';
import KeyList from './pages/key_management/KeyList';
import KeyView from './pages/key_management/KeyView';
import TimeAndAttendance from './pages/time_and_attendance/TimeAndAttendance';
import EmpDarList from './pages/employee_dar/EmpDarList';
import EmpDarView from './pages/employee_dar/EmpDarView';
import PerformanceAssurance from './pages/performance_assurance/PerformanceAssurance';
import TaskList from './pages/task_and_tracking/TaskList';
import TaskLogs from './pages/task_and_tracking/TaskLogs';
import LocationCreateOrEdit from './pages/locations/LocationCreateOrEdit';
import { useTitle } from './hooks/useTitle';
import useFirebaseMessaging from './hooks/useFirebaseMessaging';
import { onMessage } from 'firebase/messaging';
import { messaging } from './firebase_configs/config';

function App() {
  useOnAuthStateChanged();

  useFirebaseMessaging();

  const { company, admin, loading, superAdmin, client } = useAuthState();

  const location = useLocation();

  //*Foreground message
  onMessage(messaging, (payload) => {
    showSnackbar({ message: payload.notification?.body, type: 'info' });
  });

  useTitle(`Tacttik - ${client ? 'Client Portal' : 'Admin App'}`);

  if (loading) {
    return <SplashScreen />;
  }

  if (location.pathname.includes('/client_portal') && client) {
    return (
      <MantineProvider withGlobalClasses withCssVariables withStaticClasses>
        <ModalsProvider
          modals={{ loader: LoaderModal, confirmModal: ContextConfirmModal }}
        >
          <Layout userType="client">
            <ToastContainer />
            <Routes>
              <Route
                path={PageRoutes.CLIENT_PORTAL_HOME}
                Component={ClientHome}
              />
              <Route
                path={PageRoutes.CLIENT_PORTAL_PATROLS}
                Component={ClientPatrolsList}
              />
              <Route
                path={PageRoutes.CLIENT_PORTAL_PATROL_LOGS}
                Component={ClientPatrolLog}
              />
              <Route
                path={PageRoutes.CLIENT_PORTAL_PATROL_VIEW}
                Component={ClientPatrolView}
              />
              <Route
                path={PageRoutes.CLIENT_PORTAL_REPORTS}
                Component={ClientReports}
              />
              <Route
                path={PageRoutes.CLIENT_PORTAL_REPORT_VIEW}
                Component={ClientReportView}
              />
              <Route
                path={PageRoutes.CLIENT_PORTAL_SHIFTS}
                Component={ClientShifts}
              />
              <Route
                path={PageRoutes.CLIENT_PORTAL_SHIFT_VIEW}
                Component={ClientShiftView}
              />
              <Route
                path={PageRoutes.CLIENT_PORTAL_MESSAGING}
                Component={ClientMessaging}
              />
              <Route
                path={PageRoutes.CLIENT_PORTAL_EMP_DAR_LIST}
                Component={ClientEmpDarList}
              />
              <Route
                path={PageRoutes.CLIENT_PORTAL_EMP_DAR_VIEW}
                Component={ClientEmpDarView}
              />
            </Routes>
          </Layout>
        </ModalsProvider>
      </MantineProvider>
    );
  }

  if (location.pathname.includes('/super_admin') && superAdmin) {
    return (
      <MantineProvider withGlobalClasses withCssVariables withStaticClasses>
        <ModalsProvider
          modals={{ loader: LoaderModal, confirmModal: ContextConfirmModal }}
        >
          <ToastContainer />
          <Routes>
            {' '}
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
    (location.pathname.includes('/super_admin') && !superAdmin) ||
    (location.pathname.includes('/client_portal') && !client)
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
        <Layout userType="admin">
          <ToastContainer />
          <Routes>
            <Route path={PageRoutes.HOME} Component={Home} />

            <Route path={PageRoutes.SCHEDULES} Component={Schedule} />
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

            <Route path={PageRoutes.EMPLOYEE_DAR_LIST} Component={EmpDarList} />
            <Route path={PageRoutes.EMPLOYEE_DAR_VIEW} Component={EmpDarView} />

            <Route
              path={PageRoutes.PATROLLING_LIST}
              Component={PatrollingList}
            />
            <Route path={PageRoutes.PATROLLING_LOGS} Component={PatrolLogs} />
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
              path={PageRoutes.LOCATION_CREATE_OR_EDIT}
              Component={LocationCreateOrEdit}
            />

            <Route
              path={PageRoutes.COMPANY_BRANCHES}
              Component={CompanyBranches}
            />
            <Route path={PageRoutes.REPORTS} Component={Reports} />
            <Route path={PageRoutes.REPORT_VIEW} Component={ReportView} />

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

            <Route path={PageRoutes.KEY_LIST} Component={KeyList} />
            <Route path={PageRoutes.KEY_VIEW} Component={KeyView} />

            <Route path={PageRoutes.MESSAGING} Component={Messaging} />

            <Route path={PageRoutes.VISITOR_LIST} Component={VisitorList} />
            <Route path={PageRoutes.VISITOR_VIEW} Component={VisitorView} />

            <Route
              path={PageRoutes.TIME_AND_ATTENDANCE}
              Component={TimeAndAttendance}
            />

            <Route
              path={PageRoutes.PERFORMANCE_ASSURANCE}
              Component={PerformanceAssurance}
            />

            <Route
              path={PageRoutes.TASK_AND_TRACKING_LIST}
              Component={TaskList}
            />
            <Route
              path={PageRoutes.TASK_AND_TRACKING_LOGS}
              Component={TaskLogs}
            />
          </Routes>
        </Layout>
      </ModalsProvider>
    </MantineProvider>
  );
}

export default App;
