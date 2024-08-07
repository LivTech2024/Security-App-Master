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
import TimeAndAttendanceView from './pages/time_and_attendance/TimeAndAttendanceView';
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
import HrmHome from './pages/hrm/HrmHome';
import CalloutList from './pages/callout/CalloutList';
import CalloutView from './pages/callout/CalloutView';
import PrivacyPolicy from './pages/uprotected_pages/privacy_policy/PrivacyPolicy';
import UserDataDeletionRequest from './pages/uprotected_pages/user_data_deletion_request/UserDataDeletionRequest';
import PayStubGenerate from './pages/payments_and_billing/paystub/PayStubGenerate';
import PayStubList from './pages/payments_and_billing/paystub/PayStubList';
import TimeAndAttendanceList from './pages/time_and_attendance/TimeAndAttendanceList';
import CompanyList from './pages/super_admin/CompanyList';
import TrainCertsList from './pages/training_and_certification/TrainCertsList';
import TrainCertsView from './pages/training_and_certification/TrainCertsView';
import TrainCertsCreateOrEdit from './pages/training_and_certification/TrainCertsCreateOrEdit';
import EmergResList from './pages/emergency_response/EmergResList';
import EmployeeRoute from './pages/employee/EmployeeRoute';
import AuditDashboard from './pages/audit/AuditDashboard';
import LeaveRequestList from './pages/hrm/leave_management/LeaveRequestList';

