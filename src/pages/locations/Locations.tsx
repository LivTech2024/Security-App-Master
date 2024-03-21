import { useEffect, useState } from "react";
import AddLocationModal from "../../component/locations/modal/AddLocationModal";
import { useAuthState, useEditFormStore } from "../../store";
import { useDebouncedValue } from "@mantine/hooks";
import { useInfiniteQuery } from "@tanstack/react-query";
import {
  DisplayCount,
  MinimumQueryCharacter,
  REACT_QUERY_KEYS,
} from "../../@types/enum";
import DbCompany from "../../firebase_configs/DB/DbCompany";
import { DocumentData } from "firebase/firestore";
import { ILocationsCollection } from "../../@types/database";
import { useInView } from "react-intersection-observer";
import NoSearchResult from "../../common/NoSearchResult";
import TableShimmer from "../../common/shimmer/TableShimmer";
import { firebaseDataToObject } from "../../utilities/misc";
import { Location } from "../../store/slice/editForm.slice";

const Locations = () => {
  const [locationAddModal, setLocationAddModal] = useState(false);

  const { company } = useAuthState();

  const { setLocationEditData } = useEditFormStore();

  //const [query, setQuery] = useState("");

  const [debouncedQuery] = useDebouncedValue("", 200);

  const {
    data: snapshotData,
    fetchNextPage,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    isFetching,
    error,
  } = useInfiniteQuery({
    queryKey: [
      REACT_QUERY_KEYS.LOCATION_LIST,
      debouncedQuery,
      company!.CompanyId,
    ],
    queryFn: async ({ pageParam }) => {
      const snapshot = await DbCompany.getLocations({
        lmt: DisplayCount.LOCATION_LIST,
        lastDoc: pageParam,
        searchQuery: debouncedQuery,
        cmpId: company!.CompanyId,
      });
      return snapshot.docs;
    },
    getNextPageParam: (lastPage) => {
      if (lastPage?.length === 0) {
        return null;
      }
      if (lastPage?.length === DisplayCount.LOCATION_LIST) {
        return lastPage.at(-1);
      }
      return null;
    },
    initialPageParam: null as null | DocumentData,
    enabled:
      debouncedQuery.trim().length > 0 &&
      debouncedQuery.trim().length < MinimumQueryCharacter.LOCATION
        ? false
        : true,
  });

  const [data, setData] = useState<ILocationsCollection[]>(() => {
    if (snapshotData) {
      return snapshotData.pages.flatMap((page) =>
        page.map((doc) => doc.data() as ILocationsCollection)
      );
    }
    return [];
  });

  useEffect(() => {
    console.log(error, "error");
  }, [error]);

  // we are looping through the snapshot returned by react-query and converting them to data
  useEffect(() => {
    if (snapshotData) {
      const docData: ILocationsCollection[] = [];
      snapshotData.pages?.forEach((page) => {
        page?.forEach((doc) => {
          const data = doc.data() as ILocationsCollection;
          docData.push(data);
        });
      });
      setData(docData);
    }
  }, [snapshotData]);

  // hook for pagination
  const { ref, inView } = useInView();

  // this is for pagination
  useEffect(() => {
    if (inView && hasNextPage && !isFetching) {
      fetchNextPage();
    }
  }, [fetchNextPage, inView, hasNextPage, isFetching]);

  return (
    <div className="flex flex-col w-full h-full p-6 gap-6">
      <div className="flex justify-between w-full p-4 rounded bg-primaryGold text-surface items-center">
        <span className="font-semibold text-xl">Locations</span>

        <button
          onClick={() => {
            setLocationAddModal(true);
            setLocationEditData(null);
          }}
          className="bg-primary text-surface px-4 py-2 rounded"
        >
          Add Location
        </button>
      </div>
      <div className="hidden">
        <AddLocationModal
          opened={locationAddModal}
          setOpened={setLocationAddModal}
        />
      </div>

      <table className="rounded overflow-hidden w-full">
        <thead className="bg-primary text-surface text-sm">
          <tr>
            <th className="uppercase px-4 py-2 w-[25%] text-start">
              Location Name
            </th>
            <th className="uppercase px-4 py-2 w-[35%] text-start">Address</th>
            <th className="uppercase px-4 py-2 w-[20%] text-end">Latitude</th>
            <th className="uppercase px-4 py-2 w-[20%] text-end">Longitude</th>
          </tr>
        </thead>
        <tbody className="[&>*:nth-child(even)]:bg-[#5856560f]">
          {data.length === 0 && !isLoading ? (
            <tr>
              <td colSpan={4}>
                <NoSearchResult text="No location" />
              </td>
            </tr>
          ) : (
            data.map((loc) => {
              return (
                <tr
                  onClick={() => {
                    setLocationEditData(
                      firebaseDataToObject(
                        loc as unknown as Record<string, unknown>
                      ) as unknown as Location
                    );
                    setLocationAddModal(true);
                  }}
                  key={loc.LocationId}
                  className="cursor-pointer"
                >
                  <td className="px-4 py-2 align-top text-start">
                    {loc.LocationName}
                  </td>
                  <td className="px-4 py-2 align-top text-start">
                    <span className="line-clamp-3">{loc.LocationAddress}</span>
                  </td>
                  <td className="px-4 py-2 align-top text-end">
                    {loc.LocationCoordinates.latitude}
                  </td>
                  <td className="px-4 py-2 align-top text-end">
                    {loc.LocationCoordinates.longitude}
                  </td>
                </tr>
              );
            })
          )}
          <tr ref={ref}>
            <td colSpan={4}>
              {(isLoading || isFetchingNextPage) &&
                Array.from({ length: 10 }).map((_, idx) => (
                  <TableShimmer key={idx} />
                ))}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default Locations;
