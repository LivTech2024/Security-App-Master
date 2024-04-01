import React, { useEffect } from "react";
import Dialog from "../../../common/Dialog";
import { ClientFormFields, clientSchema } from "../../../utilities/zod/schema";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import InputWithTopHeader from "../../../common/inputs/InputWithTopHeader";
import TextareaWithTopHeader from "../../../common/inputs/TextareaWithTopHeader";
import { useAuthState, useEditFormStore } from "../../../store";
import {
  closeModalLoader,
  showModalLoader,
  showSnackbar,
} from "../../../utilities/TsxUtils";
import { errorHandler } from "../../../utilities/CustomError";
import DbClient from "../../../firebase_configs/DB/DbClient";
import { useQueryClient } from "@tanstack/react-query";
import { REACT_QUERY_KEYS } from "../../../@types/enum";
import { openContextModal } from "@mantine/modals";

const AddClientModal = ({
  opened,
  setOpened,
}: {
  opened: boolean;
  setOpened: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const methods = useForm<ClientFormFields>({
    resolver: zodResolver(clientSchema),
  });

  const { company } = useAuthState();

  const { clientEditData } = useEditFormStore();

  const isEdit = !!clientEditData;

  const queryClient = useQueryClient();

  useEffect(() => {
    let allFormFields: ClientFormFields = {
      ClientName: "",
      ClientEmail: "",
      ClientPhone: "",
      ClientBalance: String(0) as unknown as number,
      ClientAddress: null,
    };
    if (isEdit) {
      allFormFields = {
        ClientName: clientEditData.ClientName,
        ClientEmail: clientEditData.ClientEmail,
        ClientPhone: clientEditData.ClientPhone,
        ClientBalance: String(
          clientEditData.ClientBalance
        ) as unknown as number,
        ClientAddress: clientEditData.ClientAddress,
      };
    }
    methods.reset(allFormFields);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEdit, clientEditData, opened]);

  const onSubmit = async (data: ClientFormFields) => {
    if (!company) return;

    try {
      showModalLoader({});

      if (isEdit) {
        await DbClient.updateClient({
          cmpId: company.CompanyId,
          clientId: clientEditData.ClientId,
          data,
        });
        showSnackbar({
          message: "Client updated successfully",
          type: "success",
        });
      } else {
        await DbClient.createClient({ cmpId: company.CompanyId, data });
        showSnackbar({
          message: "Client created successfully",
          type: "success",
        });
      }

      await queryClient.invalidateQueries({
        queryKey: [REACT_QUERY_KEYS.CLIENT_LIST],
      });

      methods.reset();
      closeModalLoader();
      setOpened(false);
    } catch (error) {
      console.log(error);
      errorHandler(error);
      closeModalLoader();
    }
  };

  const onDelete = async () => {
    if (!company || !isEdit) return;
    try {
      showModalLoader({});

      await DbClient.deleteClient(clientEditData.ClientId);

      showSnackbar({
        message: "Client deleted successfully",
        type: "success",
      });

      await queryClient.invalidateQueries({
        queryKey: [REACT_QUERY_KEYS.CLIENT_LIST],
      });

      methods.reset();

      setOpened(false);
      closeModalLoader();
    } catch (error) {
      console.log(error);
      errorHandler(error);
      closeModalLoader();
    }
  };
  return (
    <Dialog
      opened={opened}
      setOpened={setOpened}
      title="Add Client"
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
                body: "Are you sure to delete this client",
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
            label="Client Name"
            className="mx-0"
            register={methods.register}
            name="ClientName"
            error={methods.formState.errors.ClientName?.message}
          />
          <InputWithTopHeader
            label="Client Email"
            className="mx-0"
            register={methods.register}
            name="ClientEmail"
            error={methods.formState.errors.ClientEmail?.message}
          />
          <InputWithTopHeader
            label="Client Phone"
            className="mx-0"
            register={methods.register}
            name="ClientPhone"
            error={methods.formState.errors.ClientPhone?.message}
          />
          <InputWithTopHeader
            label="Client Balance"
            className="mx-0"
            register={methods.register}
            name="ClientBalance"
            decimalCount={2}
            error={methods.formState.errors.ClientBalance?.message}
            disabled={isEdit}
          />

          <TextareaWithTopHeader
            title="Client Address"
            className="mx-0 col-span-2"
            register={methods.register}
            name="ClientAddress"
            error={methods.formState.errors.ClientAddress?.message}
          />
        </form>
      </FormProvider>
    </Dialog>
  );
};

export default AddClientModal;
