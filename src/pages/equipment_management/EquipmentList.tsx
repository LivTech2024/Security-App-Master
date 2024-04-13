import Button from "../../common/button/Button";

const EquipmentList = () => {
  return (
    <div className="flex flex-col w-full h-full p-6 gap-6">
      <div className="flex justify-between w-full p-4 rounded bg-primaryGold text-surface items-center">
        <span className="font-semibold text-xl">Equipment Management</span>
        <div className="flex items-center gap-4">
          <Button
            label="Allot Equipment"
            onClick={() => {}}
            type="blue"
            className="px-6"
          />
          <Button
            label="Create New Equipment"
            onClick={() => {}}
            type="black"
          />
        </div>
      </div>
    </div>
  );
};

export default EquipmentList;
