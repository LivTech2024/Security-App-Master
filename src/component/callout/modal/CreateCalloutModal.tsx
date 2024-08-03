import React, { useEffect, useState } from 'react';
import Dialog from '../../../common/Dialog';
import InputSelect from '../../../common/inputs/InputSelect';
import useFetchLocations from '../../../hooks/fetch/useFetchLocations';
import { ILocationsCollection } from '../../../@types/database';
import useFetchEmployees from '../../../hooks/fetch/useFetchEmployees';
import { MdClose } from 'react-icons/md';
import InputDate from '../../../common/inputs/InputDate';
import CustomError, { errorHandler } from '../../../utilities/CustomError';
import {
  closeModalLoader,
  showModalLoader,
  showSnackbar,
} from '../../../utilities/TsxUtils';
import DbShift from '../../../firebase_configs/DB/DbShift';
import { useAuthState, useEditFormStore } from '../../../store';
import { useQueryClient } from '@tanstack/react-query';
import { REACT_QUERY_KEYS } from '../../../@types/enum';
import { toDate } from '../../../utilities/misc';

const CreateCalloutModal = ({
  opened,
  setOpened,
  setShouldRefetch,
}: {
  opened: boolean;
  setOpened: React.Dispatch<React.SetStateAction<boolean>>;
  setShouldRefetch?: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const queryClient = useQueryClient();

  const { company } = useAuthState();

  const { calloutEditData } = useEditFormStore();

  const isEdit = !!calloutEditData;

  const [locationSearchQuery, setLocationSearchQuery] = useState('');

  const { data: locations } = useFetchLocations({
    limit: 5,
    searchQuery: locationSearchQuery,
  });

  const [empSearchQuery, setEmpSearchQuery] = useState('');

  const { data: employees } = useFetchEmployees({
    limit: 5,
    searchQuery: empSearchQuery,
  });

  const [selectedLocation, setSelectedLocation] =
    useState<ILocationsCollection | null>(null);

  const [selectedEmployee, setSelectedEmployee] = useState('');

  const [assignedEmpsId, setAssignedEmpsId] = useState<
    { id: string; name: string }[]
  >([]);

  const [calloutDateTime, setCalloutDateTime] = useState<Date | null>(
    new Date()
  );

  useEffect(() => {
    if (selectedEmployee && selectedEmployee.length > 0) {
      setAssignedEmpsId((prev) => {
        if (prev.find((rec) => rec.id === selectedEmployee)) {
          return prev;
        }
        const empName = employees.find(
          (emp) => emp.EmployeeId === selectedEmployee
        )?.EmployeeName;
        return [...prev, { id: selectedEmployee, name: empName || '' }];
      });
    }
    setSelectedEmployee('');
    setEmpSearchQuery('');
  }, [selectedEmployee]);

  const resetForm = () => {
    setAssignedEmpsId([]);
    setCalloutDateTime(new Date());
    setSelectedLocation(null);
  };

  useEffect(() => {
    if (isEdit) {
      setSelectedLocation({
        LocationId: calloutEditData.CalloutLocationId,
        LocationName: calloutEditData.CalloutLocationName,
        LocationAddress: calloutEditData.CalloutLocationAddress,
        LocationCoordinates: calloutEditData.CalloutLocation,
      } as ILocationsCollection);
      setCalloutDateTime(toDate(calloutEditData.CalloutDateTime));
      setAssignedEmpsId(
        calloutEditData.CalloutStatus.map((res) => {
          return { id: res.StatusEmpId, name: res.StatusEmpName };
        })
      );
      return;
    }
    resetForm();
  }, [opened, isEdit]);

  const onSubmit = async () => {
    if (!company) return;
    try {
      if (!selectedLocation) {
        throw new CustomError('Please select location');
      }
      if (assignedEmpsId.length === 0) {
        throw new CustomError('Please assign a employee');
      }
      if (!calloutDateTime) {
        throw new CustomError('Please select date');
      }
      showModalLoader({});

      if (isEdit) {
        await DbShift.updateCallout({
          calloutId: calloutEditData.CalloutId,
          data: {
            CalloutDateTime: calloutDateTime,
            CalloutLocationName: selectedLocation?.LocationName,
            CalloutLocation: selectedLocation.LocationCoordinates,
            CalloutLocationAddress: selectedLocation.LocationAddress,
            CalloutLocationId: selectedLocation.LocationId,
          },
        });
        showSnackbar({
          message: 'Callout updated successfully',
          type: 'success',
        });
      } else {
        await DbShift.createCallout({
          cmpId: company.CompanyId,
          data: {
            assignedEmpsId,
            CalloutDateTime: calloutDateTime,
            CalloutLocationName: selectedLocation?.LocationName,
            CalloutLocation: selectedLocation.LocationCoordinates,
            CalloutLocationAddress: selectedLocation.LocationAddress,
            CalloutLocationId: selectedLocation.LocationId,
          },
        });
        showSnackbar({
          message: 'Callout created successfully',
          type: 'success',
        });
      }

      await queryClient.invalidateQueries({
        queryKey: [REACT_QUERY_KEYS.CALLOUT_LIST],
      });

      setShouldRefetch && setShouldRefetch((prev) => !prev);

      closeModalLoader();
      resetForm();
      setOpened(false);
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
      title="Create callout"
      isFormModal
      size="60%"
      positiveCallback={onSubmit}
    >
      <div className="grid grid-cols-2 gap-4">
        <InputSelect
          label="Select Location"
          searchable
          searchValue={locationSearchQuery}
          onSearchChange={(e) => {
            setLocationSearchQuery(e);

            const selectedLocation = locations.find(
              (loc) => loc.LocationName === e
            );

            if (selectedLocation) {
              setSelectedLocation(selectedLocation);
            } else {
              setSelectedLocation(null);
            }
          }}
          value={selectedLocation?.LocationId}
          data={locations.map((res) => {
            return { label: res.LocationName, value: res.LocationId };
          })}
          clearable
        />

        <InputDate
          type="date_time"
          label="Callout Time"
          value={calloutDateTime}
          setValue={setCalloutDateTime}
        />

        <InputSelect
          className="mx-0 w-full"
          label="Select employee"
          data={employees.map((res) => {
            return { label: res.EmployeeName, value: res.EmployeeId };
          })}
          value={selectedEmployee}
          searchValue={empSearchQuery}
          onSearchChange={setEmpSearchQuery}
          onChange={(e) => setSelectedEmployee(e as string)}
          searchable
          disabled={isEdit}
        />

        <div className="flex flex-col col-span-2">
          <span className="font-semibold">Assigned Employees:</span>

          <div className="flex flex-wrap gap-4 w-full">
            {assignedEmpsId.map((rec, idx) => {
              return (
                <span className="bg-onHoverBg p-2 rounded flex justify-between gap-4 w-full max-w-[200px]">
                  <span>
                    {idx + 1}. {rec.name}
                  </span>
                  <MdClose
                    className="text-textPrimaryRed text-xl cursor-pointer"
                    onClick={() => {
                      if (isEdit) {
                        showSnackbar({
                          message: 'Cannot edit assigned employees',
                          type: 'error',
                        });
                        return;
                      }
                      setAssignedEmpsId((prev) =>
                        prev.filter((i) => i.id !== rec.id)
                      );
                    }}
                  />
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </Dialog>
  );
};

export default CreateCalloutModal;
