import React, { useEffect, useState } from "react";
import Dialog from "../../../common/Dialog";
import {
  EquipmentFormFields,
  equipmentSchema,
} from "../../../utilities/zod/schema";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import InputWithTopHeader from "../../../common/inputs/InputWithTopHeader";
import InputSelect from "../../../common/inputs/InputSelect";
import { useAuthState, useEditFormStore } from "../../../store";
import { errorHandler } from "../../../utilities/CustomError";
import {
  closeModalLoader,
  showModalLoader,
  showSnackbar,
} from "../../../utilities/TsxUtils";
import DbEquipment from "../../../firebase_configs/DB/DbEquipment";
import { REACT_QUERY_KEYS } from "../../../@types/enum";
import { useQueryClient } from "@tanstack/react-query";
import { openContextModal } from "@mantine/modals";

const AddEquipmentModal = ({
  opened,
  setOpened,
}: {
  opened: boolean;
  setOpened: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const methods = useForm<EquipmentFormFields>({
    resolver: zodResolver(equipmentSchema),
  });

  const { equipmentEditData, setEquipmentEditData } = useEditFormStore();

  const isEdit = !!equipmentEditData;

  const queryClient = useQueryClient();

  const { companyBranches, company } = useAuthState();

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let allFormFields: EquipmentFormFields = {
      EquipmentName: "",
      EquipmentDescription: null,
      EquipmentTotalQuantity: 0,
      EquipmentCompanyBranchId: null,
    };
    if (isEdit) {
      allFormFields = {
        EquipmentName: equipmentEditData.EquipmentName,
        EquipmentDescription: equipmentEditData.EquipmentDescription,
        EquipmentTotalQuantity: equipmentEditData.EquipmentTotalQuantity,
        EquipmentCompanyBranchId: equipmentEditData.EquipmentCompanyBranchId,
      };
    }
    methods.reset(allFormFields);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, equipmentEditData, opened]);

  const onSubmit = async (data: EquipmentFormFields) => {
    if (!company) return;
    try {
      setLoading(true);

      if (isEdit) {
        await DbEquipment.updateEquipment(equipmentEditData.EquipmentId, data);
        showSnackbar({
          message: "Equipment updated successfully",
          type: "success",
        });
      } else {
        await DbEquipment.createEquipment(company.CompanyId, data);
        showSnackbar({
          message: "Equipment created successfully",
          type: "success",
        });
      }

      await queryClient.invalidateQueries({
        queryKey: [REACT_QUERY_KEYS.EQUIPMENT_LIST],
      });

      setEquipmentEditData(null);

      setOpened(false);
      setLoading(false);
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

      await DbEquipment.deleteEquipment(equipmentEditData.EquipmentId);

      await queryClient.invalidateQueries({
        queryKey: [REACT_QUERY_KEYS.EQUIPMENT_LIST],
      });

      showSnackbar({
        message: "Equipment deleted successfully",
        type: "success",
      });

      setEquipmentEditData(null);
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
  return (
    <Dialog
      opened={opened}
      setOpened={setOpened}
      title="Add Equipment"
      size="60%"
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
                body: "Are you sure to delete this equipment",
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
          <InputWithTopHeader
            className="mx-0"
            label="Equipment Name"
            register={methods.register}
            name="EquipmentName"
            error={methods.formState.errors?.EquipmentName?.message}
          />
          <InputSelect
            label="Select Branch"
            placeholder="Select Branch"
            value={methods.watch("EquipmentCompanyBranchId") || ""}
            clearable
            onChange={(e) =>
              methods.setValue("EquipmentCompanyBranchId", e as string)
            }
            data={companyBranches.map((branches) => {
              return {
                label: branches.CompanyBranchName,
                value: branches.CompanyBranchId,
              };
            })}
            error={methods.formState.errors?.EquipmentCompanyBranchId?.message}
          />
          <InputWithTopHeader
            className="mx-0"
            label="Total Quantity"
            register={methods.register}
            decimalCount={0}
            name="EquipmentTotalQuantity"
            error={methods.formState.errors?.EquipmentTotalQuantity?.message}
          />
          <InputWithTopHeader
            className="mx-0"
            label="Description"
            register={methods.register}
            name="EquipmentDescription"
            error={methods.formState.errors?.EquipmentDescription?.message}
          />
        </form>
      </FormProvider>
    </Dialog>
  );
};

export default AddEquipmentModal;
