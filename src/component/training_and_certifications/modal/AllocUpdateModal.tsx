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
import { ITrainCertsAllocationsCollection } from '../../../@types/database';
import dayjs from 'dayjs';
import { toDate } from '../../../utilities/misc';

interface AllocUpdateModalProps {
  opened: boolean;
  setOpened: React.Dispatch<React.SetStateAction<boolean>>;
  trainCertsAlloc: ITrainCertsAllocationsCollection;
  status: 'started' | 'completed';
}

const AllocUpdateModal = ({
  opened,
  setOpened,
  status,
  trainCertsAlloc,
}: AllocUpdateModalProps) => {
  const queryClient = useQueryClient();

  const [updatedTime, setUpdatedTime] = useState<Date | null>(null);

  const updateStatus = async () => {
    try {
      if (!updatedTime) {
        throw new CustomError('Please enter date');
      }

      if (
        status === 'started' &&
        dayjs(updatedTime).isBefore(toDate(trainCertsAlloc.TrainCertsAllocDate))
      ) {
        throw new CustomError(
          'Start date cannot be smaller than allocation date'
        );
      }

      if (
        status === 'completed' &&
        (!trainCertsAlloc.TrainCertsAllocStartDate ||
          dayjs(updatedTime).isBefore(
            toDate(trainCertsAlloc.TrainCertsAllocStartDate)
          ))
      ) {
        throw new CustomError(
          'Completion date cannot be smaller than start date'
        );
      }

      showModalLoader({});

      console.log(trainCertsAlloc);

      await DbCompany.updateTrainCertsAllocStatus({
        status,
        trainCertsAllocId: trainCertsAlloc.TrainCertsAllocId,
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
    }
  };

  return (
    <Dialog
      opened={opened}
      setOpened={setOpened}
      title={`Update allocation status`}
      size="30%"
      positiveCallback={updateStatus}
      isFormModal={true}
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
