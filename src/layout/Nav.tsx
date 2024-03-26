import { useLocation, useNavigate } from "react-router-dom";
import { PageRoutes } from "../@types/enum";
import { useAuthState } from "../store";
import { openContextModal } from "@mantine/modals";
import PopupMenu from "../common/PopupMenu";
import { useState } from "react";

const NavItem = ({
  name,
  path,
  callback,
  dropdownChildren,
  isDropdownReq,
}: {
  name: string;
  path?: string;
  callback?: () => void;
  isDropdownReq?: boolean;
  dropdownChildren?: { name: string; path: string }[];
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [isDropDownOpened, setIsDropDownOpened] = useState(false);

  if (isDropdownReq) {
    return (
      <div
        onMouseEnter={() => setIsDropDownOpened(true)}
        onMouseLeave={() => setIsDropDownOpened(false)}
        className="group"
      >
        <PopupMenu
          opened={isDropDownOpened}
          setOpened={setIsDropDownOpened}
          position="bottom-start"
          target={
            <div
              className={`${
                isDropDownOpened && "text-primaryGold"
              } uppercase cursor-pointer p-2 duration-200 group-hover:text-primaryGold`}
            >
              {name}
            </div>
          }
        >
          <div className="flex flex-col group">
            {dropdownChildren?.map((res) => {
              return (
                <div
                  onClick={() => navigate(res.path)}
                  className="px-4 py-2 uppercase cursor-pointer duration-200 hover:bg-onHoverBg group"
                >
                  {res.name}
                </div>
              );
            })}
          </div>
        </PopupMenu>
      </div>
    );
  }
  return (
    <div
      onClick={() => (path ? navigate(path) : callback && callback())}
      className={`uppercase cursor-pointer p-2 duration-200 ${
        location.pathname === path
          ? "bg-surface text-textPrimary"
          : "hover:text-primaryGold"
      }`}
    >
      {name}
    </div>
  );
};

const Nav = () => {
  const { userSignOut } = useAuthState();
  return (
    <div className="flex items-center gap-4 w-full bg-primary text-surface  text-sm p-1 justify-between">
      <NavItem path={PageRoutes.HOME} name="Home" />
      <NavItem path={PageRoutes.SCHEDULES} name="Schedules" />
      <NavItem path={PageRoutes.EMPLOYEE_LIST} name="Employees" />
      <NavItem path={PageRoutes.SHIFT_LIST} name="Shifts" />
      <NavItem path={PageRoutes.PATROLLING_LIST} name="Patrolling" />
      <NavItem
        name="Company"
        isDropdownReq
        dropdownChildren={[
          { name: "Company Branches", path: PageRoutes.COMPANY_BRANCHES },
          { name: "Manage Locations", path: PageRoutes.LOCATIONS },
        ]}
      />
      <NavItem path="#" name="Incident" />
      <NavItem path="#" name="Messaging" />
      <NavItem path="#" name="Reports" />
      <NavItem path="#" name="Settings" />

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