function App() {
  useOnAuthStateChanged();

  useFirebaseMessaging();

  const { company, admin, loading, superAdmin, client, settings } =
    useAuthState();

  const location = useLocation();

  //*Foreground message
  onMessage(messaging, (payload) => {
    showSnackbar({ message: payload.notification?.body, type: 'info' });
  });

  useTitle(
    `Tacttik ${client ? '- Client Portal' : admin ? '- Admin Portal' : ''}`
  );

  if (loading) {
    return <SplashScreen />;
  }

  //*Unprotected routes
  if (location.pathname.includes('/unprotected')) {
    return (
      <MantineProvider withGlobalClasses withCssVariables withStaticClasses>
        <ModalsProvider
          modals={{ loader: LoaderModal, confirmModal: ContextConfirmModal }}
        >
          <Layout userType="guest">
            <ToastContainer />
            <Routes>
              <Route
                path={PageRoutes.PRIVACY_POLICY}
                Component={PrivacyPolicy}
              />
              <Route
                path={PageRoutes.USER_DATA_DELETION_REQUEST}
                Component={UserDataDeletionRequest}
              />
            </Routes>
          </Layout>
        </ModalsProvider>
      </MantineProvider>
    );
  }

  //*Client Portal Routes
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

  //*Super Admin Routes
  if (location.pathname.includes('/super_admin') && superAdmin) {
    return (
      <MantineProvider withGlobalClasses withCssVariables withStaticClasses>
        <ModalsProvider
          modals={{ loader: LoaderModal, confirmModal: ContextConfirmModal }}
        >
          <Layout userType="super_admin">
            <ToastContainer />
            <Routes>
              <Route
                path={PageRoutes.SUPER_ADMIN_COMPANY_LIST}
                Component={CompanyList}
              />
              <Route
                path={PageRoutes.SUPER_ADMIN_CREATE_NEW_COMPANY}
                Component={CreateNewCompany}
              />
            </Routes>
          </Layout>
        </ModalsProvider>
      </MantineProvider>
    );
  }

  if (
    (!admin ||
      !company ||
      (location.pathname.includes('/super_admin') && !superAdmin) ||
      (location.pathname.includes('/client_portal') && !client)) &&
    !location.pathname.includes('/unprotected')
  ) {
    return (
      <MantineProvider withGlobalClasses withCssVariables withStaticClasses>
        <ModalsProvider
          modals={{ loader: LoaderModal, confirmModal: ContextConfirmModal }}
        >
          <Layout userType="guest">
            <ToastContainer /> <Login />
          </Layout>
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
            <Route path={PageRoutes.EMPLOYEE_ROUTE} Component={EmployeeRoute} />

            {settings?.SettingIsEmpDarEnabled !== false && (
              <>
                <Route
                  path={PageRoutes.EMPLOYEE_DAR_LIST}
                  Component={EmpDarList}
                />
                <Route
                  path={PageRoutes.EMPLOYEE_DAR_VIEW}
                  Component={EmpDarView}
                />
              </>
            )}

            {settings?.SettingIsPatrollingEnabled !== false && (
              <>
                <Route
                  path={PageRoutes.PATROLLING_LIST}
                  Component={PatrollingList}
                />
                <Route
                  path={PageRoutes.PATROLLING_LOGS}
                  Component={PatrolLogs}
                />
                <Route
                  path={PageRoutes.PATROLLING_CREATE_OR_EDIT}
                  Component={PatrollingCreateOrEdit}
                />
                <Route
                  path={PageRoutes.PATROLLING_VIEW}
                  Component={PatrollingView}
                />
              </>
            )}

            <Route path={PageRoutes.LOCATIONS} Component={Locations} />
            <Route
              path={PageRoutes.LOCATION_CREATE_OR_EDIT}
              Component={LocationCreateOrEdit}
            />

            <Route
              path={PageRoutes.COMPANY_BRANCHES}
              Component={CompanyBranches}
            />

            {settings?.SettingIsReportsEnabled !== false && (
              <>
                <Route path={PageRoutes.REPORTS} Component={Reports} />
                <Route path={PageRoutes.REPORT_VIEW} Component={ReportView} />
              </>
            )}

            <Route path={PageRoutes.SETTINGS} Component={Settings} />

            {settings?.SettingIsPaymentsAndBillingEnabled !== false && (
              <>
                <Route
                  path={PageRoutes.PAYMENTS_AND_BILLING}
                  Component={PaymentsAndBilling}
                />
                <Route path={PageRoutes.INVOICE_LIST} Component={InvoiceList} />
                <Route
                  path={PageRoutes.INVOICE_GENERATE}
                  Component={InvoiceGenerate}
                />
                <Route
                  path={PageRoutes.PAY_STUB_LIST}
                  Component={PayStubList}
                />
                <Route
                  path={PageRoutes.PAY_STUB_GENERATE}
                  Component={PayStubGenerate}
                />
              </>
            )}

            <Route path={PageRoutes.CLIENTS} Component={Clients} />
            <Route path={PageRoutes.CLIENT_VIEW} Component={ClientView} />
            <Route
              path={PageRoutes.CLIENT_CREATE_OR_EDIT}
              Component={ClientCreateOrEdit}
            />

            {settings?.SettingIsDocRepoEnabled !== false && (
              <>
                <Route
                  path={PageRoutes.DOCUMENT_REPOSITORY}
                  Component={DocumentRepository}
                />
              </>
            )}

            {settings?.SettingIsEquipmentManagementEnabled !== false && (
              <>
                <Route
                  path={PageRoutes.EQUIPMENT_LIST}
                  Component={EquipmentList}
                />
                <Route
                  path={PageRoutes.EQUIPMENT_VIEW}
                  Component={EquipmentView}
                />
              </>
            )}

            {settings?.SettingIsKeyManagementEnabled !== false && (
              <>
                <Route path={PageRoutes.KEY_LIST} Component={KeyList} />
                <Route path={PageRoutes.KEY_VIEW} Component={KeyView} />
              </>
            )}

            {settings?.SettingIsCommunicationCenterEnabled !== false && (
              <Route path={PageRoutes.MESSAGING} Component={Messaging} />
            )}

            {settings?.SettingIsVisitorManagementEnabled !== false && (
              <>
                <Route path={PageRoutes.VISITOR_LIST} Component={VisitorList} />
                <Route path={PageRoutes.VISITOR_VIEW} Component={VisitorView} />
              </>
            )}

            {settings?.SettingIsTrainingAndCertificationsEnabled !== false && (
              <>
                <Route
                  path={PageRoutes.TRAINING_AND_CERTIFICATION_CREATE_OR_EDIT}
                  Component={TrainCertsCreateOrEdit}
                />
                <Route
                  path={PageRoutes.TRAINING_AND_CERTIFICATION_LIST}
                  Component={TrainCertsList}
                />
                <Route
                  path={PageRoutes.TRAINING_AND_CERTIFICATION_VIEW}
                  Component={TrainCertsView}
                />
              </>
            )}

            {settings?.SettingIsTimeAndAttendanceEnabled !== false && (
              <>
                <Route
                  path={PageRoutes.TIME_AND_ATTENDANCE_VIEW}
                  Component={TimeAndAttendanceView}
                />
                <Route
                  path={PageRoutes.TIME_AND_ATTENDANCE_LIST}
                  Component={TimeAndAttendanceList}
                />
              </>
            )}

            {settings?.SettingIsPerformanceAssuranceEnabled !== false && (
              <Route
                path={PageRoutes.PERFORMANCE_ASSURANCE}
                Component={PerformanceAssurance}
              />
            )}

            {settings?.SettingIsTaskAssignmentAndTrackingEnabled !== false && (
              <>
                <Route
                  path={PageRoutes.TASK_AND_TRACKING_LIST}
                  Component={TaskList}
                />
                <Route
                  path={PageRoutes.TASK_AND_TRACKING_LOGS}
                  Component={TaskLogs}
                />
              </>
            )}

            {settings?.SettingIsCalloutEnabled !== false && (
              <>
                <Route
                  path={PageRoutes.CALL_OUT_LIST}
                  Component={CalloutList}
                />
                <Route
                  path={PageRoutes.CALL_OUT_VIEW}
                  Component={CalloutView}
                />
              </>
            )}

            {settings?.SettingIsEmergencyResponseEnabled !== false && (
              <Route
                path={PageRoutes.EMERGENCY_RESPONSE_LIST}
                Component={EmergResList}
              />
            )}

            {settings?.SettingIsAuditEnabled !== false && (
              <Route
                path={PageRoutes.AUDIT_DASHBOARD}
                Component={AuditDashboard}
              />
            )}

            {settings?.SettingIsHRSystemEnabled !== false && (
              <>
                <Route path={PageRoutes.HRM_HOME} Component={HrmHome} />
                <Route
                  path={PageRoutes.HRM_LEAVE_REQ_LIST}
                  Component={LeaveRequestList}
                />
              </>
            )}
          </Routes>
        </Layout>
      </ModalsProvider>
    </MantineProvider>
  );
}

export default App;
