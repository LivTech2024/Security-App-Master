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
import InputDate from '../../../common/inputs/InputDate';
import InputSelect from '../../../common/inputs/InputSelect';
import InputWithTopHeader from '../../../common/inputs/InputWithTopHeader';
import PayStubDetails from '../../../component/payments_and_billing/paystub/PayStubDetails';
import EmpDetails from '../../../component/payments_and_billing/paystub/EmpDetails';

const PayStubGenerate = () => {
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const [empSearchQuery, setEmpSearchQuery] = useState('');

  const { data: employees } = useFetchEmployees({
    limit: 5,
    searchQuery: empSearchQuery,
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
    const employee = employees.find((e) => e.EmployeeName === empSearchQuery);

    if (!employee) return;

    const html = getPaystubHtml({
      companyDetails: company,
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
    <div className="flex flex-col w-full h-full p-6 gap-6 text-center">
      <PageHeader
        title="Create new paystub"
        rightSection={<Button label="Save" onClick={onSubmit} type="black" />}
      />
      <div className="flex flex-col gap-4 w-full h-full">
        <div className="flex  gap-4 w-full h-full">
          <PayStubDetails />
          <EmpDetails />
        </div>

        {/* Earnings and deduction details */}
        <div className="flex  gap-4 w-full h-full">
          <div className="flex flex-col gap-4 bg-surface shadow rounded p-4 items-start  h-full w-full">
            <div className="font-semibold">Earnings Details</div>
          </div>
          <div className="flex flex-col gap-4 bg-surface shadow rounded p-4 items-start  h-full w-full">
            <div className="font-semibold">Deduction Details</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayStubGenerate;
