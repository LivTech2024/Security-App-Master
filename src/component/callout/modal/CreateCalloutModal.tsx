import React, { useEffect, useState } from 'react';
import Dialog from '../../../common/Dialog';
import InputSelect from '../../../common/inputs/InputSelect';
import useFetchLocations from '../../../hooks/fetch/useFetchLocations';
import { ILocationsCollection } from '../../../@types/database';
import useFetchEmployees from '../../../hooks/fetch/useFetchEmployees';
import { MdClose } from 'react-icons/md';

const CreateCalloutModal = ({
  opened,
  setOpened,
}: {
  opened: boolean;
  setOpened: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
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

  return (
    <Dialog
      opened={opened}
      setOpened={setOpened}
      title="Create callout"
      isFormModal
      size="60%"
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
        />

        <div className="flex flex-col col-span-2">
          <span className="font-semibold">Assigned Employees:</span>

          <div className="flex flex-wrap gap-4  max-h-[120px] overflow-scroll remove-vertical-scrollbar py-2">
            {assignedEmpsId.map((rec, idx) => {
              return (
                <span className="bg-onHoverBg p-2 rounded flex justify-between gap-4 w-fit">
                  <span>
                    {idx + 1}. {rec.name}
                  </span>
                  <MdClose
                    className="text-textPrimaryRed text-xl cursor-pointer"
                    onClick={() =>
                      setAssignedEmpsId((prev) =>
                        prev.filter((i) => i.id !== rec.id)
                      )
                    }
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
