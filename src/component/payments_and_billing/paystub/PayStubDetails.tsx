import InputDate from '../../../common/inputs/InputDate';
import InputWithTopHeader from '../../../common/inputs/InputWithTopHeader';

const PayStubDetails = () => {
  return (
    <div className="flex flex-col gap-4 bg-surface shadow rounded p-4 items-start  h-full w-2/3">
      <div className="font-semibold">Pay Stub Details</div>
      <div className="flex items-center gap-4 w-full">
        <InputDate
          label="Pay period start date"
          //value={startDate}
          //setValue={setStartDate}
        />
        <InputDate
          label="Pay period start date"
          //value={endDate}
          //setValue={setEndDate}
        />
      </div>
      <div className="flex items-center gap-4 w-full">
        <InputDate
          label="Pay Date"
          //value={endDate}
          //setValue={setEndDate}
        />
        <InputWithTopHeader label="Reference No." className="mx-0 w-full" />
      </div>
    </div>
  );
};

export default PayStubDetails;
