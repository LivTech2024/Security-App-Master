import { Accordion } from "@mantine/core";
import InputWithTopHeader from "../../common/inputs/InputWithTopHeader";
import InputDate from "../../common/inputs/InputDate";
import { FaMoneyBillWave } from "react-icons/fa";
import EmpCertificateDetails from "./EmpCertificateDetails";

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
}

const EmployeeOtherDetails = ({
  empLicenseDetails,
  setEmpLicenseDetails,
}: EmployeeOtherDetailsProps) => {
  const handleChangeLicenseNumber = (
    licenseType: "driving" | "security",
    newLicenseNumber: string
  ) => {
    setEmpLicenseDetails((prev) => {
      const existingLicense = prev.find(
        (detail) => detail.LicenseType === licenseType
      );
      if (existingLicense) {
        const updatedLicenseDetails = prev.map((detail) => {
          if (detail.LicenseType === licenseType) {
            return { ...detail, LicenseNumber: newLicenseNumber };
          }
          return detail;
        });
        return updatedLicenseDetails;
      } else {
        return [
          ...prev,
          {
            LicenseType: licenseType,
            LicenseNumber: newLicenseNumber,
            LicenseExpDate: null,
          },
        ];
      }
    });
  };

  const handleChangeExpDate = (
    licenseType: "driving" | "security",
    newExpDate: Date
  ) => {
    setEmpLicenseDetails((prev) => {
      const existingLicense = prev.find(
        (detail) => detail.LicenseType === licenseType
      );
      if (existingLicense) {
        const updatedLicenseDetails = prev.map((detail) => {
          if (detail.LicenseType === licenseType) {
            return {
              ...detail,
              LicenseExpDate: newExpDate,
            };
          }
          return detail;
        });
        return updatedLicenseDetails;
      } else {
        return [
          ...prev,
          {
            LicenseType: licenseType,
            LicenseNumber: "",
            LicenseExpDate: newExpDate,
          },
        ];
      }
    });
  };
  return (
    <div className="flex flex-col gap-4 p-4 bg-gray-100 rounded-lg shadow-md w-full">
      <div className="font-semibold">Other Details</div>
      <Accordion variant="contained">
        <Accordion.Item value="photos">
          <Accordion.Control>
            <span className="font-semibold">Add Licenses</span>
          </Accordion.Control>
          <Accordion.Panel>
            <div className="grid grid-cols-2 gap-4">
              <InputWithTopHeader
                className="mx-0 w-full"
                label="Security license no."
                value={
                  empLicenseDetails
                    .find((l) => l.LicenseType === "security")
                    ?.LicenseNumber.toString() || ""
                }
                onChange={(e) =>
                  handleChangeLicenseNumber("security", e.target.value)
                }
              />
              <InputDate
                label="Exp. Date"
                value={
                  empLicenseDetails.find((l) => l.LicenseType === "security")
                    ?.LicenseExpDate
                }
                id="exp1"
                setValue={(e) => handleChangeExpDate("security", e as Date)}
              />

              <InputWithTopHeader
                className="mx-0 w-full"
                label="Driving license no."
                value={
                  empLicenseDetails
                    .find((l) => l.LicenseType === "driving")
                    ?.LicenseNumber.toString() || ""
                }
                onChange={(e) =>
                  handleChangeLicenseNumber("driving", e.target.value)
                }
              />
              <InputDate
                label="Exp. Date"
                value={
                  empLicenseDetails.find((l) => l.LicenseType === "driving")
                    ?.LicenseExpDate
                }
                id="exp2"
                setValue={(e) => handleChangeExpDate("driving", e as Date)}
              />
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
