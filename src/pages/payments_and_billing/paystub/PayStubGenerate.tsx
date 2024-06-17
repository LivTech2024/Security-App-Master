import { useState } from 'react';
import PageHeader from '../../../common/PageHeader';
import Button from '../../../common/button/Button';
import useFetchEmployees from '../../../hooks/fetch/useFetchEmployees';
import { useAuthState } from '../../../store';
import {
  closeModalLoader,
  showModalLoader,
  showSnackbar,
} from '../../../utilities/TsxUtils';
import { getPaystubHtml } from '../../../utilities/pdf/getPaystubHtml';
import dayjs from 'dayjs';
import { htmlToPdf } from '../../../API/HtmlToPdf';
import { downloadPdf } from '../../../utilities/pdf/common/downloadPdf';
import { errorHandler } from '../../../utilities/CustomError';
import InputAutoComplete from '../../../common/inputs/InputAutocomplete';
import InputDate from '../../../common/inputs/InputDate';

const PayStubGenerate = () => {
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
        message: 'Please enter pay period start date',
        type: 'error',
      });
      return;
    }
    if (!endDate) {
      showSnackbar({
        message: 'Please enter pay period end date',
        type: 'error',
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
      endDate: dayjs(endDate).format('MMMM DD,YYYY'),
      startDate: dayjs(startDate).format('MMMM DD,YYYY'),
    });

    try {
      showModalLoader({});

      const fileName = `${employee.EmployeeName}_paystub.pdf`;

      const response = await htmlToPdf({ html, file_name: fileName });

      downloadPdf(response, fileName);

      closeModalLoader();
    } catch (error) {
      console.log(error);
      errorHandler(error);
      closeModalLoader();
    }
  };

  return (
    <div className="flex flex-col w-full h-full p-6 gap-6">
      <PageHeader
        title="Create new paystub"
        rightSection={<Button label="Save" onClick={onSubmit} type="black" />}
      />
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
    </div>
  );
};

export default PayStubGenerate;
