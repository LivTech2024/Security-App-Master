import { useNavigate, useSearchParams } from 'react-router-dom';
import DbShift from '../../firebase_configs/DB/DbShift';
import {
  ICalloutsCollection,
  IEmployeeDARCollection,
  IReportsCollection,
} from '../../@types/database';
import { useEffect, useState } from 'react';
import PageHeader from '../../common/PageHeader';
import Button from '../../common/button/Button';
import NoSearchResult from '../../common/NoSearchResult';
import DbEmployee from '../../firebase_configs/DB/DbEmployee';
import { formatDate } from '../../utilities/misc';
import { Status } from '../../common/Status';
import { openContextModal } from '@mantine/modals';
import { errorHandler } from '../../utilities/CustomError';
import {
  closeModalLoader,
  showModalLoader,
  showSnackbar,
} from '../../utilities/TsxUtils';
import { useQueryClient } from '@tanstack/react-query';
import { PageRoutes, REACT_QUERY_KEYS } from '../../@types/enum';

const CalloutView = () => {
  const queryClient = useQueryClient();

  const navigate = useNavigate();

  const [searchParam] = useSearchParams();

  const calloutId = searchParam.get('id');

  const [loading, setLoading] = useState(true);

  const [data, setData] = useState<ICalloutsCollection | null>(null);

  const [assignedEmps, setAssignedEmps] = useState<string[]>([]);

  const [linkedReportId, setLinkedReportId] = useState<string | null>(null);
  const [linkedDarId, setLinkedDarId] = useState<string | null>(null);

  useEffect(() => {
    if (!calloutId) return;
    DbShift?.getCalloutById(calloutId).then(async (snapshot) => {
      const calloutData = snapshot.data() as ICalloutsCollection;
      if (calloutData) {
        setData(calloutData);
        const { CalloutAssignedEmpsId } = calloutData;

        const empNames: string[] = [];
        await Promise.all(
          CalloutAssignedEmpsId.map(async (id) => {
            const empData = await DbEmployee.getEmpById(id);
            const { EmployeeName } = empData;
            empNames.push(EmployeeName);
          })
        );
        setAssignedEmps(empNames);

        const reportSnapshot = await DbShift.getCalloutReport(calloutId);
        const reportData =
          reportSnapshot?.docs[0]?.data() as IReportsCollection;
        if (reportData) {
          setLinkedReportId(reportData.ReportId);
        }

        const darSnapshot = await DbShift.getCalloutDar(calloutId);
        const darData = darSnapshot?.docs[0]?.data() as IEmployeeDARCollection;
        if (darData) {
          setLinkedDarId(darData.EmpDarId);
        }
      }

      setLoading(false);
    });
  }, [calloutId]);

  const onDelete = async () => {
    if (!calloutId) return;
    try {
      showModalLoader({});

      await DbShift.deleteCallout(calloutId);

      await queryClient.invalidateQueries({
        queryKey: [REACT_QUERY_KEYS.CALLOUT_LIST],
      });

      showSnackbar({
        message: 'Callout deleted successfully',
        type: 'success',
      });

      closeModalLoader();

      navigate(PageRoutes.CALL_OUT_LIST);
    } catch (error) {
      console.log(error);
      errorHandler(error);
      closeModalLoader();
    }
  };

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
        <PageHeader title="Client data" />

        <div className="h-[40vh] bg-shimmerColor w-full animate-pulse"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-full p-6 gap-6 ">
      <PageHeader
        title="Callout Data"
        rightSection={
          <Button
            label="Delete"
            type="black"
            onClick={() => {
              openContextModal({
                modal: 'confirmModal',
                withCloseButton: false,
                centered: true,
                closeOnClickOutside: true,
                innerProps: {
                  title: 'Confirm',
                  body: 'Are you sure to delete this callout',
                  onConfirm: () => {
                    onDelete();
                  },
                },
                size: '30%',
                styles: {
                  body: { padding: '0px' },
                },
              });
            }}
          />
        }
      />
      <div className="bg-surface shadow-md rounded-lg p-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="font-semibold">Callout Location:</p>
            <p>{data?.CalloutLocationName || 'N/A'}</p>
          </div>
          <div>
            <p className="font-semibold">Callout Address:</p>
            <p>{data?.CalloutLocationAddress || 'N/A'}</p>
          </div>
          <div>
            <p className="font-semibold">Callout Time:</p>
            <p>
              {formatDate(data?.CalloutDateTime, 'DD MMM-YY HH:mm') || 'N/A'}
            </p>
          </div>
          <div>
            <p className="font-semibold">Assigned Employees:</p>
            <p>{assignedEmps.join(',')}</p>
          </div>
          {/* Callout Status */}
          <div className="w-full flex flex-col col-span-2">
            <p className="font-semibold">Callout Current Status</p>
            {data?.CalloutStatus && data.CalloutStatus.length > 0 ? (
              <div className="flex gap-4 overflow-x-auto shift-emp-scrollbar w-full">
                {data?.CalloutStatus?.map((data, idx) => {
                  return (
                    <div
                      key={idx}
                      className="flex flex-col bg-onHoverBg p-4 rounded-md w-full min-w-[300px]"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-semibold capitalize">
                          Employee:
                        </span>
                        {data.StatusEmpName}
                      </div>
                      <div className="flex items-center gap-2 capitalize">
                        <span className="font-semibold capitalize">
                          Current Status:
                        </span>
                        {data.Status}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold capitalize">
                          Started At:
                        </span>
                        {data.StatusStartedTime &&
                          formatDate(data.StatusStartedTime, 'DD MMM-YY HH:mm')}
                      </div>

                      {data.Status === 'completed' && (
                        <div className="flex items-center gap-2">
                          <span className="font-semibold capitalize">
                            Ended At:
                          </span>
                          {data.StatusEndedTime &&
                            formatDate(data.StatusEndedTime, 'DD MMM-YY HH:mm')}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <Status status="pending" />
            )}
          </div>

          {linkedReportId && (
            <div>
              <p className="font-semibold">Linked Report:</p>
              <p
                onClick={() =>
                  navigate(PageRoutes.REPORT_VIEW + `?id=${linkedReportId}`)
                }
                className="text-textPrimaryBlue cursor-pointer underline"
              >
                Click here to view
              </p>
            </div>
          )}

          {linkedDarId && (
            <div>
              <p className="font-semibold">Linked DAR:</p>
              <p
                onClick={() =>
                  navigate(PageRoutes.EMPLOYEE_DAR_VIEW + `?id=${linkedDarId}`)
                }
                className="text-textPrimaryBlue cursor-pointer underline"
              >
                Click here to view
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CalloutView;
