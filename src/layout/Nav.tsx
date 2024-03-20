import { useLocation, useNavigate } from "react-router-dom";
import { PageRoutes } from "../@types/enum";

const NavItem = ({ name, path }: { name: string; path: string }) => {
  const navigate = useNavigate();
  const location = useLocation();
  return (
    <div
      onClick={() => navigate(path)}
      className={`uppercase cursor-pointer p-2 ${
        location.pathname === path && "bg-surface text-textPrimary"
      }`}
    >
      {name}
    </div>
  );
};

const Nav = () => {
  return (
    <div className="flex items-center gap-4 w-full bg-primary text-surface  text-sm p-1">
      <NavItem path={PageRoutes.HOME} name="Home" />
      <NavItem path={PageRoutes.SCHEDULES} name="Schedules" />
      <NavItem path={PageRoutes.EMPLOYEES} name="Employees" />
      <NavItem path={PageRoutes.SHIFTS} name="Shifts" />
      <NavItem path={PageRoutes.PATROLLING_LIST} name="Patrolling" />
      <NavItem path="/trades" name="Trades" />
      <NavItem path="/incident" name="Incident" />
      <NavItem path="/send-message" name="Send Message" />
    </div>
  );
};

export default Nav;
