import Button from '../../common/button/Button';
import { useNavigate } from 'react-router-dom';
import { PageRoutes } from '../../@types/enum';
import PageHeader from '../../common/PageHeader';

const PaymentsAndBilling = () => {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col w-full h-full p-6 gap-6">
      <PageHeader title="Payments and billing" />

      <div className="bg-surface shadow rounded p-4 grid grid-cols-2 gap-4">
        <div
          onClick={() => navigate(PageRoutes.EXPENSE_LIST)}
          className="flex flex-col gap-4 p-4 rounded bg-gray-200 items-center shadow justify-between cursor-pointer"
        >
          <img src="public/assets/expense.svg" alt="" className="w-[240px]" />
          <Button
            type="black"
            label="Expenses"
            onClick={() => navigate(PageRoutes.EXPENSE_LIST)}
            className="w-full"
          />
        </div>

        <div
          onClick={() => navigate(PageRoutes.INVOICE_LIST)}
          className="flex flex-col gap-4 p-4 rounded bg-gray-200 items-center shadow justify-between cursor-pointer"
        >
          <img
            src="/public/assets/printing_invoice.svg"
            alt=""
            className="w-[340px]"
          />
          <Button
            type="black"
            label="Invoices"
            onClick={() => navigate(PageRoutes.INVOICE_LIST)}
            className="w-full"
          />
        </div>
        <div
          onClick={() => navigate(PageRoutes.PAY_STUB_LIST)}
          className="flex flex-col gap-4 p-4 rounded bg-gray-200 items-center shadow justify-between cursor-pointer"
        >
          <img
            src="public/assets/pay_stub_receipt.svg"
            alt=""
            className="w-[240px]"
          />
          <Button
            type="black"
            label="Pay-stubs"
            onClick={() => navigate(PageRoutes.PAY_STUB_LIST)}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
};

export default PaymentsAndBilling;
