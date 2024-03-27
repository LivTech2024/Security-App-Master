import { useState } from "react";
import Dialog from "../../../common/Dialog";
import useFetchEmployees from "../../../hooks/fetch/useFetchEmployees";
import InputAutoComplete from "../../../common/inputs/InputAutocomplete";
import InputDate from "../../../common/inputs/InputDate";
import {
  closeModalLoader,
  showModalLoader,
  showSnackbar,
} from "../../../utilities/TsxUtils";
import { getPaystubHtml } from "../../../utilities/getPaystubHtml";
import { useAuthState } from "../../../store";
import dayjs from "dayjs";
import { errorHandler } from "../../../utilities/CustomError";
import { htmlStringToPdf } from "../../../utilities/htmlStringToPdf";

const GeneratePaystubModal = ({
  opened,
  setOpened,
}: {
  opened: boolean;
  setOpened: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const [selectedEmp, setSelectedEmp] = useState<string | null | undefined>(
    null
  );

  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const { data: employees } = useFetchEmployees({
    limit: 5,
    searchQuery: selectedEmp,
  });

  const { company } = useAuthState();

  const onSubmit = async () => {
    if (!company) return;
    if (!startDate) {
      showSnackbar({
        message: "Please enter pay period start date",
        type: "error",
      });
      return;
    }
    if (!endDate) {
      showSnackbar({
        message: "Please enter pay period end date",
        type: "error",
      });
      return;
    }
    const employee = employees.find((e) => e.EmployeeName === selectedEmp);

    if (!employee) return;

    const html = getPaystubHtml({
      companyName: company.CompanyName,
      empHourlyRate: employee.EmployeePayRate,
      empName: employee.EmployeeName,
      empWorkedHours: 25,
      endDate: dayjs(endDate).format("MMMM DD,YYYY"),
      startDate: dayjs(startDate).format("MMMM DD,YYYY"),
    });

    try {
      showModalLoader({});

      await htmlStringToPdf(`${employee.EmployeeName}_paystub.pdf`, html);

      closeModalLoader();
      setOpened(false);
    } catch (error) {
      console.log(error);
      errorHandler(error);
      closeModalLoader();
    }
  };

  return (
    <Dialog
      opened={opened}
      setOpened={setOpened}
      title="Generate paystub for your employees"
      size="60%"
      positiveLabel="Generate"
      positiveCallback={onSubmit}
      isFormModal
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <InputDate
            label="Pay period start date"
            value={startDate}
            setValue={setStartDate}
          />
          <InputDate
            label="Pay period start date"
            value={endDate}
            setValue={setEndDate}
          />
        </div>
        <InputAutoComplete
          onChange={setSelectedEmp}
          value={selectedEmp}
          label="Select employee"
          data={employees.map((res) => {
            return { label: res.EmployeeName, value: res.EmployeeName };
          })}
        />
      </div>
    </Dialog>
  );
};

export default GeneratePaystubModal;
