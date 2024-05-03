import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { IEmployeeDARCollection } from '../../../@types/database';
import DbEmployee from '../../../firebase_configs/DB/DbEmployee';
import NoSearchResult from '../../../common/NoSearchResult';
import { formatDate } from '../../../utilities/misc';
import PageHeader from '../../../common/PageHeader';

const ClientEmpDarView = () => {
  const [searchParam] = useSearchParams();

  const empDarId = searchParam.get('id');

  const [loading, setLoading] = useState(true);

  const [data, setData] = useState<IEmployeeDARCollection | null>(null);

  useEffect(() => {
    if (!empDarId) return;
    DbEmployee.getEmpDarById(empDarId).then(async (snapshot) => {
      const shiftData = snapshot.data() as IEmployeeDARCollection;
      if (shiftData) {
        setData(shiftData);
      }
      setLoading(false);
    });
  }, [empDarId]);

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
        <PageHeader title="Report Data" />

        <div className="h-[40vh] bg-shimmerColor w-full"></div>
      </div>
    );
  }

  if (data)
    return (
      <div className="flex flex-col w-full h-full p-6 gap-6">
        <PageHeader title="Report Data" />

        <div className="bg-surface shadow-md rounded-lg p-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="font-semibold">Report Title:</p>
              <p>{data?.EmpDarTitle || 'N/A'}</p>
            </div>
            <div>
              <p className="font-semibold">Employee Name:</p>
              <p>{data?.EmpDarEmpName || 'N/A'}</p>
            </div>
            <div>
              <p className="font-semibold">Report Date:</p>
              <p>{formatDate(data.EmpDarDate)}</p>
            </div>
            <div className="col-span-2">
              <p className="font-semibold">Report Data:</p>
              <p>{data.EmpDarData}</p>
            </div>
            {data.EmpDarMedias && data.EmpDarMedias.length && (
              <div className="col-span-2">
                <p className="font-semibold">Images</p>
                <div className="flex flex-wrap gap-4">
                  {data.EmpDarMedias?.map((src) => {
                    return (
                      <img
                        src={src}
                        alt=""
                        className="w-[100px] h-[100px] rounded object-cover"
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
};

export default ClientEmpDarView;
