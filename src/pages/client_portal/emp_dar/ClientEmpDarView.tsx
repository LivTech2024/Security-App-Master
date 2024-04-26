import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { IEmployeeDARCollection } from '../../../@types/database';
import DbEmployee from '../../../firebase_configs/DB/DbEmployee';
import NoSearchResult from '../../../common/NoSearchResult';
import { IoArrowBackCircle } from 'react-icons/io5';
import { formatDate } from '../../../utilities/misc';

const ClientEmpDarView = () => {
  const [searchParam] = useSearchParams();

  const empDarId = searchParam.get('id');

  const [loading, setLoading] = useState(true);

  const [data, setData] = useState<IEmployeeDARCollection | null>(null);

  const navigate = useNavigate();

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
        <div className="flex justify-between w-full p-4 rounded bg-primaryGold text-surface items-center">
          <div
            onClick={() => navigate(-1)}
            className="flex items-center gap-4 cursor-pointer "
          >
            <div className="cursor-pointer">
              <IoArrowBackCircle className="h-6 w-6" />
            </div>
            <div className="font-semibold text-lg">Report Data</div>
          </div>
        </div>
        <div className="h-[40vh] bg-shimmerColor w-full"></div>
      </div>
    );
  }

  if (data)
    return (
      <div className="flex flex-col w-full h-full p-6 gap-6">
        <div className="flex justify-between w-full p-4 rounded bg-primaryGold  items-center">
          <div
            onClick={() => navigate(-1)}
            className="flex items-center gap-4 cursor-pointer "
          >
            <div className="cursor-pointer">
              <IoArrowBackCircle className="h-6 w-6" />
            </div>
            <div className="font-semibold text-lg">Report Data</div>
          </div>
        </div>

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
            {data.EmpDarImages && data.EmpDarImages.length && (
              <div className="col-span-2">
                <p className="font-semibold">Images</p>
                <div className="flex flex-wrap gap-4">
                  {data.EmpDarImages?.map((src) => {
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
