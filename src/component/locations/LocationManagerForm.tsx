import { MdAddCircleOutline, MdOutlineCancel } from 'react-icons/md';
import { ILocationManagersChildCollection } from '../../@types/database';
import InputWithTopHeader from '../../common/inputs/InputWithTopHeader';
import { showSnackbar } from '../../utilities/TsxUtils';

interface LocationManagerFormProps {
  locationManagers: ILocationManagersChildCollection[];
  setLocationManagers: React.Dispatch<
    React.SetStateAction<ILocationManagersChildCollection[]>
  >;
}

const LocationManagerForm = ({
  locationManagers,
  setLocationManagers,
}: LocationManagerFormProps) => {
  const handleAddTask = () => {
    if (!canAddTask()) {
      showSnackbar({
        message: 'Please enter existing manager details to add more',
        type: 'error',
      });
      return;
    }
    setLocationManagers([
      ...locationManagers,
      {
        LocationManagerName: '',
        LocationManagerEmail: '',
      },
    ]);
  };

  const handleRemoveTask = (index: number) => {
    if (locationManagers.length === 1) return;
    setLocationManagers(locationManagers.filter((_, i) => i !== index));
  };

  const handleChange = <T extends keyof ILocationManagersChildCollection>(
    index: number,
    field: T,
    value: ILocationManagersChildCollection[T]
  ) => {
    const updatedTasks = [...locationManagers];
    updatedTasks[index][field] = value;
    setLocationManagers(updatedTasks);
  };

  const canAddTask = () => {
    if (locationManagers.length === 0) {
      return true;
    }
    return !locationManagers.some(
      (task) => !task.LocationManagerEmail || !task.LocationManagerName
    );
  };
  return (
    <div className="col-span-3 flex flex-col gap-4 w-full p-4 bg-onHoverBg rounded">
      <div className="font-semibold">
        Add Location Manager / Supervisor / Site-Supervisor
      </div>
      <div className="grid grid-cols-2 gap-4">
        {locationManagers.map((task, index) => (
          <div key={index} className="flex items-end gap-4">
            {locationManagers.length > 1 && (
              <MdOutlineCancel
                onClick={() => handleRemoveTask(index)}
                className="text-textPrimaryRed text-3xl mb-[6px] cursor-pointer hover:scale-105 duration-200"
              />
            )}

            <InputWithTopHeader
              className="mx-0"
              label="Name"
              value={task.LocationManagerName}
              onChange={(e) =>
                handleChange(index, 'LocationManagerName', e.target.value)
              }
            />

            <InputWithTopHeader
              className="mx-0"
              label="Email"
              value={task.LocationManagerEmail}
              onChange={(e) =>
                handleChange(index, 'LocationManagerEmail', e.target.value)
              }
            />
            {locationManagers.length <= 4 && (
              <MdAddCircleOutline
                onClick={handleAddTask}
                className="text-3xl text-textPrimaryBlue mb-[6px] cursor-pointer hover:scale-105 duration-200"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default LocationManagerForm;
