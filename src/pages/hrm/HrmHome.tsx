import {
  FaCalendarAlt,
  FaClipboardCheck,
  FaFileAlt,
  FaUserPlus,
} from 'react-icons/fa';
import PageHeader from '../../common/PageHeader';
import { useNavigate } from 'react-router-dom';
import { PageRoutes } from '../../@types/enum';

const HrmHomeItem = ({
  description,
  icon,
  title,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
}) => {
  return (
    <div
      onClick={onClick}
      className="bg-surface p-4 border rounded-lg shadow-lg cursor-pointer flex flex-col gap-2"
    >
      {icon}
      <div className="text-2xl font-semibold">{title}</div>
      <p>{description}</p>
    </div>
  );
};

const HrmHome = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader title="HR - System" />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Employee Onboarding and Offboarding */}
        <HrmHomeItem
          onClick={() => navigate(PageRoutes.EMPLOYEE_LIST)}
          icon={<FaUserPlus className="text-7xl text-green-500" />}
          title="Employee Onboarding and Offboarding"
          description="Streamline onboarding with digital forms, e-learning modules, and automated task assignments."
        />
        <HrmHomeItem
          onClick={() => {
            navigate(PageRoutes.HRM_LEAVE_REQ_LIST);
          }}
          icon={<FaCalendarAlt className="text-7xl text-blue-500 -ml-1" />}
          title="Leave Management and Approval Workflows"
          description=" Configure flexible workflows for leave requests, with automated
            notifications to supervisors for approvals."
        />
        <HrmHomeItem
          onClick={() => {
            navigate(PageRoutes.PERFORMANCE_ASSURANCE);
          }}
          icon={<FaClipboardCheck className="text-7xl text-yellow-500 -ml-2" />}
          title="Performance Reviews and Goal Tracking"
          description="Integrate performance review cycles with goal-setting features,
            ensuring continuous improvement and career development."
        />
        <HrmHomeItem
          onClick={() => {
            navigate(PageRoutes.DOCUMENT_REPOSITORY);
          }}
          icon={<FaFileAlt className="text-7xl text-red-500 -ml-2" />}
          title="HR Policies and Document Management"
          description="Implement an easily accessible repository for HR policies, ensuring
            that employees can review and acknowledge them digitally."
        />
      </div>
    </div>
  );
};

export default HrmHome;
