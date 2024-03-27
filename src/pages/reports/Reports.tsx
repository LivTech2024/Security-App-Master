import { useState } from "react";
import DateFilterDropdown from "../../common/dropdown/DateFilterDropdown";
import dayjs from "dayjs";
import useFetchLocations from "../../hooks/fetch/useFetchLocations";
import InputAutoComplete from "../../common/inputs/InputAutocomplete";
import NoSearchResult from "../../common/NoSearchResult";

const Reports = () => {
  const [startDate, setStartDate] = useState<Date | string | null>(
    dayjs().startOf("M").toDate()
  );

  const [endDate, setEndDate] = useState<Date | string | null>(
    dayjs().endOf("M").toDate()
  );

  const [isLifetime, setIsLifetime] = useState(false);

  const [location, setLocation] = useState<string | null | undefined>("");

  const { data: locations } = useFetchLocations({
    limit: 5,
    searchQuery: location,
  });
  return (
    <div className="flex flex-col w-full h-full p-6 gap-6">
      <div className="flex justify-between w-full p-4 rounded bg-primaryGold text-surface items-center">
        <span className="font-semibold text-xl">Reports</span>
      </div>
      <div className="flex items-center justify-between w-full gap-4 p-4 rounded bg-surface shadow">
        <DateFilterDropdown
          endDate={endDate}
          isLifetime={isLifetime}
          setEndDate={setEndDate}
          setIsLifetime={setIsLifetime}
          setStartDate={setStartDate}
          startDate={startDate}
        />
        <InputAutoComplete
          placeholder="Select location"
          value={location}
          data={locations.map((res) => {
            return { label: res.LocationName, value: res.LocationName };
          })}
          onChange={setLocation}
        />
      </div>
      <div className="flex flex-col gap-4 p-4 bg-surface shadow rounded">
        <NoSearchResult text="No reports found" />
      </div>
    </div>
  );
};

export default Reports;
