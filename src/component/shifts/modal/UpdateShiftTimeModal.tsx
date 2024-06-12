import { useState } from 'react';
import Dialog from '../../../common/Dialog';
import DbShift from '../../../firebase_configs/DB/DbShift';
import CustomError, { errorHandler } from '../../../utilities/CustomError';
import {
  closeModalLoader,
  showModalLoader,
  showSnackbar,
} from '../../../utilities/TsxUtils';
import InputDate from '../../../common/inputs/InputDate';

interface UpdateShiftTimeModalProps {
  opened: boolean;
  setOpened: React.Dispatch<React.SetStateAction<boolean>>;
  shiftId: string;
  empId: string;
  field: 'start_time' | 'end_time';
  setShouldRefetch: React.Dispatch<React.SetStateAction<boolean>>;
}

const UpdateShiftTimeModal = ({
  opened,
  setOpened,
  empId,
  shiftId,
  field,
  setShouldRefetch,
}: UpdateShiftTimeModalProps) => {
  const [updatedTime, setUpdatedTime] = useState<Date | null>(null);

  const updateTime = async () => {
    try {
      if (!updatedTime) {
        throw new CustomError('Please enter new time');
      }

      showModalLoader({});

      await DbShift.updateShiftTime({ shiftId, empId, field, updatedTime });

      showSnackbar({
        message: `Shift ${field === 'end_time' ? 'end time' : 'start time'} updated successfully`,
        type: 'success',
      });

      setShouldRefetch((prev) => !prev);

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
      title={`Update ${field === 'start_time' ? 'Start Time' : 'End Time'}`}
      size="30%"
      positiveCallback={updateTime}
      isFormModal
    >
      <div className="flex flex-col">
        <InputDate
          type="date_time"
          value={updatedTime}
          setValue={setUpdatedTime}
          label="Enter new time"
        />
      </div>
    </Dialog>
  );
};

export default UpdateShiftTimeModal;
