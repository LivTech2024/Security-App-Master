import { MdAssuredWorkload, MdEmergencyShare, MdPeople } from 'react-icons/md';
import { VscCallOutgoing } from 'react-icons/vsc';
import { LuActivitySquare } from 'react-icons/lu';
import { useAuthState } from '../../store';
import { useNavigate } from 'react-router-dom';
import { AiOutlineAudit, AiOutlineSchedule } from 'react-icons/ai';
import { SiAdguard } from 'react-icons/si';
import {
  FaClock,
  FaCommentDots,
  FaExclamationTriangle,
  FaKey,
  FaTasks,
  FaToolbox,
} from 'react-icons/fa';
import { PageRoutes } from '../../@types/enum';
import { RiBillLine } from 'react-icons/ri';
import SelectBranch from '../../common/SelectBranch';
import { useState } from 'react';
import { IoMdDocument } from 'react-icons/io';
import { GrCertificate, GrResources } from 'react-icons/gr';
import { FaPeopleGroup } from 'react-icons/fa6';
import { TbReport } from 'react-icons/tb';

const HomeItem = ({
  name,
  callback,
  path,
  icon,
}: {
  name: string;
  icon?: React.ReactNode;
  path?: string;
  callback?: () => void;
}) => {
  const navigate = useNavigate();
  return (
    <div
      onClick={() => (path ? navigate(path) : callback && callback())}
      className={`bg-primaryVariant text-surface shadow rounded border border-gray-300 p-4 cursor-pointer w-full h-[100px] text-center flex flex-col items-center font-semibold gap-4 ${
        icon ? 'justify-between' : 'justify-center'
      }`}
    >
      {icon}

      <span className={`capitalize ${icon && 'line-clamp-1'}`}>{name}</span>
    </div>
  );
};

const Home = () => {
  const { company } = useAuthState();

  const [selectedBranch, setSelectedBranch] = useState('');

  /*  const test = async () => {
    try {
      showModalLoader({});

      closeModalLoader();
    } catch (error) {
      console.log(error);
      closeModalLoader();
    }
  }; */

  return (
    <div className="flex flex-col w-full p-10 items-center gap-6 h-full justify-center bg-primary">
      <div className="flex w-full justify-center items-center">
        <div className="flex flex-col items-center">
          <img
            src={company?.CompanyLogo}
            alt=""
            className="w-[140px] object-cover "
          />

          <div className="font-semibold text-lg text-surface">
            Welcome {company?.CompanyName}
          </div>

          <div className="mt-4">
            <SelectBranch
              selectedBranch={selectedBranch}
              setSelectedBranch={setSelectedBranch}
            />
          </div>
        </div>
        {/* <button onClick={test} className="text-white">
          test email
        </button> */}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 w-full">
        <HomeItem
          path={PageRoutes.EMPLOYEE_LIST}
          icon={<MdPeople className="text-4xl text-primaryGold" />}
          name="Employee Management"
        />
        <HomeItem
          path={PageRoutes.EMPLOYEE_DAR_LIST}
          icon={<LuActivitySquare className="text-4xl text-primaryGold" />}
          name="Employee DAR"
        />
        <HomeItem
          path={PageRoutes.REPORTS}
          icon={<FaExclamationTriangle className="text-3xl text-primaryGold" />}
          name="Incident Reports"
        />
        <HomeItem
          path={PageRoutes.SCHEDULES}
          icon={<AiOutlineSchedule className="text-3xl text-primaryGold" />}
          name="Shift Scheduling"
        />
        <HomeItem
          path={PageRoutes.CALL_OUT_LIST}
          icon={<VscCallOutgoing className="text-3xl text-primaryGold" />}
          name="Callouts"
        />

        <HomeItem
          path={PageRoutes.PATROLLING_LIST}
          icon={<SiAdguard className="text-2xl text-primaryGold" />}
          name="Patrol Tracking"
        />

        <HomeItem
          path={PageRoutes.EQUIPMENT_LIST}
          icon={<FaToolbox className="text-2xl text-primaryGold" />}
          name="Equipment Management"
        />
        <HomeItem
          path={PageRoutes.KEY_LIST}
          icon={<FaKey className="text-2xl text-primaryGold" />}
          name="Key Management"
        />
        <HomeItem
          path={PageRoutes.PAYMENTS_AND_BILLING}
          icon={<RiBillLine className="text-2xl text-primaryGold" />}
          name="Billing and Invoicing"
        />
        <HomeItem
          path={PageRoutes.TRAINING_AND_CERTIFICATION_LIST}
          name="Training & Certification"
          icon={<GrCertificate className="text-2xl text-primaryGold" />}
        />
        <HomeItem
          path={PageRoutes.VISITOR_LIST}
          name="Visitor management"
          icon={<FaPeopleGroup className="text-2xl text-primaryGold" />}
        />
        <HomeItem
          path={PageRoutes.REPORTS}
          name="Reports"
          icon={<TbReport className="text-2xl text-primaryGold" />}
        />
        <HomeItem
          path={PageRoutes.MESSAGING}
          name="Communication center"
          icon={<FaCommentDots className="text-2xl text-primaryGold" />}
        />
        <HomeItem
          path={PageRoutes.DOCUMENT_REPOSITORY}
          name="Document repository"
          icon={<IoMdDocument className="text-3xl text-primaryGold" />}
        />
        <HomeItem
          path={PageRoutes.EMERGENCY_RESPONSE_LIST}
          name="Emergency response"
          icon={<MdEmergencyShare className="text-2xl text-primaryGold" />}
        />

        <HomeItem
          path={PageRoutes.TIME_AND_ATTENDANCE_LIST}
          name="Time & Attendance"
          icon={<FaClock className="text-2xl text-primaryGold" />}
        />
        <HomeItem
          path={PageRoutes.HOME}
          name="Audit"
          icon={<AiOutlineAudit className="text-2xl text-primaryGold" />}
        />
        <HomeItem
          path={PageRoutes.PERFORMANCE_ASSURANCE}
          name="Performance Assurance"
          icon={<MdAssuredWorkload className="text-2xl text-primaryGold" />}
        />
        <HomeItem
          path={PageRoutes.TASK_AND_TRACKING_LIST}
          name="Task assignment and tracking"
          icon={<FaTasks className="text-2xl text-primaryGold" />}
        />
        <HomeItem
          path={PageRoutes.HRM_HOME}
          name="HR System"
          icon={<GrResources className="text-3xl text-primaryGold" />}
        />
      </div>
    </div>
  );
};

export default Home;
