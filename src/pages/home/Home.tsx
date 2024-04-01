import { MdPeople } from "react-icons/md";
import { useAuthState } from "../../store";
import { useNavigate } from "react-router-dom";
import { AiOutlineSchedule } from "react-icons/ai";
import { SiAdguard } from "react-icons/si";
import { FaExclamationTriangle, FaToolbox } from "react-icons/fa";
import { PageRoutes } from "../../@types/enum";
import { RiBillLine } from "react-icons/ri";

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
      className={`bg-surface shadow rounded border border-gray-300 p-4 cursor-pointer w-full h-[100px] text-center flex flex-col items-center font-semibold gap-4 ${
        icon ? "justify-between" : "justify-center"
      }`}
    >
      {icon}

      <span className={`capitalize ${icon && "line-clamp-1"}`}>{name}</span>
    </div>
  );
};

const Home = () => {
  const { company } = useAuthState();
  return (
    <div className="flex flex-col w-full p-10 items-center gap-6 h-full justify-center">
      <div className="flex w-full justify-center items-center">
        <div className="flex flex-col items-center gap-2">
          <img src={company?.CompanyLogo} alt="" className="w-[100px]" />

          <div className="font-semibold text-lg">
            Welcome {company?.CompanyName}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 w-full">
        <HomeItem
          path={PageRoutes.EMPLOYEE_LIST}
          icon={<MdPeople className="text-4xl text-primaryGold" />}
          name="Employee Management"
        />
        <HomeItem
          path={PageRoutes.HOME}
          icon={<FaExclamationTriangle className="text-3xl text-primaryGold" />}
          name="Incident Reports"
        />
        <HomeItem
          path={PageRoutes.SCHEDULES}
          icon={<AiOutlineSchedule className="text-3xl text-primaryGold" />}
          name="Shift Scheduling"
        />

        <HomeItem
          path={PageRoutes.PATROLLING_LIST}
          icon={<SiAdguard className="text-2xl text-primaryGold" />}
          name="Patrol Tracking"
        />

        <HomeItem
          path={PageRoutes.HOME}
          icon={<FaToolbox className="text-2xl text-primaryGold" />}
          name="Equipment Management"
        />
        <HomeItem
          path={PageRoutes.HOME}
          icon={<RiBillLine className="text-2xl text-primaryGold" />}
          name="Billing and Invoicing"
        />
        <HomeItem path={PageRoutes.HOME} name="Training & Certification" />
        <HomeItem path={PageRoutes.HOME} name="Visitor management" />
        <HomeItem path={PageRoutes.HOME} name="Reports & analysis" />
        <HomeItem path={PageRoutes.HOME} name="Communication center" />
        <HomeItem path={PageRoutes.HOME} name="Document repository" />
        <HomeItem path={PageRoutes.HOME} name="Emergency response" />
        <HomeItem path={PageRoutes.HOME} name="Environmental sensor" />
        <HomeItem path={PageRoutes.HOME} name="Time & Attendance" />
        <HomeItem path={PageRoutes.HOME} name="Audit" />
        <HomeItem path={PageRoutes.HOME} name="Quality Assurance" />
        <HomeItem path={PageRoutes.HOME} name="Task assignment and tracking" />
      </div>
    </div>
  );
};

export default Home;
