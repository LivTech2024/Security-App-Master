import { useSearchParams } from 'react-router-dom';
import PageHeader from '../../common/PageHeader';
import {
  IEmployeeDARCollection,
  IShiftsCollection,
} from '../../@types/database';
import { useEffect, useState } from 'react';
import DbEmployee from '../../firebase_configs/DB/DbEmployee';
import NoSearchResult from '../../common/NoSearchResult';
import { formatDate } from '../../utilities/misc';
import DbShift from '../../firebase_configs/DB/DbShift';
import LazyLoad from 'react-lazyload';

const EmpDarView = () => {
  const [searchParam] = useSearchParams();

  const empDarId = searchParam.get('id');

  const [empDarData, setEmpDarData] = useState<IEmployeeDARCollection | null>(
    null
  );

  const [shiftData, setShiftData] = useState<IShiftsCollection | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!empDarId) return;
    DbEmployee.getEmpDarById(empDarId).then(async (snapshot) => {
      const data = snapshot.data() as IEmployeeDARCollection;
      if (data) {
        setEmpDarData(data);
        const { EmpDarShiftId } = data;
        const shiftSnapsShot = await DbShift.getShiftById(EmpDarShiftId);
        const shiftData = shiftSnapsShot.data() as IShiftsCollection;
        setShiftData(shiftData || null);
      }
      setLoading(false);
    });
  }, [empDarId]);

  if (!empDarData && !loading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <NoSearchResult />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col w-full h-full p-6 gap-6 ">
        <PageHeader title="DAR data" />

        <div className="h-[40vh] bg-shimmerColor w-full animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-full p-6 gap-6">
      <PageHeader title="DAR data" />

      <div className="grid grid-cols-2 gap-4 p-4 rounded shadow">
        <div>
          <p className="font-semibold">Employee Name:</p>
          <p>{empDarData?.EmpDarEmpName || 'N/A'}</p>
        </div>
        <div>
          <p className="font-semibold">Date:</p>
          <p>{formatDate(empDarData?.EmpDarDate)}</p>
        </div>
        <div>
          <p className="font-semibold">Shift Start Time:</p>
          <p>
            {shiftData?.ShiftCurrentStatus.find(
              (s) => s.StatusReportedById === empDarData?.EmpDarEmpId
            )?.StatusStartedTime
              ? formatDate(
                  shiftData?.ShiftCurrentStatus.find(
                    (s) => s.StatusReportedById === empDarData?.EmpDarEmpId
                  )?.StatusStartedTime
                )
              : 'N/A'}
          </p>
        </div>
        <div>
          <p className="font-semibold">Shift End Time:</p>
          <p>
            {shiftData?.ShiftCurrentStatus.find(
              (s) => s.StatusReportedById === empDarData?.EmpDarEmpId
            )?.StatusReportedTime
              ? formatDate(
                  shiftData?.ShiftCurrentStatus.find(
                    (s) => s.StatusReportedById === empDarData?.EmpDarEmpId
                  )?.StatusReportedTime
                )
              : 'N/A'}
          </p>
        </div>

        <div className="flex flex-col w-full col-span-2 gap-4">
          <p className="font-semibold">Dar Tiles:</p>
          {empDarData?.EmpDarTile?.map((res) => {
            return (
              <div className="grid grid-cols-3 border-[2px] border-inputBorder">
                <div className="flex flex-col ">
                  <div className="bg-primaryGold px-2 py-1 font-semibold">
                    Place/Spot
                  </div>
                  <div className="px-2 py-1">{res?.TileLocation || 'N/A'}</div>
                </div>
                <div className="flex flex-col ">
                  <div className="bg-primaryGold px-2 py-1 font-semibold">
                    Description
                  </div>
                  <div className="px-2 py-1">{res?.TileContent || 'N/A'}</div>
                </div>
                <div className="flex flex-col ">
                  <div className="bg-primaryGold px-2 py-1 font-semibold">
                    Images
                  </div>
                  <div className="px-2 py-1 flex flex-wrap gap-4">
                    {res.TileImages.map((src) => {
                      return (
                        <a
                          href={src}
                          target="_blank"
                          className="text-textPrimaryBlue"
                        >
                          <LazyLoad height={100} unmountIfInvisible>
                            <img
                              src={src}
                              alt=""
                              className="w-[100px] h-[100px] rounded object-cover"
                            />
                          </LazyLoad>
                        </a>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default EmpDarView;
