import { FaMoneyBillWave } from "react-icons/fa";
import InputWithTopHeader from "../../common/inputs/InputWithTopHeader";

const EmpBankDetails = () => {
  return (
    <div className="flex flex-col gap-4">
      <label className="flex flex-col items-center border border-dashed border-black rounded-md p-4 cursor-pointer">
        <input type="file" accept="image/*" hidden />
        <FaMoneyBillWave className="text-3xl" />
        <span className="text-textPrimaryBlue cursor-pointer">
          Upload void check
        </span>
      </label>
      {/* Bank details form */}
      <div className="grid grid-cols-2 gap-4">
        <InputWithTopHeader className="mx-0" label="Account Name" />
        <InputWithTopHeader className="mx-0" label="Bank Name" />
        <InputWithTopHeader className="mx-0" label="Account Number" />
        <InputWithTopHeader className="mx-0" label="IFSC Code" />
      </div>
    </div>
  );
};

export default EmpBankDetails;
