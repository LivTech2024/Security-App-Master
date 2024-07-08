import { useNavigate } from 'react-router-dom';
import Button from '../../common/button/Button';
import PageHeader from '../../common/PageHeader';
import {
  DisplayCount,
  MinimumQueryCharacter,
  PageRoutes,
  REACT_QUERY_KEYS,
} from '../../@types/enum';
import { useEffect, useState } from 'react';
import { useDebouncedValue } from '@mantine/hooks';
import { useInfiniteQuery } from '@tanstack/react-query';
import { DocumentData } from 'firebase/firestore';
import { ITrainingAndCertificationsCollection } from '../../@types/database';
import DbCompany from '../../firebase_configs/DB/DbCompany';
import SearchBar from '../../common/inputs/SearchBar';
import NoSearchResult from '../../common/NoSearchResult';
import TableShimmer from '../../common/shimmer/TableShimmer';
import { useInView } from 'react-intersection-observer';
import { numberFormatter } from '../../utilities/NumberFormater';

const TrainCertsList = () => {
  const navigate = useNavigate();

  const [query, setQuery] = useState('');

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
    queryKey: [REACT_QUERY_KEYS.TRAIN_CERTS_LIST, debouncedQuery],
    queryFn: async ({ pageParam }) => {
      const snapshot = await DbCompany.getTrainCerts({
        lmt: DisplayCount.TRAIN_CERTS_LIST,
        lastDoc: pageParam,
        searchQuery: debouncedQuery,
      });
      return snapshot.docs;
    },
    getNextPageParam: (lastPage) => {
      if (lastPage?.length === 0) {
        return null;
      }
      if (lastPage?.length === DisplayCount.TRAIN_CERTS_LIST) {
        return lastPage.at(-1);
      }
      return null;
    },
    initialPageParam: null as null | DocumentData,
    enabled:
      debouncedQuery.trim().length > 0 &&
      debouncedQuery.trim().length < MinimumQueryCharacter.TRAIN_CERTS
        ? false
        : true,
  });

  const [data, setData] = useState<ITrainingAndCertificationsCollection[]>(
    () => {
      if (snapshotData) {
        return snapshotData.pages.flatMap((page) =>
          page.map((doc) => doc.data() as ITrainingAndCertificationsCollection)
        );
      }
      return [];
    }
  );

  useEffect(() => {
    console.log(error, 'error');
  }, [error]);

  // we are looping through the snapshot returned by react-query and converting them to data
  useEffect(() => {
    if (snapshotData) {
      const docData: ITrainingAndCertificationsCollection[] = [];
      snapshotData.pages?.forEach((page) => {
        page?.forEach((doc) => {
          const data = doc.data() as ITrainingAndCertificationsCollection;
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
      <PageHeader
        title="Training & Certifications"
        rightSection={
          <Button
            label="Create New Training & Certifications"
            type="black"
            onClick={() => {
              navigate(PageRoutes.TRAINING_AND_CERTIFICATION_CREATE_OR_EDIT);
            }}
          />
        }
      />

      <div className="flex items-center bg-surface shadow p-4 rounded w-full justify-between">
        <SearchBar
          value={query}
          setValue={setQuery}
          placeholder="Search training & certifications"
        />
      </div>

      <table className="rounded overflow-hidden w-full">
        <thead className="bg-primary text-surface text-sm">
          <tr>
            <th className="uppercase px-4 py-2 w-[20%] text-start">Title</th>
            <th className="uppercase px-4 py-2 w-[30%] text-start">
              Description
            </th>
            <th className="uppercase px-4 py-2 w-[10%] text-start">Category</th>

            <th className="uppercase px-4 py-2 w-[20%] text-end">
              Total Trainee Enrolled
            </th>
            <th className="uppercase px-4 py-2 w-[20%] text-end">
              Total Trainee Completed
            </th>
          </tr>
        </thead>
        <tbody className="[&>*:nth-child(even)]:bg-[#5856560f]">
          {data.length === 0 && !isLoading ? (
            <tr>
              <td colSpan={5}>
                <NoSearchResult />
              </td>
            </tr>
          ) : (
            data.map((trainCerts) => {
              return (
                <tr
                  onClick={() =>
                    navigate(
                      PageRoutes.TRAINING_AND_CERTIFICATION_CREATE_OR_EDIT
                    )
                  }
                  key={trainCerts.TrainCertsId}
                  className="cursor-pointer"
                >
                  <td className="align-top px-4 py-2 text-start">
                    <span className="line-clamp-2">
                      {trainCerts.TrainCertsTitle}
                    </span>
                  </td>
                  <td className="align-top px-4 py-2 text-start">
                    <span className="line-clamp-3">
                      {trainCerts.TrainCertsDescription || 'N/A'}
                    </span>
                  </td>

                  <td className="align-top px-4 py-2 text-start">
                    <span className="line-clamp-2">
                      {trainCerts.TrainCertsCategory}
                    </span>
                  </td>

                  <td className="align-top px-4 py-2 text-end">
                    <span className="line-clamp-2">
                      {numberFormatter(
                        trainCerts.TrainCertsTotalTrainee,
                        false,
                        1
                      )}
                    </span>
                  </td>
                  <td className="align-top px-4 py-2 text-end">
                    <span className="line-clamp-2">
                      {numberFormatter(
                        trainCerts.TrainCertsTotalTraineeCompletedTraining,
                        false,
                        1
                      )}
                    </span>
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

export default TrainCertsList;
