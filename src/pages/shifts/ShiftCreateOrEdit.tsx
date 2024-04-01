import { useNavigate } from "react-router-dom";
import { PageRoutes, REACT_QUERY_KEYS } from "../../@types/enum";
import {
  AddShiftFormFields,
  addShiftFormSchema,
} from "../../utilities/zod/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";
import { IoArrowBackCircle } from "react-icons/io5";
import { useAuthState, useEditFormStore } from "../../store";
import { openContextModal } from "@mantine/modals";
import Button from "../../common/button/Button";
import { useQueryClient } from "@tanstack/react-query";
import {
  closeModalLoader,
  showModalLoader,
  showSnackbar,
} from "../../utilities/TsxUtils";
import DbShift from "../../firebase_configs/DB/DbShift";
import { errorHandler } from "../../utilities/CustomError";
import InputAutoComplete from "../../common/inputs/InputAutocomplete";
import { useEffect, useState } from "react";
import AddEmpRoleModal from "../../component/employees/modal/AddEmpRoleModal";
import { AiOutlinePlus } from "react-icons/ai";
import InputWithTopHeader from "../../common/inputs/InputWithTopHeader";
import InputDate from "../../common/inputs/InputDate";
import InputTime from "../../common/inputs/InputTime";
import useFetchLocations from "../../hooks/fetch/useFetchLocations";
import TextareaWithTopHeader from "../../common/inputs/TextareaWithTopHeader";
import { toDate } from "../../utilities/misc";
import AddBranchModal from "../../component/company_branches/modal/AddBranchModal";
import ShiftTaskForm, { ShiftTask } from "../../component/shifts/ShiftTaskForm";
import useFetchClients from "../../hooks/fetch/useFetchClients";
import InputSelect from "../../common/inputs/InputSelect";

