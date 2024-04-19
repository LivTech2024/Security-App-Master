import React, { useState } from 'react';
import Dialog from '../../../common/Dialog';
import { useAuthState } from '../../../store';
import InputWithTopHeader from '../../../common/inputs/InputWithTopHeader';
import Button from '../../../common/button/Button';
import NoSearchResult from '../../../common/NoSearchResult';
import { errorHandler } from '../../../utilities/CustomError';
import { closeModalLoader, showModalLoader } from '../../../utilities/TsxUtils';
import DbEmployee from '../../../firebase_configs/DB/DbEmployee';
import { EmployeeRoles } from '../../../store/slice/auth.slice';
import { FaRegTrashAlt } from 'react-icons/fa';
import { openContextModal } from '@mantine/modals';

const AddEmpRoleModal = ({
  opened,
  setOpened,
}: {
  opened: boolean;
  setOpened: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const { empRoles, setEmpRoles, company } = useAuthState();

  const [employeeRole, setEmployeeRole] = useState('');

  const onSave = async () => {
    if (!company || !employeeRole) return;
    try {
      showModalLoader({});

      const newRoleAdded = await DbEmployee.addEmpRole(
        employeeRole,
        company.CompanyId
      );
      setEmployeeRole('');
      setEmpRoles([...empRoles, newRoleAdded as unknown as EmployeeRoles]);

      closeModalLoader();
    } catch (error) {
      errorHandler(error);
      closeModalLoader();
      console.log(error);
    }
  };

  const onDelete = async (roleId: string, empRole: string) => {
    try {
      showModalLoader({});

      await DbEmployee.deleteEmpRole(roleId, empRole);

      setEmpRoles(empRoles.filter((role) => role.EmployeeRoleId !== roleId));

      closeModalLoader();
    } catch (error) {
      errorHandler(error);
      closeModalLoader();
      console.log(error);
    }
  };

  return (
    <Dialog
      opened={opened}
      setOpened={setOpened}
      title="Employee Roles"
      size="50%"
      showBottomTool={false}
    >
      <div className="flex flex-col gap-4">
        <div className="font-semibold">Add new role</div>
        <div className="flex items-center w-full gap-4">
          <InputWithTopHeader
            placeholder="Enter employee role"
            className="mx-0 w-full"
            value={employeeRole}
            onChange={(e) => setEmployeeRole(e.target.value.toUpperCase())}
          />
          <Button
            label="Save"
            onClick={onSave}
            type="black"
            className="py-[10px] px-6"
          />
        </div>

        <table>
          <thead className="">
            <tr>
              <th className="w-3/4 text-start py-2 px-2">Employee Role</th>
              <th className="w-1/4 text-end"></th>
            </tr>
          </thead>
          <tbody className="">
            {empRoles.length > 0 ? (
              empRoles?.map((role) => {
                return (
                  <tr key={role.EmployeeRoleId} className="">
                    <td className="py-2 px-2">{role.EmployeeRoleName}</td>
                    {role.EmployeeRoleIsDeletable && (
                      <td className="text-end flex justify-end py-2 px-2">
                        <FaRegTrashAlt
                          onClick={() =>
                            openContextModal({
                              modal: 'confirmModal',
                              withCloseButton: false,
                              centered: true,
                              closeOnClickOutside: true,
                              innerProps: {
                                title: 'Confirm',
                                body: 'Are you sure to delete this role',
                                onConfirm: () => {
                                  if (!role.EmployeeRoleIsDeletable) return;
                                  onDelete(
                                    role.EmployeeRoleId,
                                    role.EmployeeRoleName
                                  );
                                },
                                onCancel: () => {
                                  setOpened(true);
                                },
                              },
                              size: '30%',
                              styles: {
                                body: { padding: '0px' },
                              },
                            })
                          }
                          className="cursor-pointer text-lg text-textPrimaryRed hover:scale-[1.1]"
                        />
                      </td>
                    )}
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={2}>
                  <NoSearchResult text="No role exist" />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Dialog>
  );
};

export default AddEmpRoleModal;
