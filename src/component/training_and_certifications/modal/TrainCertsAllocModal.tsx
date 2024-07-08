import { useForm } from 'react-hook-form';
import Dialog from '../../../common/Dialog';
import {
  TrainCertsAllocFormFields,
  trainCertsAllocSchema,
} from '../../../utilities/zod/schema';
import { zodResolver } from '@hookform/resolvers/zod';
import InputSelect from '../../../common/inputs/InputSelect';
import { useEffect, useState } from 'react';
import useFetchEmployees from '../../../hooks/fetch/useFetchEmployees';
import InputDate from '../../../common/inputs/InputDate';
import { removeTimeFromDate } from '../../../utilities/misc';
import { errorHandler } from '../../../utilities/CustomError';
import {
  closeModalLoader,
  showModalLoader,
  showSnackbar,
} from '../../../utilities/TsxUtils';
import DbCompany from '../../../firebase_configs/DB/DbCompany';
import { REACT_QUERY_KEYS } from '../../../@types/enum';
import { useQueryClient } from '@tanstack/react-query';

const TrainCertsAllocModal = ({
  opened,
  setOpened,
  trainCertsId,
}: {
  opened: boolean;
  setOpened: React.Dispatch<React.SetStateAction<boolean>>;
  trainCertsId: string;
}) => {
  const queryClient = useQueryClient();

  const methods = useForm<TrainCertsAllocFormFields>({
    resolver: zodResolver(trainCertsAllocSchema),
    defaultValues: { TrainCertsId: trainCertsId },
  });

  const [empSearchQuery, setEmpSearchQuery] = useState('');

  const [selectedEmpId, setSelectedEmpId] = useState('');

  const { data: employees } = useFetchEmployees({
    limit: 5,
    searchQuery: empSearchQuery,
  });

  const [allocDate, setAllocDate] = useState<Date | null>(null);

  useEffect(() => {
    setEmpSearchQuery('');
    setSelectedEmpId('');
    setAllocDate(null);
    methods.setValue('TrainCertsId', trainCertsId);
  }, [opened]);

  useEffect(() => {
    if (allocDate) {
      methods.setValue('TrainCertsAllocDate', removeTimeFromDate(allocDate));
    }
  }, [allocDate]);

  useEffect(() => {
    if (selectedEmpId) {
      const selectedEmp = employees.find(
        (emp) => emp.EmployeeId === selectedEmpId
      );
      if (selectedEmp) {
        methods.setValue('TrainCertsAllocEmpName', selectedEmp.EmployeeName);
        methods.setValue('TrainCertsAllocEmpId', selectedEmp.EmployeeId);
      } else {
        methods.setValue('TrainCertsAllocEmpName', '');
        methods.setValue('TrainCertsAllocEmpId', '');
      }
    } else {
      methods.setValue('TrainCertsAllocEmpName', '');
      methods.setValue('TrainCertsAllocEmpId', '');
    }
  }, [selectedEmpId]);

  const onSubmit = async (data: TrainCertsAllocFormFields) => {
    try {
      showModalLoader({});

      await DbCompany.createTrainCertsAlloc(data);

      showSnackbar({
        message: 'Training & Certification alloted successfully',
        type: 'success',
      });

      await queryClient.invalidateQueries({
        queryKey: [REACT_QUERY_KEYS.TRAIN_CERTS_ALLOC_LIST],
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
      title="Allot Training & Certification"
      isFormModal
      size="auto"
      positiveCallback={methods.handleSubmit(onSubmit)}
    >
      <div className="flex gap-4 items-center">
        <InputSelect
          value={selectedEmpId}
          onChange={(e) => setSelectedEmpId(e as string)}
          data={employees.map((emp) => {
            return { label: emp.EmployeeName, value: emp.EmployeeId };
          })}
          searchValue={empSearchQuery}
          onSearchChange={setEmpSearchQuery}
          searchable
          clearable
          label="Select employee"
          className="mx-0 w-full"
        />
        <InputDate
          label="Allocation Date"
          value={allocDate}
          setValue={setAllocDate}
        />
      </div>
    </Dialog>
  );
};

export default TrainCertsAllocModal;
