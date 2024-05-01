import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { IReportsCollection } from '../../@types/database';
import DbCompany from '../../firebase_configs/DB/DbCompany';
import NoSearchResult from '../../common/NoSearchResult';
import { IoArrowBackCircle } from 'react-icons/io5';
import { formatDate } from '../../utilities/misc';
import { PageRoutes } from '../../@types/enum';
import LazyLoad from 'react-lazyload';

const ReportView = () => {
  const [searchParam] = useSearchParams();

  const reportId = searchParam.get('id');

  const [loading, setLoading] = useState(true);

  const [data, setData] = useState<IReportsCollection | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    if (!reportId) return;
    DbCompany?.getReportById(reportId).then((snapshot) => {
      const reportData = snapshot.data() as IReportsCollection;
      if (reportData) {
        setData(reportData);
      }
      setLoading(false);
    });
  }, [reportId]);

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
            <div className="font-semibold text-lg">Report data</div>
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
            <div className="font-semibold text-lg">Report data</div>
          </div>
        </div>

        <div className="bg-surface shadow-md rounded-lg p-4">
          <div className="grid grid-cols-2 gap-4 text-lg">
            <div className="flex items-center gap-4">
              <p className="font-semibold flex gap-2">Report Name:</p>
              <p>{data?.ReportName || 'N/A'}</p>
            </div>
            <div className="flex items-center gap-4">
              <p className="font-semibold flex gap-2">Report Status:</p>
              <p>{data?.ReportStatus || 'N/A'}</p>
            </div>
            <div className="flex items-center gap-4">
              <p className="font-semibold flex gap-2">Report Category:</p>
              <p>{data?.ReportCategoryName || 'N/A'}</p>
            </div>
            <div className="flex items-center gap-4">
              <p className="font-semibold flex gap-2">Employee Name:</p>
              <p>{data?.ReportEmployeeName || 'N/A'}</p>
            </div>
            <div className="flex items-center gap-4">
              <p className="font-semibold flex gap-2">Report Date:</p>
              <p>{formatDate(data.ReportCreatedAt, 'DD MMM-YY hh:mm A')}</p>
            </div>
            {data.ReportLocationName && (
              <div className="flex items-center gap-4">
                <p className="font-semibold flex gap-2">Report Location:</p>
                <p>{data.ReportLocationName}</p>
              </div>
            )}

            <div className="flex items-center gap-4">
              <p className="font-semibold flex gap-2">
                Report Follow Up Required:
              </p>
              <p>{data.ReportIsFollowUpRequired ? 'Yes' : 'No'}</p>
            </div>

            {data.ReportIsFollowUpRequired && data.ReportFollowedUpId && (
              <div className="flex items-center gap-4">
                <p className="font-semibold flex gap-2">Followed Up Report:</p>
                <p
                  onClick={() =>
                    navigate(
                      PageRoutes.REPORT_VIEW +
                        `?id=${data.ReportIsFollowUpRequired}`
                    )
                  }
                  className="text-textPrimaryBlue cursor-pointer"
                >
                  {data.ReportFollowedUpId}
                </p>
              </div>
            )}

            <div className="flex items-start gap-4 col-span-2">
              <p className="font-semibold flex gap-2">Report Data:</p>
              <p>{data.ReportData}</p>
            </div>

            {data?.ReportImage?.length && (
              <div className="flex flex-col gap-4 col-span-2">
                <p className="font-semibold flex gap-2">Report Images:</p>
                <div className="flex flex-wrap-reverse gap-4">
                  {data?.ReportImage
                    ? data?.ReportImage?.map((img) => {
                        return (
                          <a href={img} target="_blank">
                            <LazyLoad height={100} unmountIfInvisible>
                              <img
                                src={img}
                                alt=""
                                className="w-[100px] h-[100px] rounded object-cover"
                              />
                            </LazyLoad>
                          </a>
                        );
                      })
                    : 'N/A'}
                </div>
              </div>
            )}

            {data?.ReportVideo?.length && (
              <div className="flex items-start gap-4 col-span-2">
                <p className="font-semibold flex gap-2">Report Videos:</p>
                <div className="flex flex-col gap-4">
                  {data?.ReportVideo
                    ? data?.ReportVideo?.map((src) => {
                        return (
                          <a
                            href={src}
                            target="_blank"
                            className="cursor-pointer text-textPrimaryBlue"
                          >
                            {src}
                          </a>
                        );
                      })
                    : 'N/A'}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
};

export default ReportView;
