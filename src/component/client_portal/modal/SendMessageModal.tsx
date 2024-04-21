import { useEffect, useState } from 'react';
import Dialog from '../../../common/Dialog';
import CustomError, { errorHandler } from '../../../utilities/CustomError';
import {
  closeModalLoader,
  showModalLoader,
  showSnackbar,
} from '../../../utilities/TsxUtils';
import DbMessaging from '../../../firebase_configs/DB/DbMessaging';
import { useAuthState } from '../../../store';
import TextareaWithTopHeader from '../../../common/inputs/TextareaWithTopHeader';
import InputSelect from '../../../common/inputs/InputSelect';
import { MdClose } from 'react-icons/md';
import { REACT_QUERY_KEYS } from '../../../@types/enum';
import { useQueryClient } from '@tanstack/react-query';
import SwitchWithSideHeader from '../../../common/switch/SwitchWithSideHeader';
import useFetchClientEmployees from '../../../hooks/fetch/useFetchClientEmployees';

const SendMessageModal = ({
  opened,
  setOpened,
}: {
  opened: boolean;
  setOpened: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const queryClient = useQueryClient();

  const [loading, setLoading] = useState(false);

  const { client } = useAuthState();

  const [data, setData] = useState('');

  const [receivers, setReceivers] = useState<{ id: string; name: string }[]>(
    []
  );

  const [empSearchQuery, setEmpSearchQuery] = useState('');

  const [selectedEmployee, setSelectedEmployee] = useState('');

  const { data: employees } = useFetchClientEmployees();

  useEffect(() => {
    if (selectedEmployee && selectedEmployee.length > 0) {
      setReceivers((prev) => {
        if (prev.find((rec) => rec.id === selectedEmployee)) {
          return prev;
        }
        const empName = employees.find(
          (emp) => emp.EmployeeId === selectedEmployee
        )?.EmployeeName;
        return [...prev, { id: selectedEmployee, name: empName || '' }];
      });
    }
    setSelectedEmployee('');
    setEmpSearchQuery('');
  }, [selectedEmployee]);

  const onSubmit = async () => {
    if (!client) return;
    try {
      if (receivers.length === 0) {
        throw new CustomError('Please select at least one receiver');
      }
      if (!data) {
        throw new CustomError('Please enter message');
      }

      setLoading(true);

      await DbMessaging.createMessage({
        cmpId: client.ClientCompanyId,
        data,
        receiversId: receivers.map((rec) => rec.id),
        senderId: client.ClientId,
        senderName: client.ClientName,
      });

      await queryClient.invalidateQueries({
        queryKey: [REACT_QUERY_KEYS.MESSAGE_SENT_LIST],
      });

      showSnackbar({ message: 'Message sent successfully', type: 'success' });

      setLoading(false);
      setOpened(false);
    } catch (error) {
      console.log(error);
      errorHandler(error);
    }
  };

  useEffect(() => {
    if (loading) {
      showModalLoader({});
    } else {
      closeModalLoader();
    }
    return () => closeModalLoader();
  }, [loading]);
  return (
    <Dialog
      opened={opened}
      setOpened={setOpened}
      title="Create new message"
      isFormModal
      positiveCallback={onSubmit}
    >
      <div className="flex flex-col gap-4 w-full">
        <div className="flex flex-col ">
          <span className="font-semibold">Receivers:</span>

          <div className="flex flex-col gap-2  max-h-[120px] overflow-scroll remove-vertical-scrollbar py-2">
            {receivers.map((rec, idx) => {
              return (
                <span className="bg-onHoverBg p-2 rounded flex justify-between gap-4 w-full">
                  <span>
                    {idx + 1}. {rec.name}
                  </span>
                  <MdClose
                    className="text-textPrimaryRed text-xl cursor-pointer"
                    onClick={() =>
                      setReceivers((prev) =>
                        prev.filter((i) => i.id !== rec.id)
                      )
                    }
                  />
                </span>
              );
            })}
          </div>
        </div>

        <div className="flex items-end gap-4 w-full">
          <InputSelect
            className="mx-0 w-full"
            label="Select employee"
            data={employees.map((res) => {
              return { label: res.EmployeeName, value: res.EmployeeId };
            })}
            value={selectedEmployee}
            searchValue={empSearchQuery}
            onSearchChange={setEmpSearchQuery}
            onChange={(e) => setSelectedEmployee(e as string)}
            searchable
          />
          <SwitchWithSideHeader
            label="Send to admin"
            className="w-full mb-2"
            checked={
              receivers.find((i) => i.id === client!.ClientCompanyId)
                ? true
                : false
            }
            onChange={() => {
              setReceivers((prev) => {
                if (prev.find((rcv) => rcv.id === client!.ClientCompanyId)) {
                  return prev.filter(
                    (rcv) => rcv.id !== client!.ClientCompanyId
                  );
                }
                return [
                  ...prev,
                  { id: client!.ClientCompanyId, name: 'Admin' },
                ];
              });
            }}
          />
        </div>

        <TextareaWithTopHeader
          className="mx-0"
          value={data}
          onChange={(e) => setData(e.target.value)}
          title="Message"
        />
      </div>
    </Dialog>
  );
};

export default SendMessageModal;
