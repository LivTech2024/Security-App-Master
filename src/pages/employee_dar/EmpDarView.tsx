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
import { closeModalLoader, showModalLoader } from '../../utilities/TsxUtils';
import Button from '../../common/button/Button';
import { generateEmpDarHtml } from '../../utilities/pdf/generateEmpDarHtml';
import { useAuthState } from '../../store';
import { htmlToPdf } from '../../API/HtmlToPdf';

const EmpDarView = () => {
  const { company } = useAuthState();

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
        if (EmpDarShiftId) {
          const shiftSnapsShot = await DbShift.getShiftById(EmpDarShiftId);
          const shiftData = shiftSnapsShot.data() as IShiftsCollection;
          console.log(shiftData);
          setShiftData(shiftData || null);
        }
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

  const downloadDarPdf = async () => {
    if (!company || !empDarData || !shiftData) return;
    try {
      showModalLoader({});

      const html = generateEmpDarHtml({
        companyDetails: company,
        empDarData,
        shiftStartTime: shiftData?.ShiftCurrentStatus.find(
          (s) => s.StatusReportedById === empDarData?.EmpDarEmpId
        )?.StatusStartedTime
          ? formatDate(
              shiftData?.ShiftCurrentStatus.find(
                (s) => s.StatusReportedById === empDarData?.EmpDarEmpId
              )?.StatusStartedTime
            )
          : 'N/A',
        shiftEndTime: shiftData?.ShiftCurrentStatus.find(
          (s) => s.StatusReportedById === empDarData?.EmpDarEmpId
        )?.StatusReportedTime
          ? formatDate(
              shiftData?.ShiftCurrentStatus.find(
                (s) => s.StatusReportedById === empDarData?.EmpDarEmpId
              )?.StatusReportedTime
            )
          : 'N/A',
      });

      const response = await htmlToPdf({ file_name: 'emp_dar.pdf', html });
      const blob = new Blob([response.data], { type: 'application/pdf' });

      // Create a link element
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);

      const invName = 'emp_dar.pdf';

      link.download = invName; // Specify the filename for the downloaded file

      // Append the link to the body
      document.body.appendChild(link);

      // Trigger a click on the link to start the download
      link.click();

      // Remove the link from the DOM
      document.body.removeChild(link);

      closeModalLoader();
    } catch (error) {
      console.log(error);
      closeModalLoader();
    }
  };

  const getShiftStartAndEndTime = () => {
    let shiftStartTime = 'N/A';
    let shiftEndTime = 'N/A';

    if (shiftData) {
      if (
        shiftData?.ShiftCurrentStatus.find(
          (s) => s.StatusReportedById === empDarData?.EmpDarEmpId
        )?.StatusEndReason
      ) {
        shiftStartTime = shiftData?.ShiftStartTime;
        shiftEndTime = shiftData?.ShiftCurrentStatus.find(
          (s) => s.StatusReportedById === empDarData?.EmpDarEmpId
        )?.StatusReportedTime
          ? formatDate(
              shiftData?.ShiftCurrentStatus.find(
                (s) => s.StatusReportedById === empDarData?.EmpDarEmpId
              )?.StatusStartedTime,
              'HH:mm'
            )
          : 'N/A';
      } else {
        shiftStartTime = shiftData?.ShiftStartTime;
        shiftEndTime = shiftData?.ShiftEndTime;
      }
    }

    return { shiftStartTime, shiftEndTime };
  };

  return (
    <div className="flex flex-col w-full h-full p-6 gap-6">
      <PageHeader
        title="DAR data"
        rightSection={
          <Button label="Print" onClick={downloadDarPdf} type="black" />
        }
      />

      <div className="grid grid-cols-2 gap-4 p-4 rounded shadow">
        <div className="flex gap-1">
          <p className="font-semibold">Employee Name: </p>
          <p>{empDarData?.EmpDarEmpName || 'N/A'}</p>
        </div>
        <div className="flex gap-1">
          <p className="font-semibold">Date:</p>
          <p>{formatDate(empDarData?.EmpDarDate)}</p>
        </div>
        <div className="flex gap-1">
          <p className="font-semibold">Shift Start Time:</p>
          <p>{getShiftStartAndEndTime().shiftStartTime}</p>
        </div>
        <div className="flex gap-1">
          <p className="font-semibold">Shift End Time:</p>
          <p>{getShiftStartAndEndTime().shiftEndTime}</p>
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
                  <div className="px-2 py-1 leading-3 text-textSecondary">
                    {res?.TileTime || 'N/A'}
                  </div>
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
                          <LazyLoad height={100}>
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
