import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import PageHeader from '../../common/PageHeader';
import NoSearchResult from '../../common/NoSearchResult';
import { IFLHACollection } from '../../@types/database';
import DbShift from '../../firebase_configs/DB/DbShift';
import { formatDate } from '../../utilities/misc';

const FLHAView = () => {
  const [searchParam] = useSearchParams();

  const flhaId = searchParam.get('id');

  const [loading, setLoading] = useState(true);

  const [data, setData] = useState<IFLHACollection | null>(null);

  useEffect(() => {
    if (!flhaId) return;
    DbShift.getFLHAById(flhaId).then((snap) => {
      const flhaData = snap.data() as IFLHACollection;
      if (flhaData) {
        setData(flhaData);
      }
      setLoading(false);
    });
  }, [flhaId]);

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
        <PageHeader title="Field Level Hazard Assessment" />

        <div className="h-[80vh] bg-shimmerColor w-full animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-full p-6 gap-6">
      <PageHeader title="Field Level Hazard Assessment" />
      <div className="bg-surface shadow-md rounded-lg p-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="font-semibold">Shift Name:</p>
            <p>{data?.FLHAShiftName || 'N/A'}</p>
          </div>
          <div>
            <p className="font-semibold">Shift Date:</p>
            <p>{data?.FLHADate ? formatDate(data?.FLHADate) : 'N/A'}</p>
          </div>
          <div>
            <p className="font-semibold">Shift Start Time:</p>
            <p>{data?.FLHAShiftStartTime || 'N/A'}</p>
          </div>
          <div>
            <p className="font-semibold">Shift End Time:</p>
            <p>{data?.FLHAShiftEndTime || 'N/A'}</p>
          </div>

          <div>
            <p className="font-semibold">Employee Name:</p>
            <p>{data?.FLHAEmployeeName || 'N/A'}</p>
          </div>
          <div>
            <p className="font-semibold">Location:</p>
            <p>{data?.FLHALocationName || 'N/A'}</p>
          </div>

          <div>
            <p className="font-semibold">Location Name:</p>
            <p>{data?.FLHALocationName || 'N/A'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FLHAView;
