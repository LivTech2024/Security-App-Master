import { useState } from "react";
import payStubReceiptImg from "../../../public/assets/pay_stub_receipt.svg";
import printingInvoiceImg from "../../../public/assets/printing_invoice.svg";
import Button from "../../common/button/Button";
import GeneratePaystubModal from "../../component/payments_and_billing/modal/GeneratePaystubModal";

const PaymentsAndBilling = () => {
  const [generatePaystubModal, setGeneratePaystubModal] = useState(false);
  return (
    <div className="flex flex-col w-full h-full p-6 gap-6">
      <div className="flex justify-between w-full p-4 rounded bg-primaryGold text-surface items-center">
        <span className="font-semibold text-xl">Payments and billing</span>
      </div>

      <GeneratePaystubModal
        opened={generatePaystubModal}
        setOpened={setGeneratePaystubModal}
      />

      <div className="bg-surface shadow rounded p-4 grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-4 p-4 rounded bg-gray-200 items-center shadow justify-between">
          <img src={payStubReceiptImg} alt="" className="w-[240px]" />
          <Button
            type="black"
            label="Generate Pay-stubs"
            onClick={() => setGeneratePaystubModal(true)}
            className="w-full"
          />
        </div>
        <div className="flex flex-col gap-4 p-4 rounded bg-gray-200 items-center shadow justify-between">
          <img src={printingInvoiceImg} alt="" className="w-[340px]" />
          <Button
            type="black"
            label="Generate Invoices"
            onClick={() => {}}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
};

export default PaymentsAndBilling;
