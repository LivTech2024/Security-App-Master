import Button from "../../common/button/Button";
import { IoArrowBackCircle } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import { ClientFormFields, clientSchema } from "../../utilities/zod/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";
import { useAuthState, useEditFormStore } from "../../store";
import { useQueryClient } from "@tanstack/react-query";
import {
  closeModalLoader,
  showModalLoader,
  showSnackbar,
} from "../../utilities/TsxUtils";
import DbClient from "../../firebase_configs/DB/DbClient";
import { REACT_QUERY_KEYS } from "../../@types/enum";
import { errorHandler } from "../../utilities/CustomError";
import { openContextModal } from "@mantine/modals";
import TextareaWithTopHeader from "../../common/inputs/TextareaWithTopHeader";
import InputWithTopHeader from "../../common/inputs/InputWithTopHeader";
import { useEffect, useState } from "react";
import InputDate from "../../common/inputs/InputDate";
import { removeTimeFromDate, toDate } from "../../utilities/misc";
import dayjs from "dayjs";

const ClientCreateOrEdit = () => {
  const navigate = useNavigate();

  const { clientEditData } = useEditFormStore();

  const isEdit = !!clientEditData;

  const methods = useForm<ClientFormFields>({
    resolver: zodResolver(clientSchema),
    defaultValues: isEdit
      ? {
          ClientAddress: clientEditData.ClientAddress,
          ClientContractAmount: clientEditData.ClientContractAmount,
          ClientEmail: clientEditData.ClientEmail,
          ClientHourlyRate: clientEditData.ClientHourlyRate,
          ClientName: clientEditData.ClientName,
          ClientPassword: clientEditData.ClientPassword,
          ClientPhone: clientEditData.ClientPhone,
        }
      : undefined,
  });

  const { company } = useAuthState();

  const queryClient = useQueryClient();

  const [contractStartDate, setContractStartDate] = useState<Date | null>(
    new Date()
  );
  const [contractEndDate, setContractEndDate] = useState<Date | null>(
    dayjs().add(1, "month").toDate()
  );

  useEffect(() => {
    console.log(methods.formState.errors);
  }, [methods.formState.errors]);

  useEffect(() => {
    if (isEdit) {
      setContractStartDate(toDate(clientEditData.ClientContractStartDate));
      setContractEndDate(toDate(clientEditData.ClientContractEndDate));
    }
  }, [isEdit]);

  useEffect(() => {
    if (!contractStartDate) return;
    methods.setValue(
      "ClientContractStartDate",
      removeTimeFromDate(contractStartDate)
    );
  }, [contractStartDate]);

  useEffect(() => {
    if (!contractEndDate) return;
    methods.setValue(
      "ClientContractEndDate",
      removeTimeFromDate(contractEndDate)
    );
  }, [contractEndDate]);

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
      navigate(-1);
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

      navigate(-1);
      closeModalLoader();
    } catch (error) {
      console.log(error);
      errorHandler(error);
      closeModalLoader();
    }
  };
  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex items-center justify-between w-full bg-primaryGold rounded p-4 shadow">
        <div
          onClick={() => navigate(-1)}
          className="flex items-center gap-4 cursor-pointer "
        >
          <div className="cursor-pointer">
            <IoArrowBackCircle className="h-6 w-6" />
          </div>
          <div className="font-semibold text-lg">Create client</div>
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
                    body: "Are you sure to delete this client",
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

      <div className="bg-surface shadow p-4 rounded">
        <FormProvider {...methods}>
          <form
            onSubmit={methods.handleSubmit(onSubmit)}
            className="grid grid-cols-3 gap-4"
          >
            <InputWithTopHeader
              label="Client Name"
              className="mx-0"
              register={methods.register}
              name="ClientName"
              error={methods.formState.errors.ClientName?.message}
            />
            <InputWithTopHeader
              label="Client Phone"
              className="mx-0"
              register={methods.register}
              name="ClientPhone"
              error={methods.formState.errors.ClientPhone?.message}
            />
            <InputWithTopHeader
              label="Client Email"
              className="mx-0"
              register={methods.register}
              name="ClientEmail"
              error={methods.formState.errors.ClientEmail?.message}
            />

            <InputWithTopHeader
              label="Client Password"
              inputType="password"
              className="mx-0"
              register={methods.register}
              name="ClientPassword"
              error={methods.formState.errors.ClientPassword?.message}
              disabled={isEdit}
            />

            <InputDate
              label="Contract Start Date"
              value={contractStartDate}
              setValue={setContractStartDate}
            />

            <InputDate
              label="Contract End Date"
              value={contractEndDate}
              setValue={setContractEndDate}
            />

            <InputWithTopHeader
              label="Contract Amount"
              className="mx-0"
              register={methods.register}
              name="ClientContractAmount"
              decimalCount={2}
              error={methods.formState.errors.ClientContractAmount?.message}
              leadingIcon={<div>$</div>}
            />

            <InputWithTopHeader
              label="Client hourly rate"
              className="mx-0"
              register={methods.register}
              name="ClientHourlyRate"
              decimalCount={2}
              error={methods.formState.errors.ClientHourlyRate?.message}
              leadingIcon={<div>$</div>}
            />
            <div>&nbsp;</div>
            <TextareaWithTopHeader
              title="Client Address (Optional)"
              className="mx-0"
              register={methods.register}
              name="ClientAddress"
              error={methods.formState.errors.ClientAddress?.message}
            />
          </form>
        </FormProvider>
      </div>
    </div>
  );
};

export default ClientCreateOrEdit;
