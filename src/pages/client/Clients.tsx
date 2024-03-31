import { useEffect, useState } from "react";
import Button from "../../common/button/Button";
import SearchBar from "../../common/inputs/SearchBar";
import { useAuthState, useEditFormStore } from "../../store";
import { useDebouncedValue } from "@mantine/hooks";
import DbClient from "../../firebase_configs/DB/DbClient";
import {
  DisplayCount,
  MinimumQueryCharacter,
  REACT_QUERY_KEYS,
} from "../../@types/enum";
import { useInfiniteQuery } from "@tanstack/react-query";
import { DocumentData } from "firebase/firestore";
import { IClientsCollection } from "../../@types/database";
import { useInView } from "react-intersection-observer";
import NoSearchResult from "../../common/NoSearchResult";
import TableShimmer from "../../common/shimmer/TableShimmer";
import AddClientModal from "../../component/client/modal/AddClientModal";
import { numberFormatter } from "../../utilities/NumberFormater";
import { Client } from "../../store/slice/editForm.slice";

const Clients = () => {
  const { company } = useAuthState();

  const { setClientEditData } = useEditFormStore();

  const [query, setQuery] = useState("");

  const [addClientModal, setAddClientModal] = useState(false);

  const [debouncedQuery] = useDebouncedValue(query, 200);

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
      REACT_QUERY_KEYS.CLIENT_LIST,
      debouncedQuery,
      company!.CompanyId,
    ],
    queryFn: async ({ pageParam }) => {
      const snapshot = await DbClient.getClients({
        lmt: DisplayCount.CLIENT_LIST,
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
      if (lastPage?.length === DisplayCount.CLIENT_LIST) {
        return lastPage.at(-1);
      }
      return null;
    },
    initialPageParam: null as null | DocumentData,
    enabled:
      debouncedQuery.trim().length > 0 &&
      debouncedQuery.trim().length < MinimumQueryCharacter.CLIENT
        ? false
        : true,
  });

  const [data, setData] = useState<IClientsCollection[]>(() => {
    if (snapshotData) {
      return snapshotData.pages.flatMap((page) =>
        page.map((doc) => doc.data() as IClientsCollection)
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
      const docData: IClientsCollection[] = [];
      snapshotData.pages?.forEach((page) => {
        page?.forEach((doc) => {
          const data = doc.data() as IClientsCollection;
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
        <span className="font-semibold text-xl">Clients</span>

        <div className="flex items-center gap-4">
          <Button
            type="black"
            label="Create new client"
            onClick={() => {
              setClientEditData(null);
              setAddClientModal(true);
            }}
            className="px-4 py-2"
          />
        </div>
      </div>

      <div className="flex items-center bg-surface shadow p-4 rounded w-full justify-between">
        <SearchBar
          value={query}
          setValue={setQuery}
          placeholder="Search client"
        />
      </div>

      <AddClientModal opened={addClientModal} setOpened={setAddClientModal} />

      <table className="rounded overflow-hidden w-full">
        <thead className="bg-primary text-surface text-sm">
          <tr>
            <th className="uppercase px-4 py-2 w-[20%] text-start">
              Client Name
            </th>
            <th className="uppercase px-4 py-2 w-[20%] text-start">Email</th>
            <th className="uppercase px-4 py-2 w-[15%] text-start">Phone</th>
            <th className="uppercase px-4 py-2 w-[30%] text-start">Address</th>
            <th className="uppercase px-4 py-2 w-[15%] text-end">Balance</th>
          </tr>
        </thead>
        <tbody className="[&>*:nth-child(even)]:bg-[#5856560f]">
          {data.length === 0 && !isLoading ? (
            <tr>
              <td colSpan={5}>
                <NoSearchResult text="No clients" />
              </td>
            </tr>
          ) : (
            data.map((client) => {
              return (
                <tr
                  key={client.ClientId}
                  onClick={() => {
                    setClientEditData(client as unknown as Client);
                    setAddClientModal(true);
                  }}
                  className="cursor-pointer"
                >
                  <td className="align-top px-4 py-2 text-start">
                    {client.ClientName}
                  </td>
                  <td className="align-top px-4 py-2 text-start">
                    {client.ClientEmail}
                  </td>
                  <td className="align-top px-4 py-2 text-start">
                    {client.ClientPhone}
                  </td>
                  <td className="align-top px-4 py-2 text-start">
                    <span className="line-clamp-3">{client.ClientAddress}</span>
                  </td>
                  <td className="align-top px-4 py-2 text-end ">
                    {numberFormatter(client.ClientBalance, true)}
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

export default Clients;
