import { rem, TagsInput } from '@mantine/core';
import Button from '../../common/button/Button';
import InputWithTopHeader from '../../common/inputs/InputWithTopHeader';
import InputSelect from '../../common/inputs/InputSelect';
import { MdClose } from 'react-icons/md';
import cx from 'clsx';
import { VscGripper } from 'react-icons/vsc';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import classes from '../../DndListHandle.module.css';
import { reorderArray } from '../../utilities/misc';

interface CheckpointList {
  checkPointId: string | null;
  checkPointName: string;
  checkPointCategory: string | null;
  checkPointHint: string | null;
}

interface CheckPointInputProps {
  checkpoints: CheckpointList[];
  setCheckpoints: (checkpoints: CheckpointList[]) => void;
  checkpointCategories: string[];
  setCheckpointCategories: React.Dispatch<React.SetStateAction<string[]>>;
}

const CheckpointForm = ({
  checkpoints,
  setCheckpoints,
  checkpointCategories,
  setCheckpointCategories,
}: CheckPointInputProps) => {
  const handleAddCheckpoint = () => {
    setCheckpoints([
      ...checkpoints,
      {
        checkPointName: '',
        checkPointCategory: null,
        checkPointHint: null,
        checkPointId: null,
      },
    ]);
  };

  const handleRemoveCheckpoint = (index: number) => {
    if (checkpoints.length === 1) return;
    setCheckpoints(checkpoints.filter((_, i) => i !== index));
  };

  const handleChange = (
    index: number,
    key: 'checkPointName' | 'checkPointCategory' | 'checkPointHint',
    value: string
  ) => {
    const updatedCheckpoints = [...checkpoints];
    updatedCheckpoints[index][key] = value;
    setCheckpoints(updatedCheckpoints);
  };

  console.log(checkpoints, 'here');

  const items = checkpoints.map((item, index) => (
    <Draggable
      key={item.checkPointId || index}
      index={index}
      draggableId={item.checkPointId || String(index)}
    >
      {(provided, snapshot) => (
        <div
          className={`${cx(classes.item, {
            [classes.itemDragging]: snapshot.isDragging,
          })} pl-0 pr-1 w-full`}
          ref={provided.innerRef}
          {...provided.draggableProps}
        >
          <div key={index} className="flex items-center space-x-4 w-full">
            <div {...provided.dragHandleProps} className={classes.dragHandle}>
              <VscGripper
                style={{ width: rem(18), height: rem(18) }}
                stroke="1.5"
              />
            </div>
            {checkpoints.length > 1 && (
              <div className="bg-onHoverBg rounded-full p-2">
                <MdClose
                  className="text-textPrimaryRed text-xl cursor-pointer"
                  onClick={() => handleRemoveCheckpoint(index)}
                />
              </div>
            )}
            <div className="flex items-center gap-4">
              <InputWithTopHeader
                className={`mx-0 ${
                  checkpointCategories.length === 0 && 'w-full'
                }`}
                placeholder="Checkpoint Name"
                value={item.checkPointName}
                onChange={(e) =>
                  handleChange(index, 'checkPointName', e.target.value)
                }
              />
              <InputWithTopHeader
                className={`mx-0 `}
                placeholder="Hint"
                value={item.checkPointHint || ''}
                onChange={(e) =>
                  handleChange(index, 'checkPointHint', e.target.value)
                }
              />
              {checkpointCategories.length > 0 && (
                <InputSelect
                  placeholder="Select category"
                  data={checkpointCategories}
                  value={item.checkPointCategory || ''}
                  className="w-full"
                  onChange={(e) =>
                    handleChange(index, 'checkPointCategory', e as string)
                  }
                />
              )}
            </div>
          </div>
        </div>
      )}
    </Draggable>
  ));

  return (
    <div className="flex flex-col gap-4">
      <TagsInput
        label="Create checkpoints category"
        placeholder="Enter category and press enter"
        className="max-w-[50%]"
        value={checkpointCategories}
        onChange={setCheckpointCategories}
        styles={{
          input: {
            border: `1px solid #0000001A`,
            fontWeight: 'normal',
            fontSize: '18px',
            borderRadius: '4px',
            background: '#FFFFFF',
            color: '#000000',
            padding: '8px 8px',
          },
        }}
      />

      <DragDropContext
        onDragEnd={({ destination, source }) => {
          const updatedCheckPoints = reorderArray(
            checkpoints,
            source.index,
            destination?.index || 0
          );
          setCheckpoints(updatedCheckPoints);
        }}
      >
        <Droppable
          droppableId="dnd-list"
          direction="vertical"
          ignoreContainerClipping={true}
        >
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="grid grid-cols-2 gap-4 col-span-2"
            >
              {items}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <Button
        type="green"
        className="px-6 py-[6px] text-base w-fit"
        onClick={handleAddCheckpoint}
        disabled={checkpoints.some(
          (checkpoint) =>
            !checkpoint.checkPointName ||
            (checkpointCategories.length > 0 && !checkpoint.checkPointCategory)
        )}
        label="Add new"
      />
    </div>
  );
};

export default CheckpointForm;
