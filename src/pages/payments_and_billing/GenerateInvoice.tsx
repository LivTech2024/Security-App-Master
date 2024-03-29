import { useState } from "react";
import {
  IInvoiceItems,
  IInvoiceTaxList,
  IInvoicesCollection,
} from "../../@types/database";
import { Timestamp } from "firebase/firestore";

const GenerateInvoice = () => {
  const [invoiceData, setInvoiceData] = useState<IInvoicesCollection>({
    InvoiceId: "",
    InvoiceCustomerName: "",
    InvoiceCustomerPhone: "",
    InvoiceCustomerAddress: "",
    InvoiceNumber: "",
    InvoiceDate: new Date() as unknown as Timestamp,
    InvoiceDueDate: new Date() as unknown as Timestamp,
    InvoiceItems: [
      { ItemName: "", ItemQuantity: 0, ItemPrice: 0, ItemTotal: 0 },
    ],
    InvoiceSubtotal: 0,
    InvoiceTaxList: [{ TaxName: "", TaxAmount: 0 }],
    InvoiceTotalAmount: 0,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInvoiceData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleItemChange = (
    index: number,
    field: keyof IInvoiceItems,
    value: string | number
  ) => {
    setInvoiceData((prevData) => {
      const updatedItems = [...prevData.InvoiceItems];
      updatedItems[index][field] = value as any;
      updatedItems[index].ItemTotal =
        updatedItems[index].ItemQuantity * updatedItems[index].ItemPrice;

      return {
        ...prevData,
        InvoiceItems: updatedItems,
        InvoiceSubtotal: updatedItems.reduce(
          (total, item) => total + item.ItemTotal,
          0
        ),
      };
    });
  };

  const handleTaxChange = (
    index: number,
    field: keyof IInvoiceTaxList,
    value: string | number
  ) => {
    setInvoiceData((prevData) => {
      const updatedTaxList = [...prevData.InvoiceTaxList];
      updatedTaxList[index][field] = value as any;

      return {
        ...prevData,
        InvoiceTaxList: updatedTaxList,
      };
    });
  };

  const handleAddItem = () => {
    setInvoiceData((prevData) => ({
      ...prevData,
      InvoiceItems: [
        ...prevData.InvoiceItems,
        { ItemName: "", ItemQuantity: 0, ItemPrice: 0, ItemTotal: 0 },
      ],
    }));
  };

  const handleAddTax = () => {
    setInvoiceData((prevData) => ({
      ...prevData,
      InvoiceTaxList: [
        ...prevData.InvoiceTaxList,
        { TaxName: "", TaxAmount: 0 },
      ],
    }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("Submitted Invoice Data:", invoiceData);
  };
  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold mb-6">Create Invoice</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Invoice ID:
          </label>
          <input
            type="text"
            name="InvoiceId"
            value={invoiceData.InvoiceId}
            onChange={handleChange}
            className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Customer Name:
          </label>
          <input
            type="text"
            name="InvoiceCustomerName"
            value={invoiceData.InvoiceCustomerName}
            onChange={handleChange}
            className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Customer Phone:
          </label>
          <input
            type="text"
            name="InvoiceCustomerPhone"
            value={invoiceData.InvoiceCustomerPhone}
            onChange={handleChange}
            className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Customer Address:
          </label>
          <input
            type="text"
            name="InvoiceCustomerAddress"
            value={invoiceData.InvoiceCustomerAddress}
            onChange={handleChange}
            className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Invoice Number:
          </label>
          <input
            type="text"
            name="InvoiceNumber"
            value={invoiceData.InvoiceNumber}
            onChange={handleChange}
            className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Invoice Date:
          </label>
          <input
            type="text"
            name="InvoiceDate"
            value={invoiceData.InvoiceDate}
            onChange={handleChange}
            className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Invoice Due Date:
          </label>
          <input
            type="text"
            name="InvoiceDueDate"
            value={invoiceData.InvoiceDueDate}
            onChange={handleChange}
            className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Subtotal:
          </label>
          <input
            type="text"
            value={invoiceData.InvoiceSubtotal}
            readOnly
            className="w-full border-gray-300 rounded-md shadow-sm focus:ring focus:ring-blue-200 focus:ring-opacity-50"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Total Amount:
          </label>
          <input
            type="text"
            value={invoiceData.InvoiceTotalAmount}
            readOnly
            className="w-full border-gray-300 rounded-md shadow-sm focus:ring focus:ring-blue-200 focus:ring-opacity-50"
          />
        </div>
        <div>
          <h2 className="text-lg font-medium text-gray-800 mt-6 mb-3">Items</h2>
          {invoiceData.InvoiceItems.map((item, index) => (
            <div key={index} className="grid grid-cols-3 gap-3">
              <input
                type="text"
                placeholder="Item Name"
                value={item.ItemName}
                onChange={(e) =>
                  handleItemChange(index, "ItemName", e.target.value)
                }
                className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              />
              <input
                type="number"
                placeholder="Quantity"
                value={item.ItemQuantity}
                onChange={(e) =>
                  handleItemChange(
                    index,
                    "ItemQuantity",
                    parseInt(e.target.value)
                  )
                }
                className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              />
              <input
                type="number"
                placeholder="Price"
                value={item.ItemPrice}
                onChange={(e) =>
                  handleItemChange(
                    index,
                    "ItemPrice",
                    parseFloat(e.target.value)
                  )
                }
                className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              />
            </div>
          ))}
          <button
            type="button"
            onClick={handleAddItem}
            className="mt-2 bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring focus:ring-blue-200 focus:ring-opacity-50"
          >
            Add Item
          </button>
        </div>

        <div>
          <h2 className="text-lg font-medium text-gray-800 mt-6 mb-3">Taxes</h2>
          {invoiceData.InvoiceTaxList.map((tax, index) => (
            <div key={index} className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Tax Name"
                value={tax.TaxName}
                onChange={(e) =>
                  handleTaxChange(index, "TaxName", e.target.value)
                }
                className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              />
              <input
                type="number"
                placeholder="Tax Amount"
                value={tax.TaxAmount}
                onChange={(e) =>
                  handleTaxChange(
                    index,
                    "TaxAmount",
                    parseFloat(e.target.value)
                  )
                }
                className="w-full border-gray-300 rounded-md shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              />
            </div>
          ))}
          <button
            type="button"
            onClick={handleAddTax}
            className="mt-2 bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring focus:ring-blue-200 focus:ring-opacity-50"
          >
            Add Tax
          </button>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring focus:ring-blue-200 focus:ring-opacity-50"
        >
          Create Invoice
        </button>
      </form>
    </div>
  );
};

export default GenerateInvoice;
