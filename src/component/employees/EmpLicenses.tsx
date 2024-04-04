import React from "react";
import { EmpLicenseDetails } from "./EmployeeOtherDetails";
import InputWithTopHeader from "../../common/inputs/InputWithTopHeader";
import InputDate from "../../common/inputs/InputDate";

const EmpLicenses = ({
  empLicenseDetails,
  setEmpLicenseDetails,
}: {
  empLicenseDetails: EmpLicenseDetails[];
  setEmpLicenseDetails: React.Dispatch<
    React.SetStateAction<EmpLicenseDetails[]>
  >;
}) => {
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
    <div className="grid grid-cols-2 gap-4">
      <InputWithTopHeader
        className="mx-0 w-full"
        label="Security license no."
        value={
          empLicenseDetails
            .find((l) => l.LicenseType === "security")
            ?.LicenseNumber.toString() || ""
        }
        onChange={(e) => handleChangeLicenseNumber("security", e.target.value)}
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
        onChange={(e) => handleChangeLicenseNumber("driving", e.target.value)}
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
  );
};

export default EmpLicenses;
