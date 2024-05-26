import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { IVisitorsCollection } from '../../@types/database';
import DbCompany from '../../firebase_configs/DB/DbCompany';
import NoSearchResult from '../../common/NoSearchResult';
import PageHeader from '../../common/PageHeader';
import { formatDate } from '../../utilities/misc';

const VisitorView = () => {
  const [searchParam] = useSearchParams();

  const visitorId = searchParam.get('id');

  const [loading, setLoading] = useState(true);

  const [data, setData] = useState<IVisitorsCollection | null>(null);

  useEffect(() => {
    if (!visitorId) return;
    DbCompany?.getVisitorById(visitorId).then((snapshot) => {
      const reportData = snapshot.data() as IVisitorsCollection;
      if (reportData) {
        setData(reportData);
      }
      setLoading(false);
    });
  }, [visitorId]);

  if (!data && !loading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <NoSearchResult />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col w-full h-full p-6 gap-6 animate-pulse">
        <PageHeader title="Visitor Data" />
        <div className="h-[40vh] bg-shimmerColor w-full"></div>
      </div>
    );
  }
  if (data)
    return (
      <div className="flex flex-col w-full h-full p-6 gap-6">
        <PageHeader title="Visitor Data" />

        <div className="bg-surface shadow-md rounded-lg p-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-4">
              <p className="font-semibold flex gap-2">Visitor Name:</p>
              <p>{data?.VisitorName || 'N/A'}</p>
            </div>
            <div className="flex items-center gap-4">
              <p className="font-semibold flex gap-2">Email:</p>
              <p>{data?.VisitorEmail || 'N/A'}</p>
            </div>
            <div className="flex items-center gap-4">
              <p className="font-semibold flex gap-2">Contact Number:</p>
              <p>{data?.VisitorContactNumber || 'N/A'}</p>
            </div>
            <div className="flex items-center gap-4">
              <p className="font-semibold flex gap-2">No. of Person:</p>
              <p>{data?.VisitorNoOfPerson || 'N/A'}</p>
            </div>
            <div className="flex items-center gap-4">
              <p className="font-semibold flex gap-2">Comment:</p>
              <p>{data?.VisitorComment || 'N/A'}</p>
            </div>
            <div className="flex items-center gap-4">
              <p className="font-semibold flex gap-2">Location:</p>
              <p>{data?.VisitorLocationName || 'N/A'}</p>
            </div>
            <div className="flex items-center gap-4">
              <p className="font-semibold flex gap-2"> In Time:</p>
              <p>{formatDate(data.VisitorInTime, 'DD MMM-YY HH:mm')}</p>
            </div>
            <div className="flex items-center gap-4">
              <p className="font-semibold flex gap-2"> Out Time:</p>
              <p>{formatDate(data.VisitorOutTime, 'DD MMM-YY HH:mm')}</p>
            </div>
            <div className="flex items-center gap-4 col-span-1">
              <p className="font-semibold flex gap-2">Assets Handover:</p>
              <p>{data?.VisitorAssetHandover || 'N/A'}</p>
            </div>
            <div className="flex items-center gap-4 col-span-1">
              <p className="font-semibold flex gap-2">
                Assets Handover Duration:
              </p>
              <p>{`${data?.VisitorAssetDurationInMinute} minutes` || 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>
    );
};

export default VisitorView;
