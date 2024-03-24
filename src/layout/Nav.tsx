import { useLocation, useNavigate } from "react-router-dom";
import { PageRoutes } from "../@types/enum";
import { useAuthState } from "../store";
import { openContextModal } from "@mantine/modals";

const NavItem = ({
  name,
  path,
  callback,
}: {
  name: string;
  path?: string;
  callback?: () => void;
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  return (
    <div
      onClick={() => (path ? navigate(path) : callback && callback())}
      className={`uppercase cursor-pointer p-2 ${
        location.pathname === path && "bg-surface text-textPrimary"
      }`}
    >
      {name}
    </div>
  );
};

const Nav = () => {
  const { userSignOut } = useAuthState();
  return (
    <div className="flex items-center gap-4 w-full bg-primary text-surface  text-sm p-1">
      <NavItem path={PageRoutes.HOME} name="Home" />
      <NavItem path={PageRoutes.SCHEDULES} name="Schedules" />
      <NavItem path={PageRoutes.EMPLOYEE_LIST} name="Employees" />
      <NavItem path={PageRoutes.SHIFT_LIST} name="Shifts" />
      <NavItem path={PageRoutes.PATROLLING_LIST} name="Patrolling" />
      <NavItem path={PageRoutes.LOCATIONS} name="Locations" />
      <NavItem path={PageRoutes.COMPANY_BRANCHES} name="Company Branches" />
      <NavItem path="/incident" name="Incident" />
      <NavItem path="/send-message" name="Send Message" />
      <NavItem path="/trades" name="Trades" />

      <NavItem
        name="Sign out"
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
  );
};

export default Nav;
