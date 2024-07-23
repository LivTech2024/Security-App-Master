import { useEffect, useState } from 'react';
import { ILeaveRequestsCollection } from '../../../@types/database';
import Dialog from '../../../common/Dialog';
import { formatDate } from '../../../utilities/misc';
import DbEmployee from '../../../firebase_configs/DB/DbEmployee';
import { useAuthState } from '../../../store';
import SwitchWithSideHeader from '../../../common/switch/SwitchWithSideHeader';
import InputWithTopHeader from '../../../common/inputs/InputWithTopHeader';
import InputSelect from '../../../common/inputs/InputSelect';
import CustomError, { errorHandler } from '../../../utilities/CustomError';
import {
  closeModalLoader,
  showModalLoader,
  showSnackbar,
} from '../../../utilities/TsxUtils';
import DbHR from '../../../firebase_configs/DB/DbHR';
import { useQueryClient } from '@tanstack/react-query';
import { REACT_QUERY_KEYS } from '../../../@types/enum';

const LeaveReqUpdateModal = ({
  opened,
  setOpened,
  data,
}: {
  opened: boolean;
  setOpened: React.Dispatch<React.SetStateAction<boolean>>;
  data: ILeaveRequestsCollection | null;
}) => {
  const queryClient = useQueryClient();

  const { companyBranches } = useAuthState();

  const [supervisorName, setSupervisorName] = useState('N/A');

  const [isPaidLeave, setIsPaidLeave] = useState(false);

  const [paidLeaveAmt, setPaidLeaveAmt] = useState('');

  const [leaveStatus, setLeaveStatus] = useState<
    'pending' | 'accepted' | 'rejected'
  >(data?.LeaveReqStatus || 'pending');

  useEffect(() => {
    if (!data) return;

    if (data.LeaveReqSupervisorId) {
      DbEmployee.getEmpById(data.LeaveReqSupervisorId).then((res) =>
        setSupervisorName(res.EmployeeName)
      );
    }

    setIsPaidLeave(data.LeaveReqIsPaidLeave || false);
    setPaidLeaveAmt(String(data.LeaveReqPaidLeaveAmt || ''));
    setLeaveStatus(data.LeaveReqStatus || 'pending');
  }, [data]);

  const onSubmit = async () => {
    if (!data) return;
    try {
      if (isPaidLeave && !Number(paidLeaveAmt)) {
        throw new CustomError('Please enter paid leave amount');
      }
      showModalLoader({});

      await DbHR.updateLeaveRequest({
        isPaidLeave,
        leaveStatus,
        paidLeaveAmt: Number(paidLeaveAmt),
        reqId: data.LeaveReqId,
      });

      await queryClient.invalidateQueries({
        queryKey: [REACT_QUERY_KEYS.LEAVE_REQ_LIST],
      });

      showSnackbar({
        message: 'Leave request updated successfully',
        type: 'success',
      });

      closeModalLoader();
      setOpened(false);
    } catch (error) {
      console.log(error);
      errorHandler(error);
      closeModalLoader();
    }
  };

  return (
    <Dialog
      opened={opened}
      setOpened={setOpened}
      title="Update Leave Request"
      size="60%"
      isFormModal
      positiveCallback={onSubmit}
      positiveLabel="Update"
    >
      {data && (
        <div className="grid grid-cols-2 gap-4 items-end">
          <div className="flex gap-2 items-center">
            <span className="font-semibold whitespace-nowrap">
              Employee Name :
            </span>
            <span className="line-clamp-1">{data?.LeaveReqEmpName}</span>
          </div>
          <div className="flex gap-2 items-center">
            <span className="font-semibold whitespace-nowrap">Reason :</span>
            <span className="">{data?.LeaveReqReason}</span>
          </div>
          <div className="flex gap-2 items-center">
            <span className="font-semibold whitespace-nowrap">From Date :</span>
            <span className="line-clamp-1">
              {formatDate(data?.LeaveReqFromDate)}
            </span>
          </div>
          <div className="flex gap-2 items-center">
            <span className="font-semibold whitespace-nowrap">To Date :</span>
            <span className="line-clamp-1">
              {formatDate(data?.LeaveReqToDate)}
            </span>
          </div>
          {data.LeaveReqCompanyBranchId && (
            <div className="flex gap-2 items-center">
              <span className="font-semibold whitespace-nowrap">Branch :</span>
              <span className="line-clamp-1">
                {
                  companyBranches.find(
                    (branch) =>
                      branch.CompanyBranchId === data.LeaveReqCompanyBranchId
                  )?.CompanyBranchName
                }
              </span>
            </div>
          )}
          {data.LeaveReqSupervisorId && (
            <div className="flex gap-2 items-center">
              <span className="font-semibold whitespace-nowrap">
                Supervisor :
              </span>
              <span className="line-clamp-1">{supervisorName}</span>
            </div>
          )}
          <SwitchWithSideHeader
            label="Mark this as paid leave"
            className="bg-onHoverBg p-2 rounded"
            checked={isPaidLeave}
            onChange={() => setIsPaidLeave((prev) => !prev)}
          />
          <InputWithTopHeader
            className="mx-0"
            placeholder="Paid Leave Amount"
            leadingIcon={<div>$</div>}
            decimalCount={2}
            value={paidLeaveAmt}
            onChange={(e) => setPaidLeaveAmt(e.target.value)}
          />
          <InputSelect
            label="Update Status"
            value={leaveStatus}
            onChange={(e) =>
              setLeaveStatus(e as 'pending' | 'accepted' | 'rejected')
            }
            data={[
              { label: 'Pending', value: 'pending' },
              { label: 'Accepted', value: 'accepted' },
              { label: 'Rejected', value: 'rejected' },
            ]}
          />
        </div>
      )}
    </Dialog>
  );
};

export default LeaveReqUpdateModal;
