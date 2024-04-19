import { useNavigate } from 'react-router-dom';
import { PageRoutes, REACT_QUERY_KEYS } from '../../@types/enum';
import {
  AddShiftFormFields,
  addShiftFormSchema,
} from '../../utilities/zod/schema';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormProvider, useForm } from 'react-hook-form';
import { IoArrowBackCircle } from 'react-icons/io5';
import { useAuthState, useEditFormStore } from '../../store';
import { openContextModal } from '@mantine/modals';
import Button from '../../common/button/Button';
import { useQueryClient } from '@tanstack/react-query';
import {
  closeModalLoader,
  showModalLoader,
  showSnackbar,
} from '../../utilities/TsxUtils';
import DbShift from '../../firebase_configs/DB/DbShift';
import CustomError, { errorHandler } from '../../utilities/CustomError';
import InputAutoComplete from '../../common/inputs/InputAutocomplete';
import { useEffect, useState } from 'react';
import AddEmpRoleModal from '../../component/employees/modal/AddEmpRoleModal';
import { AiOutlinePlus } from 'react-icons/ai';
import InputWithTopHeader from '../../common/inputs/InputWithTopHeader';
import InputTime from '../../common/inputs/InputTime';
import useFetchLocations from '../../hooks/fetch/useFetchLocations';
import AddBranchModal from '../../component/company_branches/modal/AddBranchModal';
import ShiftTaskForm, { ShiftTask } from '../../component/shifts/ShiftTaskForm';
import useFetchClients from '../../hooks/fetch/useFetchClients';
import InputSelect from '../../common/inputs/InputSelect';
import SwitchWithSideHeader from '../../common/switch/SwitchWithSideHeader';
import DaysOfWeekSelector from '../../component/shifts/DayOfWeekSelector';
import { formatDate, toDate } from '../../utilities/misc';
import { MultiSelect } from '@mantine/core';
import useFetchEmployees from '../../hooks/fetch/useFetchEmployees';
import InputHeader from '../../common/inputs/InputHeader';
import TextareaWithTopHeader from '../../common/inputs/TextareaWithTopHeader';
import useFetchPatrols from '../../hooks/fetch/useFetchPatrols';
import { sendShiftDetailsEmail } from '../../utilities/scheduleHelper';

