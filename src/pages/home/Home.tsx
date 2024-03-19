import { MdSecurity } from "react-icons/md";
import { useAuthState } from "../../store";

const Home = () => {
  const { company, admin } = useAuthState();
  return (
    <div className="flex flex-col w-full h-full p-6">
      <div className="flex justify-between w-full items-center">
        <MdSecurity className="text-7xl" />

        <div className="flex flex-col gap-4 items-center justify-between">
          <span className="font-semibold text-lg">{company?.CompanyName}</span>
          <span className="font-semibold text-lg">
            Welcome {admin?.AdminName}, Admin
          </span>
        </div>
        <div>&nbsp;</div>
      </div>
    </div>
  );
};

export default Home;
