import { SiAdguard } from 'react-icons/si';
import { PageRoutes } from '../../@types/enum';
import { useAuthState } from '../../store';
import { FaBell, FaCommentDots } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { TbReport } from 'react-icons/tb';
import { AiOutlineSchedule } from 'react-icons/ai';
import { LuActivitySquare } from 'react-icons/lu';

const HomeItem = ({
  name,
  callback,
  path,
  icon,
  isAlertIconReq,
}: {
  name: string;
  icon?: React.ReactNode;
  path?: string;
  callback?: () => void;
  isAlertIconReq?: boolean;
}) => {
  const navigate = useNavigate();
  return (
    <div
      onClick={() => (path ? navigate(path) : callback && callback())}
      className={`bg-surface  shadow rounded border border-gray-300 p-4 cursor-pointer w-full h-[100px] text-center flex flex-col items-center font-semibold gap-4 ${
        icon ? 'justify-between' : 'justify-center'
      }`}
    >
      {isAlertIconReq && (
        <div className="absolute mr-[275px] mt-[-20px]">
          <FaBell className="text-primaryGold text-3xl rotate-[24deg]" />
        </div>
      )}
      {icon}

      <span className={`capitalize ${icon && 'line-clamp-1'}`}>{name}</span>
    </div>
  );
};

const ClientHome = () => {
  const { client } = useAuthState();
  return (
    <div
      style={{
        backgroundImage: `url(${client?.ClientHomePageBgImg})`,
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'cover',
      }}
      className="flex flex-col w-full p-12 items-center gap-10 h-[calc(100vh-40px)] justify-center "
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
        <HomeItem
          //isAlertIconReq={true}
          path={PageRoutes.CLIENT_PORTAL_PATROLS}
          icon={<SiAdguard className="text-2xl text-primaryGold" />}
          name="Patrol"
        />
        <HomeItem
          path={PageRoutes.CLIENT_PORTAL_SHIFTS}
          icon={<AiOutlineSchedule className="text-2xl text-primaryGold" />}
          name="Shifts"
        />
        <HomeItem
          path={PageRoutes.CLIENT_PORTAL_REPORTS}
          icon={<TbReport className="text-3xl text-primaryGold" />}
          name="Reports"
        />
        <HomeItem
          path={PageRoutes.CLIENT_PORTAL_EMP_DAR_LIST}
          icon={<LuActivitySquare className="text-4xl text-primaryGold" />}
          name="Employee DAR"
        />
        <HomeItem
          path={PageRoutes.CLIENT_PORTAL_MESSAGING}
          name="Message"
          icon={<FaCommentDots className="text-2xl text-primaryGold" />}
        />
      </div>
    </div>
  );
};

export default ClientHome;
