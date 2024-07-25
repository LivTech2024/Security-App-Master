import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { IReportsCollection } from '../../@types/database';
import DbCompany from '../../firebase_configs/DB/DbCompany';
import NoSearchResult from '../../common/NoSearchResult';
import { formatDate } from '../../utilities/misc';
import { PageRoutes } from '../../@types/enum';
import LazyLoad from 'react-lazyload';
import PageHeader from '../../common/PageHeader';
import Button from '../../common/button/Button';
import { errorHandler } from '../../utilities/CustomError';
import { closeModalLoader, showModalLoader } from '../../utilities/TsxUtils';
import { useAuthState } from '../../store';
import { generateReportsHtml } from '../../utilities/pdf/generateReportsHtml';
import { htmlToPdf } from '../../API/HtmlToPdf';
import { downloadPdf } from '../../utilities/pdf/common/downloadPdf';
import { Status } from '../../common/Status';

const ReportView = () => {
  const { company } = useAuthState();

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
        <PageHeader title="Report data" />
        <div className="h-[40vh] bg-shimmerColor w-full"></div>
      </div>
    );
  }

  if (data) {
    const downloadReportPdf = async () => {
      if (!company) return;
      try {
        showModalLoader({});

        const html = generateReportsHtml(company, data);

        const response = await htmlToPdf({ file_name: 'report.pdf', html });

        downloadPdf(response, 'report.pdf');

        closeModalLoader();
      } catch (error) {
        errorHandler(error);
        closeModalLoader();
        console.log(error);
      }
    };

    return (
      <div className="flex flex-col w-full h-full p-6 gap-6 justify-between">
        <PageHeader
          title="Report data"
          rightSection={
            <Button label="Download" onClick={downloadReportPdf} type="black" />
          }
        />

        <div className="bg-surface shadow-md rounded-lg p-4">
          <div className="grid grid-cols-2 gap-4 text-lg">
            <div className="flex items-center gap-4">
              <p className="font-semibold flex gap-2">Report Name:</p>
              <p>{data?.ReportName || 'N/A'}</p>
            </div>
            <div className="flex items-center gap-4">
              <p className="font-semibold flex gap-2">Report Status:</p>
              <Status status={data?.ReportStatus || 'pending'} />
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
              <p>{formatDate(data.ReportCreatedAt, 'DD MMM-YY HH:mm')}</p>
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

            {data.ReportFollowedUpId && (
              <div className="flex items-center gap-4">
                <p className="font-semibold flex gap-2">Followed Up Report:</p>
                <p
                  onClick={() =>
                    navigate(
                      PageRoutes.REPORT_VIEW + `?id=${data.ReportFollowedUpId}`
                    )
                  }
                  className="text-textPrimaryBlue cursor-pointer text-sm mt-[2px] underline"
                >
                  Click here to view
                </p>
              </div>
            )}

            <div className="flex flex-col items-start gap-1 col-span-2">
              <p className="font-semibold flex gap-2 whitespace-nowrap">
                Report Data:
              </p>
              <p>{data.ReportData}</p>
            </div>

            {data?.ReportImage?.length ? (
              <div className="flex flex-col gap-4 col-span-2">
                <p className="font-semibold flex gap-2">Report Images:</p>
                <div className="flex flex-wrap-reverse gap-4">
                  {data?.ReportImage
                    ? data?.ReportImage?.map((img) => {
                        return (
                          <a href={img} target="_blank">
                            <LazyLoad height={100}>
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
            ) : null}

            {data?.ReportVideo?.length ? (
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
            ) : null}
          </div>
        </div>
      </div>
    );
  }
};

export default ReportView;