const ShiftCreateOrEdit = () => {
  const navigate = useNavigate();

  const { shiftEditData } = useEditFormStore();

  const isEdit = !!shiftEditData;

  const methods = useForm<AddShiftFormFields>({
    resolver: zodResolver(addShiftFormSchema),
    defaultValues: isEdit
      ? {
          ShiftAddress: shiftEditData.ShiftAddress,
          ShiftCompanyBranchId: shiftEditData.ShiftCompanyBranchId,
          ShiftDate: toDate(shiftEditData.ShiftDate),
          ShiftDescription: shiftEditData.ShiftDescription,
          ShiftEndTime: shiftEditData.ShiftEndTime,
          ShiftLocation: {
            lat: shiftEditData.ShiftLocation.latitude,
            lng: shiftEditData.ShiftLocation.longitude,
          },
          ShiftLocationName: shiftEditData.ShiftLocationName,
          ShiftName: shiftEditData.ShiftName,
          ShiftPosition: shiftEditData.ShiftPosition,
          ShiftStartTime: shiftEditData.ShiftStartTime,
          ShiftClientId: shiftEditData.ShiftClientId,
          ShiftRestrictedRadius: String(
            shiftEditData.ShiftRestrictedRadius
          ) as unknown as number,
          ShiftRequiredEmp: String(
            shiftEditData.ShiftRequiredEmp
          ) as unknown as number,
        }
      : { ShiftRequiredEmp: String(1) as unknown as number },
  });

  const { company, empRoles, companyBranches } = useAuthState();

  const queryClient = useQueryClient();

  const [addEmpRoleModal, setAddEmpRoleModal] = useState(false);

  const [addCmpBranchModal, setAddCmpBranchModal] = useState(false);

  //Other form fields
  const [shiftPosition, setShiftPosition] = useState<string | null | undefined>(
    ""
  );

  const [shiftDate, setShiftDate] = useState<Date | null>(new Date());

  const [startTime, setStartTime] = useState("09:00 AM");

  const [endTime, setEndTime] = useState("05:00 PM");

  const [locationName, setLocationName] = useState<string | null | undefined>(
    ""
  );

  const [companyBranch, setCompanyBranch] = useState<string | null | undefined>(
    null
  );

  const [shiftTasks, setShiftTasks] = useState<ShiftTask[]>([
    { TaskName: "", TaskQrCodeRequired: false },
  ]);

  const { data: locations } = useFetchLocations({
    limit: 5,
    searchQuery: locationName,
  });

  const [clientSearchValue, setClientSearchValue] = useState("");

  const { data: clients } = useFetchClients({
    limit: 5,
    searchQuery: clientSearchValue,
  });

  useEffect(() => {
    if (shiftDate) {
      methods.setValue("ShiftDate", shiftDate);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shiftDate]);

  useEffect(() => {
    if (startTime) {
      methods.setValue("ShiftStartTime", startTime);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startTime]);

  useEffect(() => {
    if (endTime) {
      methods.setValue("ShiftEndTime", endTime);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endTime]);

  useEffect(() => {
    methods.setValue("ShiftPosition", shiftPosition || "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shiftPosition]);

  useEffect(() => {
    if (!locationName) return;
    const location = locations.find((loc) => loc.LocationName === locationName);
    if (location) {
      methods.setValue("ShiftLocationName", locationName);
      methods.setValue("ShiftAddress", location?.LocationAddress);
      methods.setValue("ShiftLocation", {
        lat: location.LocationCoordinates.latitude,
        lng: location.LocationCoordinates.longitude,
      });
    }
  }, [locationName]);

  useEffect(() => {
    const branchId = companyBranches.find(
      (b) => b.CompanyBranchName === companyBranch
    )?.CompanyBranchId;
    methods.setValue("ShiftCompanyBranchId", branchId || null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyBranch]);

  //* populate value on editing
  useEffect(() => {
    if (isEdit) {
      setStartTime(shiftEditData.ShiftStartTime);
      setEndTime(shiftEditData.ShiftEndTime);
      setShiftDate(new Date(shiftEditData.ShiftDate));
      setLocationName(shiftEditData.ShiftLocationName);
      setShiftPosition(shiftEditData.ShiftPosition);
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
            };
          })
        );
      }
      return;
    }
    setShiftDate(new Date());
    setStartTime("09:00 AM");
    setEndTime("05:00 PM");
    setLocationName("");
    setShiftPosition("");
    setCompanyBranch(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, shiftEditData]);

  const onSubmit = async (data: AddShiftFormFields) => {
    if (!company) return;
    try {
      showModalLoader({});

      if (isEdit) {
        await DbShift.updateShift(
          data,
          shiftEditData.ShiftId,
          company.CompanyId,
          shiftTasks
        );
      } else {
        await DbShift.addShift(data, company.CompanyId, shiftTasks);
      }

      await queryClient.invalidateQueries({
        queryKey: [REACT_QUERY_KEYS.SHIFT_LIST],
      });

      await queryClient.invalidateQueries({
        queryKey: [REACT_QUERY_KEYS.SCHEDULES],
      });

      closeModalLoader();
      showSnackbar({
        message: "Shift created successfully",
        type: "success",
      });
      methods.reset();
      navigate(PageRoutes.SHIFT_LIST);
    } catch (error) {
      console.log(error);
      closeModalLoader();
      errorHandler(error);
    }
  };

  const onDelete = async () => {
    if (!isEdit) return;
    try {
      showModalLoader({});

      await DbShift.deleteShift(shiftEditData.ShiftId);

      await queryClient.invalidateQueries({
        queryKey: [REACT_QUERY_KEYS.SHIFT_LIST],
      });

      showSnackbar({
        message: "Shift deleted successfully",
        type: "success",
      });

      closeModalLoader();
      methods.reset();
      navigate(PageRoutes.SHIFT_LIST);
    } catch (error) {
      console.log(error);
      closeModalLoader();
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
                  modal: "confirmModal",
                  withCloseButton: false,
                  centered: true,
                  closeOnClickOutside: true,
                  innerProps: {
                    title: "Confirm",
                    body: "Are you sure to delete this employee",
                    onConfirm: () => {
                      onDelete();
                    },
                  },
                  size: "30%",
                  styles: {
                    body: { padding: "0px" },
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
            <div className="font-medium text-lg">Add shift task (Optional)</div>
            <ShiftTaskForm tasks={shiftTasks} setTasks={setShiftTasks} />
          </div>
          <div className="grid grid-cols-2 w-[70%] gap-4 bg-surface shadow rounded p-4">
            <div className="font-medium col-span-2 text-lg">
              Add shift details
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
                  onClick={() => setAddEmpRoleModal(true)}
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

            <InputDate label="Date" value={shiftDate} setValue={setShiftDate} />

            <InputTime
              label="Start time"
              value={startTime}
              onChange={setStartTime}
              use12Hours={true}
            />

            <InputTime
              label="End time"
              value={endTime}
              onChange={setEndTime}
              use12Hours={true}
            />
            <InputAutoComplete
              label="Shift location"
              data={locations.map((loc) => {
                return { label: loc.LocationName, value: loc.LocationName };
              })}
              value={locationName}
              onChange={setLocationName}
              dropDownHeader={
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
              error={methods.formState.errors.ShiftAddress?.message}
            />

            <InputSelect
              label="Client"
              value={methods.watch("ShiftClientId")}
              onChange={(e) => methods.setValue("ShiftClientId", e || "")}
              data={clients.map((client) => {
                return { label: client.ClientName, value: client.ClientId };
              })}
              searchable
              clearable
              searchValue={clientSearchValue}
              onSearchChange={setClientSearchValue}
              error={methods.formState.errors.ShiftClientId?.message}
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
              label="Restricted radius (in meters)"
              className="mx-0"
              decimalCount={2}
              register={methods.register}
              name="ShiftRestrictedRadius"
              error={methods.formState.errors.ShiftRestrictedRadius?.message}
            />

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
                  onClick={() => setAddCmpBranchModal(true)}
                  className="bg-primaryGold text-surface font-medium p-2 cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <AiOutlinePlus size={18} />
                    <span>Add new branch</span>
                  </div>
                </div>
              }
            />
            <TextareaWithTopHeader
              title="Description (Optional)"
              className="mx-0"
              register={methods.register}
              name="ShiftDescription"
            />
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
