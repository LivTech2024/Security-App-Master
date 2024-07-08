import { useState } from 'react';
import Dialog from '../../../common/Dialog';
import CustomError, { errorHandler } from '../../../utilities/CustomError';
import {
  closeModalLoader,
  showModalLoader,
  showSnackbar,
} from '../../../utilities/TsxUtils';
import InputDate from '../../../common/inputs/InputDate';
import DbCompany from '../../../firebase_configs/DB/DbCompany';
import { useQueryClient } from '@tanstack/react-query';
import { REACT_QUERY_KEYS } from '../../../@types/enum';

interface AllocUpdateModalProps {
  opened: boolean;
  setOpened: React.Dispatch<React.SetStateAction<boolean>>;
  trainCertsAllocId: string;
  status: 'started' | 'completed';
}

const AllocUpdateModal = ({
  opened,
  setOpened,
  status,
  trainCertsAllocId,
}: AllocUpdateModalProps) => {
  const queryClient = useQueryClient();

  const [updatedTime, setUpdatedTime] = useState<Date | null>(null);

  const updateStatus = async () => {
    try {
      if (!updatedTime) {
        throw new CustomError('Please enter date');
      }

      showModalLoader({});

      await DbCompany.updateTrainCertsAllocStatus({
        status,
        trainCertsAllocId: trainCertsAllocId,
        date: updatedTime,
      });

      showSnackbar({
        message: `Training & Certification allocation status updated successfully`,
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
      setOpened(false);
    }
  };

  return (
    <Dialog
      opened={opened}
      setOpened={setOpened}
      title={`Update allocation status`}
      size="30%"
      positiveCallback={updateStatus}
      isFormModal
    >
      <div className="flex flex-col">
        <InputDate
          type="default"
          value={updatedTime}
          setValue={setUpdatedTime}
          label={`Enter ${status === 'started' ? 'Started' : 'Completion'} Date`}
        />
      </div>
    </Dialog>
  );
};

export default AllocUpdateModal;
