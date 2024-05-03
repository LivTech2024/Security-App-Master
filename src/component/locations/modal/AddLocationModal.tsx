import React, { useEffect, useState } from 'react';
import Dialog from '../../../common/Dialog';
import PlacesAutocomplete, {
  geocodeByAddress,
  getLatLng,
} from 'react-places-autocomplete';
import InputHeader from '../../../common/inputs/InputHeader';
import InputWithTopHeader from '../../../common/inputs/InputWithTopHeader';
import { errorHandler } from '../../../utilities/CustomError';
import {
  closeModalLoader,
  showModalLoader,
  showSnackbar,
} from '../../../utilities/TsxUtils';
import DbCompany from '../../../firebase_configs/DB/DbCompany';
import { useAuthState, useEditFormStore } from '../../../store';
import { openContextModal } from '@mantine/modals';
import { REACT_QUERY_KEYS } from '../../../@types/enum';
import { useQueryClient } from '@tanstack/react-query';

const AddLocationModal = ({
  opened,
  setOpened,
}: {
  opened: boolean;
  setOpened: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const { company } = useAuthState();

  const { locationEditData } = useEditFormStore();

  const isEdit = !!locationEditData;

  const [locationName, setLocationName] = useState('');
  const [address, setAddress] = useState('');
  const [coordinates, setCoordinates] = useState<{
    lat: null | string;
    lng: null | string;
  }>({ lat: null, lng: null });

  const handleSelect = async (selectedAddress: string) => {
    try {
      setAddress(selectedAddress);
      const results = await geocodeByAddress(selectedAddress);
      const latLng = await getLatLng(results[0]);
      const { lat, lng } = latLng;
      setCoordinates({ lat: String(lat), lng: String(lng) });
    } catch (error) {
      console.error('Error selecting address', error);
    }
  };

  const queryClient = useQueryClient();

  const resetForm = () => {
    setAddress('');
    setLocationName('');
    setCoordinates({ lat: null, lng: null });
  };

  useEffect(() => {
    if (isEdit) {
      setAddress(locationEditData.LocationAddress);
      setLocationName(locationEditData.LocationName);
      setCoordinates({
        lat: String(locationEditData.LocationCoordinates.latitude),
        lng: String(locationEditData.LocationCoordinates.longitude),
      });
      return;
    }
    resetForm();
  }, [opened, isEdit, locationEditData]);

  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (!locationName) {
      showSnackbar({ message: 'Please enter location name', type: 'error' });
    }
    if (!address) {
      showSnackbar({ message: 'Please enter address', type: 'error' });
    }
    if (!coordinates.lat || !coordinates.lng) {
      showSnackbar({
        message: 'Please enter latitude and longitude',
        type: 'error',
      });
    }
    if (!company) return;
    try {
      setLoading(true);

      const formattedCoordinates = {
        lat: Number(coordinates.lat),
        lng: Number(coordinates.lng),
      };

      if (isEdit) {
        await DbCompany.updateLocation(
          locationEditData.LocationId,
          locationName,
          address,
          formattedCoordinates
        );
      } else {
        await DbCompany.addLocation(
          company.CompanyId,
          locationName,
          address,
          formattedCoordinates
        );
      }

      await queryClient.invalidateQueries({
        queryKey: [REACT_QUERY_KEYS.LOCATION_LIST],
      });
      setLoading(false);
      resetForm();
      setOpened(false);

      showSnackbar({ message: 'Location added successfully', type: 'success' });
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

      await DbCompany.deleteLocation(locationEditData.LocationId);

      await queryClient.invalidateQueries({
        queryKey: [REACT_QUERY_KEYS.LOCATION_LIST],
      });

      setLoading(false);
      resetForm();
      setOpened(false);
      showSnackbar({
        message: 'Location deleted successfully',
        type: 'success',
      });
    } catch (error) {
      errorHandler(error);
      setLoading(false);
      console.log(error);
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
      title="Add Location"
      size="50%"
      isFormModal
      disableSubmit={!coordinates.lat || !coordinates.lng}
      positiveCallback={onSubmit}
      negativeCallback={() =>
        isEdit
          ? openContextModal({
              modal: 'confirmModal',
              withCloseButton: false,
              centered: true,
              closeOnClickOutside: true,
              innerProps: {
                title: 'Confirm',
                body: 'Are you sure to delete this employee',
                onConfirm: () => {
                  onDelete();
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
          : setOpened(false)
      }
      negativeLabel={isEdit ? 'Delete' : 'Cancel'}
      positiveLabel={isEdit ? 'Update' : 'Save'}
    >
      <div className="flex flex-col gap-4">
        <InputWithTopHeader
          className="mx-0"
          value={locationName}
          onChange={(e) => setLocationName(e.target.value)}
          label="Name (It should be unique)"
        />
        <PlacesAutocomplete
          value={address}
          onChange={(val) => setAddress(val)}
          onSelect={handleSelect}
        >
          {({
            getInputProps,
            suggestions,
            getSuggestionItemProps,
            loading,
          }) => (
            <div className="flex flex-col gap-1">
              <InputHeader title="Search location" />
              <textarea
                cols={4}
                style={{ resize: 'none' }}
                {...getInputProps({
                  className:
                    'location-search-input py-2 px-2 rounded w-full text-lg outline-none border border-inputBorder focus-within:ring-[2px]',
                })}
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
                        backgroundColor: suggestion.active ? '#DAC0A3' : '#fff',
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
        <div className="flex items-center gap-4 w-full">
          <InputWithTopHeader
            className="mx-0 w-full"
            value={coordinates.lat || ''}
            onChange={(e) =>
              setCoordinates((prev) => {
                return {
                  ...prev,
                  lat: e.target.value,
                };
              })
            }
            label="Latitude"
          />
          <InputWithTopHeader
            className="mx-0 w-full"
            value={coordinates.lng || ''}
            onChange={(e) =>
              setCoordinates((prev) => {
                return {
                  ...prev,
                  lng: e.target.value,
                };
              })
            }
            label="Longitude"
          />
        </div>
      </div>
    </Dialog>
  );
};

export default AddLocationModal;
