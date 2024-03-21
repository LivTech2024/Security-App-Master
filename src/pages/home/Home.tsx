import {
  MdAddLocationAlt,
  MdOutlineMessage,
  MdPeople,
  MdSecurity,
} from "react-icons/md";
import { useAuthState } from "../../store";
import { useNavigate } from "react-router-dom";
import { AiOutlineSchedule } from "react-icons/ai";
import { SiAdguard, SiRedhatopenshift } from "react-icons/si";
import { GrTransaction } from "react-icons/gr";
import { FaExclamationTriangle } from "react-icons/fa";
import { IoIosLogOut } from "react-icons/io";
import { PageRoutes } from "../../@types/enum";
import { openContextModal } from "@mantine/modals";

const HomeItem = ({
  name,
  callback,
  path,
  icon,
}: {
  name: string;
  icon: React.ReactNode;
  path?: string;
  callback?: () => void;
}) => {
  const navigate = useNavigate();
  return (
    <div
      onClick={() => (path ? navigate(path) : callback && callback())}
      className="bg-surface shadow rounded border border-gray-300 p-4 cursor-pointer w-full h-[100px] text-center flex flex-col items-center font-semibold gap-2 justify-between"
    >
      {icon}
      <span>{name}</span>
    </div>
  );
};

const Home = () => {
  const { company } = useAuthState();
  const { userSignOut } = useAuthState();
  return (
    <div className="flex flex-col w-full p-10 items-center gap-6 h-full justify-center">
      <div className="flex w-full justify-center items-center">
        <div className="flex flex-col items-center gap-2">
          <MdSecurity className="text-7xl" />
          <div className="font-semibold text-lg">
            Welcome {company?.CompanyName}
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 w-full md:max-w-4xl">
        <HomeItem
          path={PageRoutes.SCHEDULES}
          icon={<AiOutlineSchedule className="text-3xl" />}
          name="Schedules"
        />
        <HomeItem
          path={PageRoutes.EMPLOYEES}
          icon={<MdPeople className="text-3xl" />}
          name="Employees"
        />
        <HomeItem
          path={PageRoutes.SHIFTS}
          icon={<SiRedhatopenshift className="text-2xl" />}
          name="Shifts"
        />
        <HomeItem
          path={PageRoutes.PATROLLING_LIST}
          icon={<SiAdguard className="text-2xl" />}
          name="Patrolling"
        />
        <HomeItem
          path={PageRoutes.LOCATIONS}
          icon={<MdAddLocationAlt className="text-2xl" />}
          name="Locations"
        />
        <HomeItem
          path={PageRoutes.HOME}
          icon={<FaExclamationTriangle className="text-3xl" />}
          name="Incident"
        />
        <HomeItem
          path={PageRoutes.HOME}
          icon={<MdOutlineMessage className="text-3xl" />}
          name="Send Message"
        />
        <HomeItem
          path={PageRoutes.HOME}
          icon={<GrTransaction className="text-3xl" />}
          name="Trades"
        />

        <HomeItem
          icon={<IoIosLogOut className="text-3xl" />}
          name="Sign Out"
          callback={() => {
            openContextModal({
              modal: "confirmModal",
              withCloseButton: false,
              centered: true,
              closeOnClickOutside: true,
              innerProps: {
                title: "Confirm",
                body: "Are you sure to sign out",
                onConfirm: () => {
                  userSignOut();
                },
              },
              size: "30%",
              styles: {
                body: { padding: "0px" },
              },
            });
          }}
        />
      </div>
    </div>
  );
};

export default Home;
