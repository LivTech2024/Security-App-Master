import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ITrainingAndCertificationsCollection } from '../../@types/database';
import DbCompany from '../../firebase_configs/DB/DbCompany';
import NoSearchResult from '../../common/NoSearchResult';
import PageHeader from '../../common/PageHeader';
import { formatDate } from '../../utilities/misc';
import { numberFormatter } from '../../utilities/NumberFormater';

const TrainCertsView = () => {
  const [searchParam] = useSearchParams();

  const trainCertId = searchParam.get('id');

  const [loading, setLoading] = useState(true);

  const [data, setData] = useState<ITrainingAndCertificationsCollection | null>(
    null
  );

  useEffect(() => {
    if (!trainCertId) return;

    DbCompany.getTrainCertsById(trainCertId)
      .then((snapshot) => {
        const trainCertsData =
          snapshot.data() as ITrainingAndCertificationsCollection;
        setData(trainCertsData);
        setLoading(false);
      })
      .catch((err) => {
        console.log(err);
        setLoading(false);
      });
  }, [trainCertId]);

  if (!data && !loading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <NoSearchResult />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col w-full h-full p-6 gap-6 ">
        <PageHeader title="Training & Certifications Data" />

        <div className="h-[40vh] bg-shimmerColor w-full animate-pulse"></div>
      </div>
    );
  }

  if (data)
    return (
      <div className="flex flex-col w-full h-full p-6 gap-6">
        <PageHeader title="Training & Certifications Data" />

        <div className="bg-surface shadow rounded p-4 grid grid-cols-2 gap-x-4 gap-y-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold">Title:</span>
            <span>{data.TrainCertsTitle}</span>
          </div>
          <div className="flex items-center gap-2 ">
            <span className="font-semibold">Description:</span>
            <span className="line-clamp-2">{data.TrainCertsDescription}</span>
          </div>
          <div className="flex items-center gap-2 ">
            <span className="font-semibold">Start Date:</span>
            <span className="line-clamp-2">
              {formatDate(data.TrainCertsStartDate)}
            </span>
          </div>
          <div className="flex items-center gap-2 ">
            <span className="font-semibold">End Date:</span>
            <span className="line-clamp-2">
              {formatDate(data.TrainCertsEndDate)}
            </span>
          </div>
          <div className="flex items-center gap-2 ">
            <span className="font-semibold">No. of trainee enrolled:</span>
            <span className="line-clamp-2">
              {numberFormatter(data.TrainCertsTotalTrainee, false, 1)}
            </span>
          </div>
          <div className="flex items-center gap-2 ">
            <span className="font-semibold">
              No. of trainee completed training:
            </span>
            <span className="line-clamp-2">
              {numberFormatter(
                data.TrainCertsTotalTraineeCompletedTraining,
                false,
                1
              )}
            </span>
          </div>
          <div className="flex items-center gap-2 ">
            <span className="font-semibold">Duration:</span>
            <span className="line-clamp-2">
              {numberFormatter(data.TrainCertsDuration, false, 1)}
            </span>
          </div>
          <div className="flex items-center gap-2 ">
            <span className="font-semibold">Cost:</span>
            <span className="line-clamp-2">
              {numberFormatter(data.TrainCertsCost ?? 0, true)}
            </span>
          </div>
        </div>
      </div>
    );
};

export default TrainCertsView;
