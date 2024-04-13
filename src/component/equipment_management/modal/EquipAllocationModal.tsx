import React, { useEffect, useState } from "react";
import Dialog from "../../../common/Dialog";
import {
  EquipmentAllocationFormFields,
  equipmentAllocationSchema,
} from "../../../utilities/zod/schema";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuthState, useEditFormStore } from "../../../store";
import { useQueryClient } from "@tanstack/react-query";
import {
  closeModalLoader,
  showModalLoader,
  showSnackbar,
} from "../../../utilities/TsxUtils";
import { errorHandler } from "../../../utilities/CustomError";
import DbEquipment from "../../../firebase_configs/DB/DbEquipment";
import { PageRoutes, REACT_QUERY_KEYS } from "../../../@types/enum";
import { openContextModal } from "@mantine/modals";
import InputSelect from "../../../common/inputs/InputSelect";
import InputWithTopHeader from "../../../common/inputs/InputWithTopHeader";
import InputDate from "../../../common/inputs/InputDate";
import useFetchEmployees from "../../../hooks/fetch/useFetchEmployees";
import { AiOutlinePlus } from "react-icons/ai";
import { useNavigate } from "react-router-dom";
import useFetchEquipments from "../../../hooks/fetch/useFetchEquipments";

const EquipAllocationModal = ({
  opened,
  setOpened,
}: {
  opened: boolean;
  setOpened: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const methods = useForm<EquipmentAllocationFormFields>({
    resolver: zodResolver(equipmentAllocationSchema),
  });

  const { equipAllocationEditData, setEquipAllocationEditData } =
    useEditFormStore();

  const isEdit = !!equipAllocationEditData;

  const queryClient = useQueryClient();

  const { company } = useAuthState();

  const [empSearchQuery, setEmpSearchQuery] = useState("");

  const { data: employees } = useFetchEmployees({
    limit: 5,
    searchQuery: empSearchQuery,
  });

  const [equipSearchQuery, setEquipSearchQuery] = useState("");

  const { data: equipments } = useFetchEquipments({
    limit: 5,
    searchQuery: equipSearchQuery,
  });

  const [loading, setLoading] = useState(false);

  const onSubmit = async (data: EquipmentAllocationFormFields) => {
    if (!company) return;
    try {
      setLoading(true);

      if (isEdit) {
        await DbEquipment.updateEquipAllocation(
          equipAllocationEditData?.EquipmentAllocationId,
          data
        );
        showSnackbar({
          message: "Equipment allocation updated successfully",
          type: "success",
        });
      } else {
        await DbEquipment.createEquipAllocation(data);
        showSnackbar({
          message: "Equipment allocation done successfully",
          type: "success",
        });
      }

      await queryClient.invalidateQueries({
        queryKey: [REACT_QUERY_KEYS.EQUIPMENT_ALLOCATION_LIST],
      });

      setEquipAllocationEditData(null);
      setLoading(false);
      setOpened(false);
    } catch (error) {
      setLoading(false);
      console.log(error);
      errorHandler(error);
    }
  };

  const onDelete = async () => {
    if (!isEdit) return;
    try {
      setLoading(true);

      await DbEquipment.deleteEquipAllocation(
        equipAllocationEditData.EquipmentAllocationId
      );

      await queryClient.invalidateQueries({
        queryKey: [REACT_QUERY_KEYS.EQUIPMENT_ALLOCATION_LIST],
      });

      showSnackbar({
        message: "Equipment deleted successfully",
        type: "success",
      });

      setEquipAllocationEditData(null);
      setOpened(false);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      console.log(error);
      errorHandler(error);
    }
  };

  useEffect(() => {
    if (loading) {
      showModalLoader({});
    } else {
      closeModalLoader();
    }
    return () => closeModalLoader();
  }, [loading]);

  const navigate = useNavigate();

  return (
    <Dialog
      opened={opened}
      setOpened={setOpened}
      title="Allocate equipment"
      size="80%"
      isFormModal
      positiveCallback={methods.handleSubmit(onSubmit)}
      negativeCallback={() =>
        isEdit
          ? openContextModal({
              modal: "confirmModal",
              withCloseButton: false,
              centered: true,
              closeOnClickOutside: true,
              innerProps: {
                title: "Confirm",
                body: "Are you sure to delete this equipment allocation",
                onConfirm: () => {
                  onDelete();
                },
                onCancel: () => {
                  setOpened(true);
                },
              },
              size: "30%",
              styles: {
                body: { padding: "0px" },
              },
            })
          : setOpened(false)
      }
      negativeLabel={isEdit ? "Delete" : "Cancel"}
      positiveLabel={isEdit ? "Update" : "Save"}
    >
      <FormProvider {...methods}>
        <form
          onSubmit={methods.handleSubmit(onSubmit)}
          className="grid grid-cols-2 gap-4"
        >
          <InputSelect
            label="Select equipment"
            data={equipments.map((emp) => {
              return { label: emp.EquipmentName, value: emp.EquipmentId };
            })}
            value={methods.watch("EquipmentAllocationEquipId")}
            onChange={(e) => {
              methods.setValue("EquipmentAllocationEquipId", e as string);
            }}
            nothingFoundMessage={
              <div
                onClick={() => {
                  setOpened(false);
                }}
                className="bg-primaryGold text-surface font-medium p-2 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <AiOutlinePlus size={18} />
                  <span>Add new equipment</span>
                </div>
              </div>
            }
            searchable
            searchValue={equipSearchQuery}
            onSearchChange={setEquipSearchQuery}
            error={
              methods.formState?.errors?.EquipmentAllocationEquipId?.message
            }
          />
          <InputWithTopHeader
            className="mx-0"
            label="Allocation QTY"
            register={methods.register}
            name="EquipmentAllocationEquipQty"
            error={
              methods.formState?.errors?.EquipmentAllocationEquipQty?.message
            }
          />
          <InputDate
            label="Date"
            value={methods.watch("EquipmentAllocationDate")}
            setValue={(e) =>
              methods.setValue("EquipmentAllocationDate", e as Date)
            }
            error={methods.formState?.errors?.EquipmentAllocationDate?.message}
          />
          <InputSelect
            label="Select employee"
            data={employees.map((emp) => {
              return { label: emp.EmployeeName, value: emp.EmployeeId };
            })}
            value={methods.watch("EquipmentAllocationEmpId")}
            onChange={(e) => {
              methods.setValue("EquipmentAllocationEmpId", e as string);
              const empName = employees.find(
                (emp) => emp.EmployeeId === e
              )?.EmployeeName;

              if (empName) {
                methods.setValue("EquipmentAllocationEmpName", empName);
              }
            }}
            nothingFoundMessage={
              <div
                onClick={() => {
                  navigate(PageRoutes.EMPLOYEE_CREATE_OR_EDIT);
                }}
                className="bg-primaryGold text-surface font-medium p-2 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <AiOutlinePlus size={18} />
                  <span>Add new employee</span>
                </div>
              </div>
            }
            searchable
            searchValue={empSearchQuery}
            onSearchChange={setEmpSearchQuery}
            error={methods.formState?.errors?.EquipmentAllocationEmpId?.message}
          />
          <InputDate
            label="Allocation Start Date"
            value={methods.watch("EquipmentAllocationStartDate")}
            setValue={(e) =>
              methods.setValue("EquipmentAllocationStartDate", e as Date)
            }
            error={
              methods.formState?.errors?.EquipmentAllocationStartDate?.message
            }
          />
          <InputDate
            label="Allocation End Date"
            value={methods.watch("EquipmentAllocationEndDate")}
            setValue={(e) =>
              methods.setValue("EquipmentAllocationEndDate", e as Date)
            }
            error={
              methods.formState?.errors?.EquipmentAllocationEndDate?.message
            }
          />
        </form>
      </FormProvider>
    </Dialog>
  );
};

export default EquipAllocationModal;
