import { useEffect, useState } from 'react';
import { useAuthState, useEditFormStore } from '../../store';
import { useDebouncedValue } from '@mantine/hooks';
import { useInfiniteQuery } from '@tanstack/react-query';
import {
  DisplayCount,
  MinimumQueryCharacter,
  PageRoutes,
  REACT_QUERY_KEYS,
} from '../../@types/enum';
import DbCompany from '../../firebase_configs/DB/DbCompany';
import { DocumentData } from 'firebase/firestore';
import { ILocationsCollection } from '../../@types/database';
import { useInView } from 'react-intersection-observer';
import NoSearchResult from '../../common/NoSearchResult';
import TableShimmer from '../../common/shimmer/TableShimmer';
import { Location } from '../../store/slice/editForm.slice';
import PageHeader from '../../common/PageHeader';
import Button from '../../common/button/Button';
import { useNavigate } from 'react-router-dom';
import { useJsApiLoader } from '@react-google-maps/api';
import { Library } from '@googlemaps/js-api-loader';

const libraries: Library[] = ['places'];

const Locations = () => {
  const navigate = useNavigate();

  const { company } = useAuthState();

  const { setLocationEditData } = useEditFormStore();

  //const [query, setQuery] = useState("");

  const [debouncedQuery] = useDebouncedValue('', 200);

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
    console.log(error, 'error');
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

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_JAVASCRIPT_API,
    libraries,
  });

  if (isLoaded)
    return (
      <div className="flex flex-col w-full h-full p-6 gap-6">
        <PageHeader
          title="Add Location"
          rightSection={
            <Button
              label="Add Location"
              onClick={() => {
                setLocationEditData(null);
                navigate(PageRoutes.LOCATION_CREATE_OR_EDIT);
              }}
              type="black"
            />
          }
        />

        <table className="rounded overflow-hidden w-full">
          <thead className="bg-primary text-surface text-sm">
            <tr>
              <th className="uppercase px-4 py-2 w-[20%] text-start">
                Location Name
              </th>
              <th className="uppercase px-4 py-2 w-[30%] text-start">
                Address
              </th>
              <th className="uppercase px-4 py-2 w-[20%] text-end">Latitude</th>
              <th className="uppercase px-4 py-2 w-[20%] text-end">
                Longitude
              </th>
            </tr>
          </thead>
          <tbody className="[&>*:nth-child(even)]:bg-[#5856560f]">
            {data.length === 0 && !isLoading ? (
              <tr>
                <td colSpan={5}>
                  <NoSearchResult text="No location" />
                </td>
              </tr>
            ) : (
              data.map((loc) => {
                return (
                  <tr
                    onClick={() => {
                      setLocationEditData(loc as unknown as Location);
                      navigate(PageRoutes.LOCATION_CREATE_OR_EDIT);
                    }}
                    key={loc.LocationId}
                    className="cursor-pointer"
                  >
                    <td className="px-4 py-2 align-top text-start">
                      {loc.LocationName}
                    </td>
                    <td className="px-4 py-2 align-top text-start">
                      <span className="line-clamp-3">
                        {loc.LocationAddress}
                      </span>
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
              <td colSpan={5}>
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
