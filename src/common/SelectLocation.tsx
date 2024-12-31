import { useAuthState } from '../store';
import { LocalStorageKey } from '../@types/enum';
import InputSelect from './inputs/InputSelect';
import { useEffect } from 'react';
import useFetchLocations from '../hooks/fetch/useFetchLocations';

const SelectLocation = ({
  selectedLocation,
  setSelectedLocation,
  selectedBranchId,
}: {
  selectedLocation: string;
  setSelectedLocation: React.Dispatch<React.SetStateAction<string>>;
  selectedBranchId?: string | null;
}) => {
  const { client } = useAuthState();

  const { data: locations } = useFetchLocations({
    clientId: client ? client.ClientId : null,
    branchId: selectedBranchId,
  });

  useEffect(() => {
    setSelectedLocation(
      localStorage.getItem(LocalStorageKey.SELECTED_LOCATION) || ''
    );
  }, []);

  return (
    <InputSelect
      placeholder="Select Location"
      value={selectedLocation}
      searchable
      onChange={(e) => {
        localStorage.setItem(LocalStorageKey.SELECTED_LOCATION, e as string);
        setSelectedLocation(e as string);
      }}
      data={[
        { label: 'All location', value: '' },
        ...locations.map((loc) => {
          return {
            label: loc.LocationName,
            value: loc.LocationId,
          };
        }),
      ]}
      limit={5}
    />
  );
};

export default SelectLocation;
