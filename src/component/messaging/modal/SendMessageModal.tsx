import { useEffect, useState } from 'react';
import Dialog from '../../../common/Dialog';
import { errorHandler } from '../../../utilities/CustomError';
import {
  closeModalLoader,
  showModalLoader,
  showSnackbar,
} from '../../../utilities/TsxUtils';
import DbMessaging from '../../../firebase_configs/DB/DbMessaging';
import { useAuthState } from '../../../store';
import TextareaWithTopHeader from '../../../common/inputs/TextareaWithTopHeader';
import InputSelect from '../../../common/inputs/InputSelect';
import useFetchEmployees from '../../../hooks/fetch/useFetchEmployees';
import useFetchClients from '../../../hooks/fetch/useFetchClients';
import { MdClose } from 'react-icons/md';

const SendMessageModal = ({
  opened,
  setOpened,
}: {
  opened: boolean;
  setOpened: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const [loading, setLoading] = useState(false);

  const { company } = useAuthState();

  const [data, setData] = useState('');

  const [receivers, setReceivers] = useState<{ id: string; name: string }[]>(
    []
  );

  const [empSearchQuery, setEmpSearchQuery] = useState('');

  const [selectedEmployee, setSelectedEmployee] = useState('');

  const { data: employees } = useFetchEmployees({
    limit: 5,
    searchQuery: empSearchQuery,
  });

  //client

  const [clientSearchQuery, setClientSearchQuery] = useState('');

  const [selectedClient, setSelectedClient] = useState('');

  const { data: clients } = useFetchClients({
    limit: 5,
    searchQuery: empSearchQuery,
  });

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
    if (selectedClient && selectedClient.length > 0) {
      setReceivers((prev) => {
        if (prev.find((rec) => rec.id === selectedClient)) {
          return prev;
        }
        const clientName = clients.find(
          (emp) => emp.ClientId === selectedClient
        )?.ClientName;
        return [...prev, { id: selectedClient, name: clientName || '' }];
      });
    }

    setSelectedEmployee('');
    setEmpSearchQuery('');
    setClientSearchQuery('');
    setSelectedClient('');
  }, [selectedEmployee, selectedClient]);

  const onSubmit = async () => {
    try {
      setLoading(true);

      await DbMessaging.createMessage({
        cmpId: company!.CompanyId,
        data,
        receiversId: receivers.map((rec) => rec.id),
        senderId: company!.CompanyId,
        senderName: 'Admin',
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

        <div className="flex items-center gap-4 w-full">
          <InputSelect
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
          <InputSelect
            label="Select client"
            data={clients.map((res) => {
              return { label: res.ClientName, value: res.ClientId };
            })}
            value={selectedClient}
            searchValue={clientSearchQuery}
            onSearchChange={setClientSearchQuery}
            onChange={(e) => setSelectedClient(e as string)}
            searchable
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
