import { openContextModal } from '@mantine/modals';
import PageHeader from '../../common/PageHeader';
import Button from '../../common/button/Button';
import { useAuthState, useEditFormStore } from '../../store';
import {
  closeModalLoader,
  showModalLoader,
  showSnackbar,
} from '../../utilities/TsxUtils';
import { useEffect, useState } from 'react';
import { errorHandler } from '../../utilities/CustomError';
import { useQueryClient } from '@tanstack/react-query';
import DbCompany from '../../firebase_configs/DB/DbCompany';
import { PageRoutes, REACT_QUERY_KEYS } from '../../@types/enum';
import {
  LocationCreateFormFields,
  locationCreateSchema,
} from '../../utilities/zod/schema';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import InputWithTopHeader from '../../common/inputs/InputWithTopHeader';
import TextareaWithTopHeader from '../../common/inputs/TextareaWithTopHeader';
import InputDate from '../../common/inputs/InputDate';
import InputHeader from '../../common/inputs/InputHeader';
import InputSelect from '../../common/inputs/InputSelect';
import useFetchClients from '../../hooks/fetch/useFetchClients';
import dayjs from 'dayjs';
import { removeTimeFromDate, toDate } from '../../utilities/misc';
import DbClient from '../../firebase_configs/DB/DbClient';
import { IClientsCollection } from '../../@types/database';
import { useNavigate } from 'react-router-dom';

