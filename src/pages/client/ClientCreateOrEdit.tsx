import Button from '../../common/button/Button';
import { IoArrowBackCircle } from 'react-icons/io5';
import { useNavigate } from 'react-router-dom';
import { ClientFormFields, clientSchema } from '../../utilities/zod/schema';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormProvider, useForm } from 'react-hook-form';
import { useAuthState, useEditFormStore } from '../../store';
import { useQueryClient } from '@tanstack/react-query';
import {
  closeModalLoader,
  showModalLoader,
  showSnackbar,
} from '../../utilities/TsxUtils';
import DbClient from '../../firebase_configs/DB/DbClient';
import { PageRoutes, REACT_QUERY_KEYS } from '../../@types/enum';
import { errorHandler } from '../../utilities/CustomError';
import { openContextModal } from '@mantine/modals';
import TextareaWithTopHeader from '../../common/inputs/TextareaWithTopHeader';
import InputWithTopHeader from '../../common/inputs/InputWithTopHeader';
import { ChangeEvent, useEffect, useState } from 'react';
import InputDate from '../../common/inputs/InputDate';
import { removeTimeFromDate, toDate } from '../../utilities/misc';
import dayjs from 'dayjs';
import SwitchWithSideHeader from '../../common/switch/SwitchWithSideHeader';
import InputHeader from '../../common/inputs/InputHeader';
import { FaImage } from 'react-icons/fa';

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
          ClientSendEmailForEachPatrol:
            clientEditData.ClientSendEmailForEachPatrol,
          ClientSendEmailForEachShift:
            clientEditData.ClientSendEmailForEachShift,
        }
      : undefined,
  });

  const { company } = useAuthState();

  const queryClient = useQueryClient();

  const [contractStartDate, setContractStartDate] = useState<Date | null>(
    new Date()
  );
  const [contractEndDate, setContractEndDate] = useState<Date | null>(
    dayjs().add(1, 'month').toDate()
  );

  const [postOrderFile, setPostOrderFile] = useState<string | File | null>(
    null
  );

  const [clientHomeBgImage, setClientHomeBgImage] = useState<string | null>(
    null
  );

  useEffect(() => {
    console.log(methods.formState.errors);
  }, [methods.formState.errors]);

  useEffect(() => {
    if (isEdit) {
      setContractStartDate(toDate(clientEditData.ClientContractStartDate));
      setContractEndDate(toDate(clientEditData.ClientContractEndDate));
      if (clientEditData.ClientHomePageBgImg) {
        setClientHomeBgImage(clientEditData.ClientHomePageBgImg);
      }
      if (clientEditData.ClientPostOrder) {
        setPostOrderFile(clientEditData.ClientPostOrder);
      }
      return;
    }
    setContractStartDate(null);
    setContractEndDate(null);
    setClientHomeBgImage(null);
    setPostOrderFile(null);
  }, [isEdit]);

  useEffect(() => {
    if (!contractStartDate) return;
    methods.setValue(
      'ClientContractStartDate',
      removeTimeFromDate(contractStartDate)
    );
  }, [contractStartDate]);

  useEffect(() => {
    if (!contractEndDate) return;
    methods.setValue(
      'ClientContractEndDate',
      removeTimeFromDate(contractEndDate)
    );
  }, [contractEndDate]);

  const [loading, setLoading] = useState(false);

  const onSubmit = async (data: ClientFormFields) => {
    if (!company) return;

    try {
      setLoading(true);

      if (isEdit) {
        await DbClient.updateClient({
          cmpId: company.CompanyId,
          clientId: clientEditData.ClientId,
          data,
          postOrderFile,
          clientHomeBgImage,
        });
        showSnackbar({
          message: 'Client updated successfully',
          type: 'success',
        });
      } else {
        await DbClient.createClient({
          cmpId: company.CompanyId,
          data,
          postOrderFile,
          clientHomeBgImage,
        });
        showSnackbar({
          message: 'Client created successfully',
          type: 'success',
        });
      }

      await queryClient.invalidateQueries({
        queryKey: [REACT_QUERY_KEYS.CLIENT_LIST],
      });

      methods.reset();
      setLoading(false);

      navigate(PageRoutes.CLIENTS);
    } catch (error) {
      console.log(error);
      errorHandler(error);
      setLoading(false);
    }
  };

  const onDelete = async () => {
    if (!company || !isEdit) return;
    try {
      setLoading(true);

      await DbClient.deleteClient(clientEditData.ClientId);

      showSnackbar({
        message: 'Client deleted successfully',
        type: 'success',
      });

      await queryClient.invalidateQueries({
        queryKey: [REACT_QUERY_KEYS.CLIENT_LIST],
      });

      methods.reset();

      navigate(PageRoutes.CLIENTS);
      setLoading(false);
    } catch (error) {
      console.log(error);
      errorHandler(error);
      setLoading(false);
    }
  };

  const handlePdfChange = (file: File) => {
    setPostOrderFile(file);
  };

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setClientHomeBgImage(reader.result as string);
      };
      reader.readAsDataURL(file);
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
                  modal: 'confirmModal',
                  withCloseButton: false,
                  centered: true,
                  closeOnClickOutside: true,
                  innerProps: {
                    title: 'Confirm',
                    body: 'Are you sure to delete this client',
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

            <div className="flex flex-col gap-10">
              <InputWithTopHeader
                label="Contract Amount"
                className="mx-0"
                register={methods.register}
                name="ClientContractAmount"
                decimalCount={2}
                error={methods.formState.errors.ClientContractAmount?.message}
                leadingIcon={<div>$</div>}
              />
              <SwitchWithSideHeader
                label="Send email for each patrol"
                className="bg-onHoverBg px-4 py-2 rounded"
                register={methods.register}
                name="ClientSendEmailForEachPatrol"
                errors={methods.formState.errors}
              />
            </div>

            <div className="flex flex-col gap-10">
              <InputWithTopHeader
                label="Client hourly rate"
                className="mx-0"
                register={methods.register}
                name="ClientHourlyRate"
                decimalCount={2}
                error={methods.formState.errors.ClientHourlyRate?.message}
                leadingIcon={<div>$</div>}
              />
              <SwitchWithSideHeader
                label="Send email for each shift"
                className="bg-onHoverBg px-4 py-2 rounded"
                register={methods.register}
                name="ClientSendEmailForEachShift"
                errors={methods.formState.errors}
              />
            </div>

            <TextareaWithTopHeader
              title="Client Address (Optional)"
              className="mx-0"
              register={methods.register}
              name="ClientAddress"
              error={methods.formState.errors.ClientAddress?.message}
            />

            <label
              htmlFor="fileUpload"
              className="flex flex-col gap-1 cursor-pointer col-span-3"
            >
              <InputHeader title="Upload post order" fontClassName="text-lg" />
              <div className="flex gap-4 items-center w-full">
                {typeof postOrderFile === 'string' &&
                  postOrderFile.startsWith('https') && (
                    <a
                      href={postOrderFile}
                      className=" text-textPrimaryBlue cursor-pointer"
                    >
                      View Post Order
                    </a>
                  )}
                <input
                  id="fileUpload"
                  type="file"
                  accept="application/pdf"
                  className={`border border-gray-300 p-2 rounded cursor-pointer`}
                  onChange={(e) => handlePdfChange(e.target.files?.[0] as File)}
                />
              </div>
            </label>
            <label
              htmlFor="img"
              className="flex flex-col items-center border border-dashed border-black rounded-md p-4 cursor-pointer"
            >
              {clientHomeBgImage ? (
                <img
                  src={clientHomeBgImage}
                  alt={'Void check'}
                  className="w-full max-h-[200px] rounded"
                />
              ) : (
                <>
                  <FaImage className="text-3xl" />
                  <span className="text-textPrimaryBlue cursor-pointer">
                    Upload client home page image
                  </span>
                </>
              )}
              <input
                id="img"
                type="file"
                accept="image/*"
                hidden
                className="hidden"
                onChange={handleImageUpload}
              />
            </label>
          </form>
        </FormProvider>
      </div>
    </div>
  );
};

export default ClientCreateOrEdit;
