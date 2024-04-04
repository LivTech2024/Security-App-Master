import { Accordion } from "@mantine/core";
import EmpCertificateDetails from "./EmpCertificateDetails";
import EmpLicenses from "./EmpLicenses";
import EmpBankDetails from "./EmpBankDetails";
import { IEmpBankDetails } from "../../@types/database";

export interface EmpLicenseDetails {
  LicenseType: "driving" | "security";
  LicenseNumber: string;
  LicenseExpDate: Date | null;
}

interface EmployeeOtherDetailsProps {
  empLicenseDetails: EmpLicenseDetails[];
  setEmpLicenseDetails: React.Dispatch<
    React.SetStateAction<EmpLicenseDetails[]>
  >;
  empBankDetails: IEmpBankDetails;
  setEmpBankDetails: React.Dispatch<React.SetStateAction<IEmpBankDetails>>;
}

const EmployeeOtherDetails = ({
  empLicenseDetails,
  setEmpLicenseDetails,
  empBankDetails,
  setEmpBankDetails,
}: EmployeeOtherDetailsProps) => {
  return (
    <div className="flex flex-col gap-4 p-4 bg-gray-100 rounded-lg shadow-md w-full">
      <div className="font-semibold">Other Details</div>
      <Accordion variant="contained">
        <Accordion.Item value="photos">
          <Accordion.Control>
            <span className="font-semibold">Add Licenses</span>
          </Accordion.Control>
          <Accordion.Panel>
            <EmpLicenses
              empLicenseDetails={empLicenseDetails}
              setEmpLicenseDetails={setEmpLicenseDetails}
            />
          </Accordion.Panel>
        </Accordion.Item>

        <Accordion.Item value="print">
          <Accordion.Control>
            <span className="font-semibold">Add Bank Details</span>
          </Accordion.Control>
          <Accordion.Panel>
            <EmpBankDetails
              empBankDetails={empBankDetails}
              setEmpBankDetails={setEmpBankDetails}
            />
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
