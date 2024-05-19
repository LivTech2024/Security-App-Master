/* eslint-disable @typescript-eslint/no-explicit-any */
import { MdClose } from 'react-icons/md';
import { IShiftLinkedPatrolsChildCollection } from '../../@types/database';
import Button from '../../common/button/Button';
import InputWithTopHeader from '../../common/inputs/InputWithTopHeader';
import { useState } from 'react';
import AssignPatrolModal from './modal/AssignPatrolModal';

const ShiftLinkPatrolForm = ({
  shiftLinkedPatrols,
  setShiftLinkedPatrols,
}: {
  shiftLinkedPatrols: IShiftLinkedPatrolsChildCollection[];
  setShiftLinkedPatrols: React.Dispatch<
    React.SetStateAction<IShiftLinkedPatrolsChildCollection[]>
  >;
}) => {
  const handleChange = (
    index: number,
    key: keyof IShiftLinkedPatrolsChildCollection,
    value: string | number
  ) => {
    const updatedCheckpoints = [...shiftLinkedPatrols];
    (updatedCheckpoints[index] as any)[key] = value;
    setShiftLinkedPatrols(updatedCheckpoints);
  };

  const handleRemovePatrol = (index: number) => {
    setShiftLinkedPatrols(shiftLinkedPatrols.filter((_, i) => i !== index));
  };

  const [assignPatrolModal, setAssignPatrolModal] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      <div className="font-semibold">Assign Patrols</div>
      <div className="grid grid-cols-2 gap-4">
        {shiftLinkedPatrols.map((patrol, index) => (
          <div key={index} className="flex items-center space-x-4">
            <div className="bg-onHoverBg rounded-full p-2">
              <MdClose
                className="text-textPrimaryRed text-xl cursor-pointer"
                onClick={() => handleRemovePatrol(index)}
              />
            </div>
            <div className="flex items-center gap-4">
              <InputWithTopHeader
                className={`mx-0`}
                placeholder="Checkpoint Name"
                value={patrol.LinkedPatrolName}
                disabled
              />
              <InputWithTopHeader
                className={`mx-0 `}
                placeholder="Required Hit Count"
                decimalCount={0}
                value={patrol.LinkedPatrolReqHitCount || ''}
                onChange={(e) =>
                  handleChange(
                    index,
                    'LinkedPatrolReqHitCount',
                    Number(e.target.value)
                  )
                }
              />
            </div>
          </div>
        ))}
      </div>
      <Button
        label="Assign New Patrol"
        type="black"
        onClick={() => setAssignPatrolModal(true)}
        className="w-fit"
      />

      <AssignPatrolModal
        opened={assignPatrolModal}
        setOpened={setAssignPatrolModal}
        shiftLinkedPatrols={shiftLinkedPatrols}
        setShiftLinkedPatrols={setShiftLinkedPatrols}
      />
    </div>
  );
};

export default ShiftLinkPatrolForm;
