import { SiAdguard } from 'react-icons/si';
import { PageRoutes } from '../../@types/enum';
import { useAuthState } from '../../store';
import { FaCommentDots } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { TbReport } from 'react-icons/tb';
import { AiOutlineSchedule } from 'react-icons/ai';

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
      className={`bg-surface  shadow rounded border border-gray-300 p-4 cursor-pointer w-full h-[100px] text-center flex flex-col items-center font-semibold gap-4 ${
        icon ? 'justify-between' : 'justify-center'
      }`}
    >
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
      <div className="flex flex-col items-center gap-">
        {/* {client?.ClientImage && (
          <img src={client?.ClientImage} alt="" className="w-full h-[140px] " />
        )} */}

        {/* <div className="font-semibold text-2xl uppercase mb-10">
          Welcome {client?.ClientName}
        </div> */}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 w-full">
        <HomeItem
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
          path={PageRoutes.CLIENT_PORTAL_MESSAGING}
          name="Message"
          icon={<FaCommentDots className="text-2xl text-primaryGold" />}
        />
      </div>
    </div>
  );
};

export default ClientHome;