const LocationCreateOrEdit = () => {
  const { company } = useAuthState();

  const { locationEditData } = useEditFormStore();

  const isEdit = !!locationEditData;

  const methods = useForm<LocationCreateFormFields>({
    resolver: zodResolver(locationCreateSchema),
    defaultValues: isEdit
      ? {
          LocationName: locationEditData?.LocationName,
          LocationAddress: locationEditData?.LocationAddress,
          LocationClientId: locationEditData?.LocationClientId,
          LocationContractAmount: locationEditData?.LocationContractAmount || 0,
          LocationHourlyRate: locationEditData?.LocationHourlyRate || 0,
          LocationCoordinates: {
            lat: String(locationEditData?.LocationCoordinates.latitude),
            lng: String(locationEditData?.LocationCoordinates.longitude),
          },
        }
      : undefined,
  });

  const queryClient = useQueryClient();

  const [loading, setLoading] = useState(false);

  const [contractStartDate, setContractStartDate] = useState<Date | null>(
    new Date()
  );
  const [contractEndDate, setContractEndDate] = useState<Date | null>(
    dayjs().add(1, 'month').toDate()
  );

  const [postOrderData, setPostOrderData] = useState<{
    PostOrderPdf: string | File;
    PostOrderTitle: string;
  } | null>(null);

  const [clientSearchQuery, setClientSearchQuery] = useState('');

  const { data: clients } = useFetchClients({
    limit: 5,
    searchQuery: clientSearchQuery,
  });

  useEffect(() => {
    if (isEdit) {
      setContractStartDate(
        toDate(locationEditData?.LocationContractStartDate || new Date())
      );
      setContractEndDate(
        toDate(locationEditData?.LocationContractEndDate || new Date())
      );

      if (
        locationEditData?.LocationPostOrder &&
        locationEditData?.LocationPostOrder.PostOrderPdf
      ) {
        setPostOrderData({
          PostOrderPdf: locationEditData?.LocationPostOrder?.PostOrderPdf,
          PostOrderTitle: locationEditData?.LocationPostOrder?.PostOrderTitle,
        });
      }
      if (locationEditData.LocationClientId) {
        DbClient.getClientById(locationEditData?.LocationClientId).then(
          (snapshot) => {
            const data = snapshot.data() as IClientsCollection;
            const { ClientName } = data;
            setClientSearchQuery(ClientName);
          }
        );
      }
      return;
    }
    setContractStartDate(null);
    setContractEndDate(null);
    setPostOrderData(null);
  }, [isEdit]);

  useEffect(() => {
    if (!contractStartDate) return;
    methods.setValue(
      'LocationContractStartDate',
      removeTimeFromDate(contractStartDate)
    );
  }, [contractStartDate]);

  useEffect(() => {
    if (!contractEndDate) return;
    methods.setValue(
      'LocationContractEndDate',
      removeTimeFromDate(contractEndDate)
    );
  }, [contractEndDate]);

  const navigate = useNavigate();

  const onSubmit = async (data: LocationCreateFormFields) => {
    if (!company) return;
    try {
      setLoading(true);

      if (isEdit) {
        await DbCompany.updateLocation(
          locationEditData?.LocationId,
          data,
          postOrderData
        );
      } else {
        await DbCompany.addLocation(company.CompanyId, data, postOrderData);
      }

      await queryClient.invalidateQueries({
        queryKey: [REACT_QUERY_KEYS.LOCATION_LIST],
      });
      setLoading(false);
      methods.reset();
      showSnackbar({
        message: 'Location added successfully',
        type: 'success',
      });
      navigate(PageRoutes.LOCATIONS);
    } catch (error) {
      errorHandler(error);
      setLoading(false);
      console.log(error);
    }
  };

  const onDelete = async () => {
    if (!company || !isEdit) return;
    try {
      setLoading(true);

      await DbCompany.deleteLocation(locationEditData?.LocationId);

      await queryClient.invalidateQueries({
        queryKey: [REACT_QUERY_KEYS.LOCATION_LIST],
      });

      setLoading(false);
      methods.reset();

      showSnackbar({
        message: 'Location deleted successfully',
        type: 'success',
      });
      navigate(PageRoutes.LOCATIONS);
    } catch (error) {
      errorHandler(error);
      setLoading(false);
      console.log(error);
    }
  };

  const handlePdfChange = (file: File) => {
    setPostOrderData((prev) => {
      if (prev) {
        return { ...prev, PostOrderPdf: file };
      }
      return { PostOrderPdf: file, PostOrderTitle: '' };
    });
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
      <PageHeader
        title="Create location"
        rightSection={
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
                      body: 'Are you sure to delete this location',
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
        }
      />

      <div className="grid grid-cols-3 gap-4 p-4 bg-surface shadow rounded">
        <InputWithTopHeader
          className="mx-0"
          label="Name (It should be unique)"
          register={methods.register}
          name="LocationName"
          error={methods.formState.errors.LocationName?.message}
        />
        <InputWithTopHeader
          className="mx-0"
          label="Latitude"
          register={methods.register}
          name="LocationCoordinates.lat"
          error={methods.formState.errors.LocationCoordinates?.lat?.message}
        />
        <InputWithTopHeader
          className="mx-0"
          label="Longitude"
          register={methods.register}
          name="LocationCoordinates.lng"
          error={methods.formState.errors.LocationCoordinates?.lng?.message}
        />
        <TextareaWithTopHeader
          title="Address"
          className="mx-0"
          register={methods.register}
          name="LocationAddress"
          error={methods.formState.errors.LocationAddress?.message}
        />
        <div className="flex flex-col col-span-2 w-full gap-4 justify-between">
          <div className="grid grid-cols-2 w-full gap-4">
            <InputSelect
              label="Select Client"
              data={clients.map((res) => {
                return { label: res.ClientName, value: res.ClientId };
              })}
              value={methods.watch('LocationClientId')}
              onChange={(e) =>
                methods.setValue('LocationClientId', e as string)
              }
              searchable
              searchValue={clientSearchQuery}
              onSearchChange={setClientSearchQuery}
              error={methods.formState.errors.LocationClientId?.message}
            />

            <div className="flex items-center gap-4">
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
            </div>
          </div>
          <div className="grid grid-cols-2 w-full gap-4">
            <InputWithTopHeader
              label="Contract Amount"
              className="mx-0"
              register={methods.register}
              name="LocationContractAmount"
              decimalCount={2}
              error={methods.formState.errors.LocationContractAmount?.message}
              leadingIcon={<div>$</div>}
            />
            <InputWithTopHeader
              label="Client hourly rate"
              className="mx-0"
              register={methods.register}
              name="LocationHourlyRate"
              decimalCount={2}
              error={methods.formState.errors.LocationHourlyRate?.message}
              leadingIcon={<div>$</div>}
            />
          </div>
        </div>

        <div className="flex flex-col gap-4 col-span-2 bg-onHoverBg p-4 rounded">
          <div className="font-semibold">Post Order Details</div>
          <div className="flex gap-4 items-center">
            <label
              htmlFor="fileUpload"
              className="flex flex-col gap-1 cursor-pointer w-full"
            >
              <InputHeader title="Upload post order pdf" fontClassName="" />
              <div className="flex gap-4 items-center w-full">
                {typeof postOrderData?.PostOrderPdf === 'string' &&
                  postOrderData?.PostOrderPdf.startsWith('https') && (
                    <a
                      href={postOrderData?.PostOrderPdf}
                      target="_blank"
                      className=" text-textPrimaryBlue cursor-pointer"
                    >
                      View Post Order
                    </a>
                  )}
                <input
                  id="fileUpload"
                  type="file"
                  accept="application/pdf"
                  className={`border border-gray-300 p-2 rounded cursor-pointer w-full`}
                  onChange={(e) => handlePdfChange(e.target.files?.[0] as File)}
                />
              </div>
            </label>
            {/* Post Order Title Input */}
            <InputWithTopHeader
              className="mx-0 w-full"
              label="Post Order Title"
              value={postOrderData?.PostOrderTitle}
              onChange={(e) =>
                setPostOrderData((prev) => {
                  if (prev) {
                    return { ...prev, PostOrderTitle: e.target.value };
                  }
                  return {
                    PostOrderTitle: e.target.value,
                    PostOrderPdf: '',
                  };
                })
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationCreateOrEdit;
