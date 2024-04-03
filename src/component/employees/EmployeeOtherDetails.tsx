import { Accordion } from "@mantine/core";
import InputWithTopHeader from "../../common/inputs/InputWithTopHeader";
import InputDate from "../../common/inputs/InputDate";
import { FaMoneyBillWave } from "react-icons/fa";
import EmpCertificateDetails from "./EmpCertificateDetails";

const EmployeeOtherDetails = () => {
  return (
    <div className="flex flex-col gap-4 p-4 bg-gray-100 rounded-lg shadow-md w-full">
      <div className="font-semibold">Other Details</div>
      <Accordion variant="contained">
        <Accordion.Item value="photos">
          <Accordion.Control>
            <span className="font-semibold">Add Licenses</span>
          </Accordion.Control>
          <Accordion.Panel>
            <div className="flex flex-col gap-4">
              <div className="flex gap-4">
                <InputWithTopHeader
                  className="mx-0 w-full"
                  label="Security license no."
                />
                <InputDate label="Exp. Date" />
              </div>
              <div className="flex gap-4">
                <InputWithTopHeader
                  className="mx-0 w-full"
                  label="Driving license no."
                />
                <InputDate label="Exp. Date" />
              </div>
            </div>
          </Accordion.Panel>
        </Accordion.Item>

        <Accordion.Item value="print">
          <Accordion.Control>
            <span className="font-semibold">Add Bank Details</span>{" "}
          </Accordion.Control>
          <Accordion.Panel>
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
          </Accordion.Panel>
        </Accordion.Item>

        <Accordion.Item value="camera">
          <Accordion.Control>
            <span className="font-semibold">Add Certifications</span>
          </Accordion.Control>
          <Accordion.Panel>
            <EmpCertificateDetails />
          </Accordion.Panel>
        </Accordion.Item>
      </Accordion>
    </div>
  );
};

export default EmployeeOtherDetails;
