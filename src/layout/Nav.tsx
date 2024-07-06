import { useLocation, useNavigate } from 'react-router-dom';
import { PageRoutes } from '../@types/enum';
import { useAuthState } from '../store';
import { openContextModal } from '@mantine/modals';
import PopupMenu from '../common/PopupMenu';
import { useState } from 'react';

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
        //className="bg-yellow-500"
      >
        <PopupMenu
          opened={isDropDownOpened}
          setOpened={setIsDropDownOpened}
          position="bottom-start"
          dropdownStyles={{ marginTop: '-8px', padding: 0, borderRadius: 0 }}
          target={
            <div
              className={`${
                isDropDownOpened && 'bg-onHoverBg text-textPrimary'
              } uppercase cursor-pointer p-2 duration-200 `}
            >
              {name}
            </div>
          }
        >
          <div className="flex flex-col group">
            {dropdownChildren?.map((res, idx) => {
              return (
                <div
                  key={idx}
                  onClick={() => navigate(res.path)}
                  className="px-6 py-2 uppercase cursor-pointer duration-200 hover:bg-onHoverBg group"
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
      className={`uppercase cursor-pointer p-2 duration-200 whitespace-nowrap ${
        location.pathname === path ||
        location.pathname.includes(`/${name.toLowerCase()}`)
          ? 'bg-surface text-textPrimary'
          : 'hover:bg-onHoverBg hover:text-textPrimary'
      }`}
    >
      {name}
    </div>
  );
};

const Nav = ({
  userType,
}: {
  userType: 'admin' | 'client' | 'super_admin' | 'guest';
}) => {
  const { userSignOut } = useAuthState();
  const navigate = useNavigate();

  const { client } = useAuthState();

  return (
    <div
      className={`flex overflow-x-auto sidebar-scrollbar items-center gap-4 w-full bg-primary text-surface  text-sm p-1 ${
        userType === 'admin' && 'justify-between'
      }`}
    >
      {userType === 'admin' && (
        <>
          <NavItem path={PageRoutes.HOME} name="Home" />
          <NavItem path={PageRoutes.SCHEDULES} name="Schedules" />
          <NavItem path={PageRoutes.EMPLOYEE_LIST} name="Employees" />
          {/* <NavItem path={PageRoutes.SHIFT_LIST} name="Shifts" /> */}
          <NavItem path={PageRoutes.PATROLLING_LIST} name="Patrolling" />
          <NavItem
            name="Company"
            isDropdownReq
            dropdownChildren={[
              { name: 'Company Branches', path: PageRoutes.COMPANY_BRANCHES },
              { name: 'Manage Locations', path: PageRoutes.LOCATIONS },
              { name: 'Manage Clients', path: PageRoutes.CLIENTS },
            ]}
          />
          <NavItem
            name="Assets"
            isDropdownReq
            dropdownChildren={[
              {
                name: 'Equipment Management',
                path: PageRoutes.EQUIPMENT_LIST,
              },
              { name: 'Key Management', path: PageRoutes.KEY_LIST },
            ]}
          />
          <NavItem path={PageRoutes.MESSAGING} name="Messaging" />
          <NavItem path={PageRoutes.REPORTS} name="Reports" />
          <NavItem
            path={PageRoutes.PAYMENTS_AND_BILLING}
            name="Payments & Billing"
          />
          <NavItem path={PageRoutes.SETTINGS} name="Settings" />
        </>
      )}

      {userType === 'client' && (
        <>
          <NavItem path={PageRoutes.CLIENT_PORTAL_HOME} name="Home" />
          <NavItem path={PageRoutes.CLIENT_PORTAL_PATROLS} name="Patrols" />
          <NavItem path={PageRoutes.CLIENT_PORTAL_SHIFTS} name="Shifts" />
          <NavItem path={PageRoutes.CLIENT_PORTAL_REPORTS} name="Reports" />
          <NavItem
            path={PageRoutes.CLIENT_PORTAL_EMP_DAR_LIST}
            name="Employees DAR"
          />
          <NavItem path={PageRoutes.CLIENT_PORTAL_MESSAGING} name="Messaging" />
        </>
      )}
      {userType === 'super_admin' && (
        <div className="mr-auto text-base font-semibold ml-2">
          Welcome Super Admin
        </div>
      )}
      {userType !== 'guest' && (
        <NavItem
          name="Sign out"
          callback={() => {
            openContextModal({
              modal: 'confirmModal',
              withCloseButton: false,
              centered: true,
              closeOnClickOutside: true,
              innerProps: {
                title: 'Confirm',
                body: 'Are you sure to sign out',
                onConfirm: () => {
                  navigate(PageRoutes.HOME);
                  userSignOut();
                },
              },
              size: '30%',
              styles: {
                body: { padding: '0px' },
              },
            });
          }}
        />
      )}

      {userType === 'client' && (
        <div className="flex justify-end ml-auto px-4 text-lg">
          {' '}
          Welcome {client?.ClientName}
        </div>
      )}

      {userType === 'guest' && (
        <>
          <NavItem path={PageRoutes.HOME} name="Home" />
          <NavItem path={PageRoutes.PRIVACY_POLICY} name="Privacy Policy" />
          <NavItem
            path={PageRoutes.USER_DATA_DELETION_REQUEST}
            name="User Data Deletion Request"
          />
        </>
      )}
    </div>
  );
};

export default Nav;
