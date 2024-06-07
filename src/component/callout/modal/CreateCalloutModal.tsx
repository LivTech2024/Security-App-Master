import React, { useState } from 'react';
import Dialog from '../../../common/Dialog';
import InputSelect from '../../../common/inputs/InputSelect';
import useFetchLocations from '../../../hooks/fetch/useFetchLocations';
import { ILocationsCollection } from '../../../@types/database';

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

  const [selectedLocation, setSelectedLocation] =
    useState<ILocationsCollection | null>(null);

  return (
    <Dialog
      opened={opened}
      setOpened={setOpened}
      title="Create callout"
      isFormModal
    >
      <div className="grid grid-cols-2">
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
      </div>
    </Dialog>
  );
};

export default CreateCalloutModal;
