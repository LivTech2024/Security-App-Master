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
import InputDate from '../../common/inputs/InputDate';
import InputHeader from '../../common/inputs/InputHeader';
import InputSelect from '../../common/inputs/InputSelect';
import useFetchClients from '../../hooks/fetch/useFetchClients';
import dayjs from 'dayjs';
import { removeTimeFromDate, toDate } from '../../utilities/misc';
import DbClient from '../../firebase_configs/DB/DbClient';
import { IClientsCollection } from '../../@types/database';
import { useNavigate } from 'react-router-dom';
import PlacesAutocomplete, {
  geocodeByAddress,
  getLatLng,
} from 'react-places-autocomplete';
import TextareaWithTopHeader from '../../common/inputs/TextareaWithTopHeader';
import { useJsApiLoader } from '@react-google-maps/api';
import { Library } from '@googlemaps/js-api-loader';
import SwitchWithSideHeader from '../../common/switch/SwitchWithSideHeader';
import { MdAccessTime, MdKeyboardArrowRight } from 'react-icons/md';

const libraries: Library[] = ['places'];

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
          LocationPatrolPerHitRate:
            locationEditData?.LocationPatrolPerHitRate || 0,
          LocationShiftHourlyRate:
            locationEditData?.LocationShiftHourlyRate || 0,
          LocationCoordinates: {
            lat: String(locationEditData?.LocationCoordinates.latitude),
            lng: String(locationEditData?.LocationCoordinates.longitude),
          },
          LocationManagerName: locationEditData.LocationManagerName,
          LocationManagerEmail: locationEditData.LocationManagerEmail,
          LocationSendEmailToClient: locationEditData.LocationSendEmailToClient,
          LocationSendEmailForEachPatrol:
            locationEditData.LocationSendEmailForEachPatrol,
          LocationSendEmailForEachShift:
            locationEditData.LocationSendEmailForEachShift,
          LocationCalloutDetails: {
            CalloutCostInitialCost:
              locationEditData?.LocationCalloutDetails
                ?.CalloutCostInitialCost || 45,
            CalloutCostInitialMinutes:
              locationEditData?.LocationCalloutDetails
                ?.CalloutCostInitialMinutes || 30,
            CalloutCostPerHour:
              locationEditData?.LocationCalloutDetails?.CalloutCostPerHour ||
              45,
          },
        }
      : {
          LocationSendEmailForEachPatrol: true,
          LocationSendEmailForEachShift: true,
          LocationSendEmailToClient: true,
          LocationCalloutDetails: {
            CalloutCostInitialCost: 45,
            CalloutCostInitialMinutes: 30,
            CalloutCostPerHour: 45,
          },
        },
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

  const handleSelect = async (selectedAddress: string) => {
    try {
      methods.setValue('LocationAddress', selectedAddress);
      const results = await geocodeByAddress(selectedAddress);
      const latLng = await getLatLng(results[0]);
      const { lat, lng } = latLng;
      methods.setValue('LocationCoordinates', {
        lat: String(lat),
        lng: String(lng),
      });
    } catch (error) {
      console.error('Error selecting address', error);
    }
  };

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_JAVASCRIPT_API,
    libraries,
  });

  if (isLoaded)
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

        <div className="grid grid-cols-3 items- gap-4 p-4 bg-surface shadow rounded">
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
          <PlacesAutocomplete
            value={methods.watch('LocationAddress')}
            onChange={(val) => methods.setValue('LocationAddress', val)}
            onSelect={handleSelect}
          >
            {({
              getInputProps,
              suggestions,
              getSuggestionItemProps,
              loading,
            }) => (
              <div className="flex flex-col gap-1 ">
                <TextareaWithTopHeader
                  title="Address"
                  className="mx-0"
                  value={getInputProps().value}
                  onChange={getInputProps().onChange}
                  error={methods.formState.errors.LocationAddress?.message}
                />
                {suggestions.length > 0 && (
                  <div className="relative">
                    <div className="autocomplete-dropdown-container rounded-b-2xl border absolute max-h-[200px] w-full overflow-scroll remove-vertical-scrollbar">
                      {loading && (
                        <div className="cursor-pointer py-2 px-2 bg-white">
                          Loading...
                        </div>
                      )}
                      {suggestions.map((suggestion) => {
                        const style = {
                          backgroundColor: suggestion.active
                            ? '#DAC0A3'
                            : '#fff',
                        };
                        return (
                          <div
                            className="cursor-pointer py-2 px-2"
                            {...getSuggestionItemProps(suggestion, { style })}
                          >
                            {suggestion.description}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </PlacesAutocomplete>
          <div className="flex flex-col gap-4 justify-between">
            <InputDate
              label="Contract Start Date"
              value={contractStartDate}
              setValue={setContractStartDate}
            />
            <InputSelect
              label="Select Client"
              data={clients.map((res) => {
                return { label: res.ClientName, value: res.ClientId };
              })}
              value={methods.watch('LocationClientId')}
              onChange={(e) =>
                methods.setValue('LocationClientId', e as string)
              }
              clearable
              searchable
              searchValue={clientSearchQuery}
              onSearchChange={setClientSearchQuery}
              error={methods.formState.errors.LocationClientId?.message}
            />
          </div>

          <div className="flex flex-col gap-4 justify-between">
            <InputDate
              label="Contract End Date"
              value={contractEndDate}
              setValue={setContractEndDate}
            />
            <InputWithTopHeader
              label="Contract Amount"
              className="mx-0"
              register={methods.register}
              name="LocationContractAmount"
              decimalCount={2}
              error={methods.formState.errors.LocationContractAmount?.message}
              leadingIcon={<div>$</div>}
            />
          </div>

          <InputWithTopHeader
            label="Patrol Per Hit Rate"
            className="mx-0"
            register={methods.register}
            name="LocationPatrolPerHitRate"
            decimalCount={2}
            error={methods.formState.errors.LocationPatrolPerHitRate?.message}
            leadingIcon={<div>$</div>}
          />
          <InputWithTopHeader
            label="Shift Hourly Rate"
            className="mx-0"
            register={methods.register}
            name="LocationShiftHourlyRate"
            decimalCount={2}
            error={methods.formState.errors.LocationShiftHourlyRate?.message}
            leadingIcon={<div>$</div>}
          />

          <div>&nbsp;</div>

          <InputWithTopHeader
            label="Location Manager Name"
            className="mx-0"
            register={methods.register}
            name="LocationManagerName"
            error={methods.formState.errors.LocationManagerName?.message}
          />
          <InputWithTopHeader
            label="Location Manager Email"
            className="mx-0"
            register={methods.register}
            name="LocationManagerEmail"
            error={methods.formState.errors.LocationManagerEmail?.message}
          />
          <div>&nbsp;</div>
          <SwitchWithSideHeader
            label="Send email for each patrol"
            className="bg-onHoverBg px-4 py-2 h-fit align-bottom rounded w-full"
            register={methods.register}
            name="LocationSendEmailForEachPatrol"
            errors={
              methods.formState.errors?.LocationSendEmailForEachPatrol?.message
            }
          />

          <SwitchWithSideHeader
            label="Send email for each shift"
            className="bg-onHoverBg px-4 py-2 h-fit align-bottom rounded w-full"
            register={methods.register}
            name="LocationSendEmailForEachShift"
            errors={
              methods.formState.errors?.LocationSendEmailForEachShift?.message
            }
          />

          <SwitchWithSideHeader
            label="Send email to client"
            className="bg-onHoverBg px-4 py-2 h-fit align-bottom rounded w-full"
            register={methods.register}
            name="LocationSendEmailToClient"
            errors={
              methods.formState.errors?.LocationSendEmailToClient?.message
            }
          />

          <div className="col-span-3 flex flex-col gap-4">
            <div className="font-semibold">Callout Details</div>
            <div className="flex items-center gap-4">
              <InputWithTopHeader
                className="mx-0"
                register={methods.register}
                name="LocationCalloutDetails.CalloutCostInitialCost"
                error={
                  methods.formState.errors.LocationCalloutDetails
                    ?.CalloutCostInitialCost?.message
                }
                leadingIcon={<div>$</div>}
                tailIcon={<MdKeyboardArrowRight className="w-6 h-6" />}
                decimalCount={2}
              />
              <span className="font-semibold text-textSecondary">
                For First
              </span>
              <InputWithTopHeader
                className="mx-0"
                register={methods.register}
                name="LocationCalloutDetails.CalloutCostInitialMinutes"
                error={
                  methods.formState.errors.LocationCalloutDetails
                    ?.CalloutCostInitialMinutes?.message
                }
                leadingIcon={<MdAccessTime className="size-5" />}
                tailIcon={<MdKeyboardArrowRight className="w-6 h-6" />}
                decimalCount={2}
              />
              <span className="font-semibold text-textSecondary">
                Minutes, Then
              </span>
              <InputWithTopHeader
                className="mx-0"
                register={methods.register}
                name="LocationCalloutDetails.CalloutCostPerHour"
                error={
                  methods.formState.errors.LocationCalloutDetails
                    ?.CalloutCostPerHour?.message
                }
                leadingIcon={<div>$</div>}
                tailIcon={<MdKeyboardArrowRight className="w-6 h-6" />}
                decimalCount={2}
              />
              <span className="font-semibold text-textSecondary">Per Hour</span>
            </div>
          </div>

          <div className="flex flex-col gap-4 col-span-3 bg-onHoverBg p-4 rounded">
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
                    onChange={(e) =>
                      handlePdfChange(e.target.files?.[0] as File)
                    }
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
