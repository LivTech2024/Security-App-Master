import { useEffect, useState } from 'react';
import { IShiftLinkedPatrolsChildCollection } from '../../../@types/database';
import Dialog from '../../../common/Dialog';
import InputSelect from '../../../common/inputs/InputSelect';
import useFetchPatrols from '../../../hooks/fetch/useFetchPatrols';
import CustomError, { errorHandler } from '../../../utilities/CustomError';
import InputWithTopHeader from '../../../common/inputs/InputWithTopHeader';

const AssignPatrolModal = ({
  opened,
  setOpened,
  shiftLinkedPatrols,
  setShiftLinkedPatrols,
}: {
  opened: boolean;
  setOpened: React.Dispatch<React.SetStateAction<boolean>>;
  shiftLinkedPatrols: IShiftLinkedPatrolsChildCollection[];
  setShiftLinkedPatrols: React.Dispatch<
    React.SetStateAction<IShiftLinkedPatrolsChildCollection[]>
  >;
}) => {
  const [patrolSearchQuery, setPatrolSearchQuery] = useState('');

  const [selectedPatrolId, setSelectedPatrolId] = useState('');

  const [requiredHitCount, setRequiredHitCount] = useState<number | null>(null);

  const { data: patrols } = useFetchPatrols({
    limit: 5,
    searchQuery: patrolSearchQuery,
  });

  const onSubmit = async () => {
    try {
      if (!selectedPatrolId) {
        throw new CustomError('Please select patrol');
      }
      if (!requiredHitCount) {
        throw new CustomError('Please add required hit count');
      }

      const selectedPatrol = patrols.find(
        (res) => res.PatrolId === selectedPatrolId
      );

      if (!selectedPatrol) return;

      if (
        shiftLinkedPatrols.find(
          (prev) => prev.LinkedPatrolId === selectedPatrolId
        )
      ) {
        throw new CustomError('This patrol already exist');
      }
      setShiftLinkedPatrols((prev) => [
        ...prev,
        {
          LinkedPatrolId: selectedPatrol.PatrolId,
          LinkedPatrolName: selectedPatrol.PatrolName,
          LinkedPatrolReqHitCount: requiredHitCount,
        },
      ]);

      setOpened(false);
    } catch (error) {
      console.log(error);
      errorHandler(error);
    }
  };

  useEffect(() => {
    setSelectedPatrolId('');
    setPatrolSearchQuery('');
    setRequiredHitCount(null);
  }, [opened]);

  return (
    <Dialog
      opened={opened}
      setOpened={setOpened}
      title="Assign new patrol"
      size="35%"
      isFormModal
      positiveCallback={onSubmit}
    >
      <div className="flex flex-col gap-4">
        <InputSelect
          data={patrols.map((res) => {
            return { label: res.PatrolName, value: res.PatrolId };
          })}
          label="Select Patrol"
          value={selectedPatrolId}
          onChange={(e) => setSelectedPatrolId(e as string)}
          searchable
          clearable
          searchValue={patrolSearchQuery}
          onSearchChange={setPatrolSearchQuery}
        />

        <InputWithTopHeader
          className="mx-0"
          label="Required Hit Count"
          value={requiredHitCount || ''}
          decimalCount={0}
          onChange={(e) => setRequiredHitCount(Number(e.target.value))}
        />
      </div>
    </Dialog>
  );
};

export default AssignPatrolModal;