const ShiftCreateOrEdit = () => {
  const navigate = useNavigate();

  const { shiftEditData } = useEditFormStore();

  const isEdit = !!shiftEditData;

  const methods = useForm<AddShiftFormFields>({
    resolver: zodResolver(addShiftFormSchema),
    defaultValues: isEdit
      ? {
          ShiftLocationAddress: shiftEditData.ShiftLocationAddress ?? null,
          ShiftEnableRestrictedRadius:
            shiftEditData.ShiftEnableRestrictedRadius,
          ShiftCompanyBranchId: shiftEditData.ShiftCompanyBranchId,
          ShiftDescription: shiftEditData.ShiftDescription,
          ShiftEndTime: shiftEditData.ShiftEndTime,
          ShiftLocation: shiftEditData.ShiftLocation
            ? {
                latitude: String(shiftEditData.ShiftLocation.latitude),
                longitude: String(shiftEditData.ShiftLocation.longitude),
              }
            : null,
          ShiftLocationName: shiftEditData.ShiftLocationName ?? null,
          ShiftName: shiftEditData.ShiftName,
          ShiftPosition: shiftEditData.ShiftPosition,
          ShiftStartTime: shiftEditData.ShiftStartTime,
          ShiftClientId: shiftEditData.ShiftClientId,
          ShiftRestrictedRadius: shiftEditData.ShiftRestrictedRadius,
          ShiftRequiredEmp: String(
            shiftEditData.ShiftRequiredEmp
          ) as unknown as number,
          ShiftLocationId: shiftEditData.ShiftLocationId ?? null,
          ShiftAssignedUserId: shiftEditData.ShiftAssignedUserId,
          ShiftPhotoUploadIntervalInMinutes:
            shiftEditData.ShiftPhotoUploadIntervalInMinutes,
          ShiftLinkedPatrolIds: shiftEditData.ShiftLinkedPatrolIds,
        }
      : { ShiftRequiredEmp: String(1) as unknown as number },
  });

  const { company, empRoles, companyBranches } = useAuthState();

  const queryClient = useQueryClient();

  const [addEmpRoleModal, setAddEmpRoleModal] = useState(false);

  const [addCmpBranchModal, setAddCmpBranchModal] = useState(false);

  //Other form fields
  const [shiftPosition, setShiftPosition] = useState<string | null | undefined>(
    ''
  );

  const [startTime, setStartTime] = useState('09:00');

  const [endTime, setEndTime] = useState('17:00');

  const [locationSearchQuery, setLocationSearchQuery] = useState('');

  const [companyBranch, setCompanyBranch] = useState<string | null | undefined>(
    null
  );

  const [shiftTasks, setShiftTasks] = useState<ShiftTask[]>([
    { TaskName: '', TaskQrCodeRequired: false, TaskReturnReq: false },
  ]);

  const [selectedDays, setSelectedDays] = useState<Date[]>([]);

  const { data: locations } = useFetchLocations({
    limit: 5,
    searchQuery: locationSearchQuery,
  });

  const [clientSearchValue, setClientSearchValue] = useState('');

  const { data: clients } = useFetchClients({
    limit: 5,
    searchQuery: clientSearchValue,
  });

  const [empSearchQuery, setEmpSearchQuery] = useState('');

  const [isSpecialShift, setIsSpecialShift] = useState(false);

  useEffect(() => {
    methods.setValue('ShiftIsSpecialShift', isSpecialShift);
  }, [isSpecialShift]);

  const { data: employees } = useFetchEmployees({
    empRole: isSpecialShift ? null : shiftPosition || null,
    searchQuery: empSearchQuery,
  });

  const [patrolSearchQuery, setPatrolSearchQuery] = useState('');

  const { data: patrols } = useFetchPatrols({
    searchQuery: patrolSearchQuery,
  });

  useEffect(() => {
    console.log(methods.formState.errors);
  }, [methods.formState.errors]);

  useEffect(() => {
    if (startTime) {
      methods.setValue('ShiftStartTime', startTime);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startTime]);

  useEffect(() => {
    if (endTime) {
      methods.setValue('ShiftEndTime', endTime);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endTime]);

  useEffect(() => {
    methods.setValue('ShiftPosition', shiftPosition || '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shiftPosition]);

  const locationId = methods.watch('ShiftLocationId');

  useEffect(() => {
    if (locationId) {
      const selectedLocation = locations.find(
        (loc) => loc.LocationId === locationId
      );
      if (selectedLocation) {
        methods.setValue('ShiftLocationName', selectedLocation?.LocationName);
        methods.setValue('ShiftLocationId', selectedLocation?.LocationId);
        methods.setValue('ShiftLocation', {
          latitude: String(selectedLocation.LocationCoordinates.latitude),
          longitude: String(selectedLocation.LocationCoordinates.longitude),
        });
        methods.setValue(
          'ShiftLocationAddress',
          selectedLocation.LocationAddress
        );

        const patrolsOnLocation = patrols.filter(
          (p) => p.PatrolLocationId === selectedLocation?.LocationId
        );

        methods.setValue(
          'ShiftLinkedPatrolIds',
          patrolsOnLocation.map((patrol) => patrol.PatrolId)
        );
      }
    } else {
      methods.setValue('ShiftLocationId', null);
      methods.setValue('ShiftLocationName', null);
      methods.setValue('ShiftLocationAddress', null);
      methods.setValue(
        'ShiftLinkedPatrolIds',
        shiftEditData?.ShiftLinkedPatrolIds ?? []
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locationId]);

  useEffect(() => {
    const branchId = companyBranches.find(
      (b) => b.CompanyBranchName === companyBranch
    )?.CompanyBranchId;
    methods.setValue('ShiftCompanyBranchId', branchId || null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyBranch]);

  //* populate value on editing
  useEffect(() => {
    if (isEdit) {
      setStartTime(shiftEditData.ShiftStartTime);
      setEndTime(shiftEditData.ShiftEndTime);
      setLocationSearchQuery(shiftEditData.ShiftLocationName ?? '');
      setShiftPosition(shiftEditData.ShiftPosition);
      setSelectedDays([toDate(shiftEditData.ShiftDate)]);
      setIsSpecialShift(shiftEditData.ShiftIsSpecialShift);
      if (shiftEditData.ShiftCompanyBranchId) {
        const branchName = companyBranches.find(
          (b) => b.CompanyBranchId === shiftEditData.ShiftCompanyBranchId
        )?.CompanyBranchName;
        setCompanyBranch(branchName || null);
      }
      if (shiftEditData.ShiftTask && shiftEditData.ShiftTask.length > 0) {
        setShiftTasks(
          shiftEditData.ShiftTask.map((task) => {
            return {
              TaskName: task.ShiftTask,
              TaskQrCodeRequired: task.ShiftTaskQrCodeReq,
              TaskReturnReq: task.ShiftTaskReturnReq,
            };
          })
        );
      }
      return;
    }
    setSelectedDays([]);
    setStartTime('09:00');
    setEndTime('17:00');
    setLocationSearchQuery('');
    setShiftPosition('');
    setCompanyBranch(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, shiftEditData]);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (loading) {
      showModalLoader({});
    } else {
      closeModalLoader();
    }
    return () => closeModalLoader();
  }, [loading]);

  const onSubmit = async (data: AddShiftFormFields) => {
    if (!company) return;
    try {
      if (selectedDays.length === 0) {
        throw new CustomError('Please select at least one day');
      }
      setLoading(true);

      if (isEdit) {
        await DbShift.updateShift(
          data,
          shiftEditData.ShiftId,
          company.CompanyId,
          shiftTasks,
          selectedDays[0]
        );
      } else {
        await DbShift.addShift(
          data,
          company.CompanyId,
          shiftTasks,
          selectedDays
        );
      }

      //* Send emails to assigned employees
      const shiftAssignedUserId = methods.watch('ShiftAssignedUserId') || [];

      if (shiftAssignedUserId?.length > 0) {
        const sendEmailPromise = shiftAssignedUserId.map(async (empId) => {
          const emp = employees.find((emp) => emp.EmployeeId === empId);
          if (emp) {
            return sendShiftDetailsEmail({
              companyName: company!.CompanyName,
              empEmail: emp.EmployeeEmail,
              shiftAddress: data.ShiftLocationAddress || 'N/A',
              shiftDate: selectedDays.map((date) => formatDate(date)).join(','),
              shiftEndTime: data.ShiftEndTime,
              shiftName: data.ShiftName,
              shiftStartTime: data.ShiftStartTime,
            });
          }
        });

        await Promise.all(sendEmailPromise);
      }

      await queryClient.invalidateQueries({
        queryKey: [REACT_QUERY_KEYS.SHIFT_LIST],
      });

      await queryClient.invalidateQueries({
        queryKey: [REACT_QUERY_KEYS.SCHEDULES],
      });

      setLoading(false);

      showSnackbar({
        message: 'Shift created successfully',
        type: 'success',
      });
      methods.reset();
      navigate(PageRoutes.SHIFT_LIST);
    } catch (error) {
      console.log(error);
      setLoading(false);
      errorHandler(error);
    }
  };

  const onDelete = async () => {
    if (!isEdit) return;
    try {
      setLoading(true);

      await DbShift.deleteShift(shiftEditData.ShiftId);

      await queryClient.invalidateQueries({
        queryKey: [REACT_QUERY_KEYS.SHIFT_LIST],
      });

      showSnackbar({
        message: 'Shift deleted successfully',
        type: 'success',
      });

      setLoading(false);
      methods.reset();
      navigate(PageRoutes.SHIFT_LIST);
    } catch (error) {
      console.log(error);
      setLoading(false);
      errorHandler(error);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex items-center justify-between w-full bg-primaryGold rounded p-4 shadow">
        <div
          onClick={() => navigate(PageRoutes.SHIFT_LIST)}
          className="flex items-center gap-4 cursor-pointer "
        >
          <div className="cursor-pointer">
            <IoArrowBackCircle className="h-6 w-6" />
          </div>
          <div className="font-semibold text-lg">Create shift</div>
        </div>
        <div className="flex items-center gap-4">
          {isEdit && (
            <Button
              label="Delete"
              type="white"
              onClick={() =>
                openContextModal({
                  modal: 'confirmModal',
                  withCloseButton: false,
                  centered: true,
                  closeOnClickOutside: true,
                  innerProps: {
                    title: 'Confirm',
                    body: 'Are you sure to delete this shift',
                    onConfirm: () => {
                      onDelete();
                    },
                  },
                  size: '30%',
                  styles: {
                    body: { padding: '0px' },
                  },
                })
              }
              className="px-14 py-2"
            />
          )}
          <Button
            label="Save"
            type="black"
            onClick={methods.handleSubmit(onSubmit)}
            className="px-14 py-2"
          />
        </div>
      </div>

      {/* Form */}
      <FormProvider {...methods}>
        <form
          onSubmit={methods.handleSubmit(onSubmit)}
          className="flex w-full gap-4"
        >
          <div className="w-[30%] bg-surface shadow rounded p-4 flex flex-col gap-4">
            <div className="font-semibold text-lg">
              Add shift task (Optional)
            </div>
            <ShiftTaskForm tasks={shiftTasks} setTasks={setShiftTasks} />
          </div>
          <div className="grid grid-cols-2 w-[70%] gap-4 bg-surface shadow rounded p-4">
            <div className="flex items-start justify-between font-medium col-span-2 text-lg">
              <div className="font-semibold text-lg">Add shift details</div>
              <SwitchWithSideHeader
                checked={isSpecialShift}
                onChange={() => setIsSpecialShift(!isSpecialShift)}
                className="w-1/2 mb-2 font-medium text-base bg-gray-200 px-[10px] py-1 rounded"
                label="Is this special shift"
              />
            </div>

            <InputAutoComplete
              label="Shift position"
              value={shiftPosition}
              onChange={setShiftPosition}
              isFilterReq={true}
              data={empRoles.map((role) => {
                return {
                  label: role.EmployeeRoleName,
                  value: role.EmployeeRoleName,
                };
              })}
              dropDownHeader={
                <div
                  onClick={() => {
                    navigate(PageRoutes.EMPLOYEE_LIST);
                    setAddEmpRoleModal(true);
                  }}
                  className="bg-primaryGold text-surface font-medium p-2 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <AiOutlinePlus size={18} />
                    <span>Add employee roles</span>
                  </div>
                </div>
              }
              error={methods.formState.errors.ShiftPosition?.message}
            />

            <InputWithTopHeader
              className="mx-0"
              label="Shift name"
              register={methods.register}
              name="ShiftName"
              error={methods.formState.errors?.ShiftName?.message}
            />

            <InputTime
              label="Start time"
              value={startTime}
              onChange={setStartTime}
            />

            <InputTime label="End time" value={endTime} onChange={setEndTime} />
            <InputSelect
              label="Shift location (Optional for mobile guard)"
              data={locations.map((loc) => {
                return { label: loc.LocationName, value: loc.LocationId };
              })}
              onChange={(e) => methods.setValue('ShiftLocationId', e as string)}
              nothingFoundMessage={
                <div
                  onClick={() => {
                    navigate(PageRoutes.LOCATIONS);
                  }}
                  className="bg-primaryGold text-surface font-medium p-2 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <AiOutlinePlus size={18} />
                    <span>Add location</span>
                  </div>
                </div>
              }
              searchable
              searchValue={locationSearchQuery}
              onSearchChange={setLocationSearchQuery}
              clearable
              error={methods.formState.errors.ShiftLocationName?.message}
            />

            <InputSelect
              label="Client (Optional for mobile guard)"
              value={methods.watch('ShiftClientId') || ''}
              onChange={(e) => methods.setValue('ShiftClientId', e || '')}
              data={clients.map((client) => {
                return { label: client.ClientName, value: client.ClientId };
              })}
              searchable
              clearable
              searchValue={clientSearchValue}
              onSearchChange={setClientSearchValue}
              error={methods.formState.errors.ShiftClientId?.message}
              nothingFoundMessage={
                <div
                  onClick={() => {
                    navigate(PageRoutes.CLIENTS);
                  }}
                  className="bg-primaryGold text-surface font-medium p-2 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <AiOutlinePlus size={18} />
                    <span>Add Client</span>
                  </div>
                </div>
              }
            />

            <InputWithTopHeader
              label="Required no. of employees"
              className="mx-0"
              decimalCount={0}
              register={methods.register}
              name="ShiftRequiredEmp"
              error={methods.formState.errors.ShiftRequiredEmp?.message}
            />

            <InputWithTopHeader
              label="Photo upload interval in minutes (Optional)"
              className="mx-0"
              register={methods.register}
              name="ShiftPhotoUploadIntervalInMinutes"
              error={
                methods.formState.errors.ShiftPhotoUploadIntervalInMinutes
                  ?.message
              }
            />

            <div className="col-span-2 flex items-end justify-end w-full gap-4">
              <InputWithTopHeader
                label="Restricted radius (in meters)"
                className="mx-0 w-full"
                decimalCount={2}
                register={methods.register}
                name="ShiftRestrictedRadius"
                error={methods.formState.errors.ShiftRestrictedRadius?.message}
              />
              <SwitchWithSideHeader
                register={methods.register}
                name="ShiftEnableRestrictedRadius"
                className="w-full mb-2 font-medium"
                label="Enable restricted radius"
              />
            </div>

            <div className="flex flex-col gap-1 col-span-2">
              <InputHeader title="Assign patrols (Optional)" />
              <MultiSelect
                searchable
                data={patrols.map((patrol) => {
                  return { label: patrol.PatrolName, value: patrol.PatrolId };
                })}
                value={methods.watch('ShiftLinkedPatrolIds')}
                onChange={(e) => methods.setValue('ShiftLinkedPatrolIds', e)}
                searchValue={patrolSearchQuery}
                onSearchChange={setPatrolSearchQuery}
                styles={{
                  input: {
                    border: `1px solid #0000001A`,
                    fontWeight: 'normal',
                    fontSize: '18px',
                    borderRadius: '4px',
                    background: '#FFFFFF',
                    color: '#000000',
                    padding: '8px 8px',
                  },
                }}
              />
            </div>

            <div className="flex flex-col gap-4 row-span-2">
              <InputAutoComplete
                readonly={isEdit}
                label="Branch (Optional)"
                value={companyBranch}
                onChange={setCompanyBranch}
                isFilterReq={true}
                data={companyBranches.map((branch) => {
                  return {
                    label: branch.CompanyBranchName,
                    value: branch.CompanyBranchName,
                  };
                })}
                dropDownHeader={
                  <div
                    onClick={() => {
                      setAddCmpBranchModal(true);
                      navigate(PageRoutes.COMPANY_BRANCHES);
                    }}
                    className="bg-primaryGold text-surface font-medium p-2 cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <AiOutlinePlus size={18} />
                      <span>Add new branch</span>
                    </div>
                  </div>
                }
              />

              <div className="flex flex-col gap-1">
                <InputHeader title="Assign employees (Optional)" />
                <MultiSelect
                  maxValues={Number(methods.watch('ShiftRequiredEmp'))}
                  searchable
                  data={employees.map((emp) => {
                    return { label: emp.EmployeeName, value: emp.EmployeeId };
                  })}
                  value={methods.watch('ShiftAssignedUserId')}
                  onChange={(e) => methods.setValue('ShiftAssignedUserId', e)}
                  searchValue={empSearchQuery}
                  onSearchChange={setEmpSearchQuery}
                  styles={{
                    input: {
                      border: `1px solid #0000001A`,
                      fontWeight: 'normal',
                      fontSize: '18px',
                      borderRadius: '4px',
                      background: '#FFFFFF',
                      color: '#000000',
                      padding: '8px 8px',
                    },
                  }}
                  error={methods.formState.errors.ShiftAssignedUserId?.message}
                />
              </div>
            </div>

            <TextareaWithTopHeader
              title="Description (Optional)"
              className="mx-0"
              register={methods.register}
              name="ShiftDescription"
            />

            <div className="col-span-2">
              <DaysOfWeekSelector
                selectedDays={selectedDays}
                setSelectedDays={setSelectedDays}
                isMultipleSelectable={!isEdit}
              />
            </div>
          </div>
        </form>
      </FormProvider>

      <AddBranchModal
        opened={addCmpBranchModal}
        setOpened={setAddCmpBranchModal}
      />
      <AddEmpRoleModal
        opened={addEmpRoleModal}
        setOpened={setAddEmpRoleModal}
      />
    </div>
  );
};

export default ShiftCreateOrEdit;
