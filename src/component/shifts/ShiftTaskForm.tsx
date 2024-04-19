import React from 'react';
import Button from '../../common/button/Button';
import InputWithTopHeader from '../../common/inputs/InputWithTopHeader';
import InputRadio from '../../common/inputs/InputRadio';

export interface ShiftTask {
  TaskName: string;
  TaskQrCodeRequired: boolean;
  TaskReturnReq: boolean;
}

interface Props {
  tasks: ShiftTask[];
  setTasks: React.Dispatch<React.SetStateAction<ShiftTask[]>>;
}

const ShiftTaskForm: React.FC<Props> = ({ tasks, setTasks }) => {
  const handleAddTask = () => {
    setTasks([
      ...tasks,
      {
        TaskName: '',
        TaskQrCodeRequired: false,
        TaskReturnReq: false,
      },
    ]);
  };

  const handleRemoveTask = (index: number) => {
    setTasks(tasks.filter((_, i) => i !== index));
  };

  const handleChange = <T extends keyof ShiftTask>(
    index: number,
    field: T,
    value: ShiftTask[T]
  ) => {
    const updatedTasks = [...tasks];
    updatedTasks[index][field] = value;
    setTasks(updatedTasks);
  };

  const canAddTask = () => {
    if (tasks.length === 0) {
      return true;
    }
    return !tasks.some((task) => !task.TaskName);
  };

  return (
    <div className="space-y-4">
      {tasks.map((task, index) => (
        <div key={index} className="flex items-start space-x-4">
          <div className="flex flex-col gap-1">
            <InputWithTopHeader
              className="mx-0"
              placeholder="Task"
              value={task.TaskName}
              onChange={(e) => handleChange(index, 'TaskName', e.target.value)}
            />

            <label className="flex items-center gap-2 cursor-pointer">
              QR Code Required
              <InputRadio
                type="checkbox"
                checked={task.TaskQrCodeRequired}
                onChange={(e) =>
                  handleChange(index, 'TaskQrCodeRequired', e.target.checked)
                }
              />
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              Return Required
              <InputRadio
                type="checkbox"
                checked={task.TaskReturnReq}
                onChange={(e) =>
                  handleChange(index, 'TaskReturnReq', e.target.checked)
                }
              />
            </label>
          </div>
          <Button
            label="Remove"
            type="red"
            className="py-[10px]"
            onClick={() => handleRemoveTask(index)}
          />
        </div>
      ))}
      <div className="flex w-full">
        <Button
          label="Add new task"
          type="green"
          onClick={handleAddTask}
          disabled={!canAddTask()}
          className="py-[10px] px-4"
        />
      </div>
    </div>
  );
};

export default ShiftTaskForm;
