import Button from "../../common/button/Button";
import InputWithTopHeader from "../../common/inputs/InputWithTopHeader";

interface CheckPointInputProps {
  checkpoints: { checkPointName: string }[];
  setCheckpoints: (checkpoints: { checkPointName: string }[]) => void;
}

const CheckpointForm = ({
  checkpoints,
  setCheckpoints,
}: CheckPointInputProps) => {
  const handleAddCheckpoint = () => {
    setCheckpoints([
      ...checkpoints,
      {
        checkPointName: "",
      },
    ]);
  };

  const handleRemoveCheckpoint = (index: number) => {
    if (checkpoints.length === 1) return;
    setCheckpoints(checkpoints.filter((_, i) => i !== index));
  };

  const handleChange = (index: number, value: string) => {
    const updatedCheckpoints = [...checkpoints];
    updatedCheckpoints[index].checkPointName = value;
    setCheckpoints(updatedCheckpoints);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full place-content-between">
      {checkpoints.map((checkpoint, index) => (
        <div key={index} className="flex items-center space-x-4">
          {checkpoints.length > 1 && (
            <Button
              type="red"
              className="px-2 py-[6px] text-base"
              onClick={() => handleRemoveCheckpoint(index)}
              disabled={checkpoints.length < 2}
              label="Remove"
            />
          )}
          <InputWithTopHeader
            className="mx-0 w-1/2"
            placeholder="Checkpoint Name"
            value={checkpoint.checkPointName}
            onChange={(e) => handleChange(index, e.target.value)}
          />

          <Button
            type="green"
            className="px-6 py-[6px] text-base"
            onClick={handleAddCheckpoint}
            disabled={checkpoints.some(
              (checkpoint) => !checkpoint.checkPointName
            )}
            label="Add"
          />
        </div>
      ))}
      <div className="flex justify-end"></div>
    </div>
  );
};

export default CheckpointForm;
