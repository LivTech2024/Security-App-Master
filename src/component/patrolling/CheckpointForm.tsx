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

  const handleChange = (
    index: number,
    key: "checkPointName",
    value: string
  ) => {
    const updatedCheckpoints = [...checkpoints];
    updatedCheckpoints[index][key] = value;
    setCheckpoints(updatedCheckpoints);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
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
            <div className="flex items-center gap-4">
              <InputWithTopHeader
                className="mx-0 w-full"
                placeholder="Checkpoint Name"
                value={checkpoint.checkPointName}
                onChange={(e) =>
                  handleChange(index, "checkPointName", e.target.value)
                }
              />
            </div>
          </div>
        ))}
      </div>
      <Button
        type="green"
        className="px-6 py-[6px] text-base w-fit"
        onClick={handleAddCheckpoint}
        disabled={checkpoints.some((checkpoint) => !checkpoint.checkPointName)}
        label="Add new"
      />
    </div>
  );
};

export default CheckpointForm;
