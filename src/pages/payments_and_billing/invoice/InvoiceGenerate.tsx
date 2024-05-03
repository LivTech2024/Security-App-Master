/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from 'react';
import { IoIosCloseCircleOutline } from 'react-icons/io';
import { IInvoiceItems, IInvoiceTaxList } from '../../../@types/database';
import {
  InvoiceFormFields,
  invoiceSchema,
} from '../../../utilities/zod/schema';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import InputWithTopHeader from '../../../common/inputs/InputWithTopHeader';
import TextareaWithTopHeader from '../../../common/inputs/TextareaWithTopHeader';
import InputDate from '../../../common/inputs/InputDate';
import Button from '../../../common/button/Button';
import CustomError, { errorHandler } from '../../../utilities/CustomError';
import {
  closeModalLoader,
  showModalLoader,
  showSnackbar,
} from '../../../utilities/TsxUtils';
import { FaRegTrashAlt } from 'react-icons/fa';
import { useAuthState } from '../../../store';
import DbPayment from '../../../firebase_configs/DB/DbPayment';
import { useNavigate } from 'react-router-dom';
import { PageRoutes } from '../../../@types/enum';
import useFetchClients from '../../../hooks/fetch/useFetchClients';
import InputAutoComplete from '../../../common/inputs/InputAutocomplete';

const numberToString = (value: number) => {
  return String(value) as unknown as number;
};

const InvoiceGenerate = () => {
  const { company } = useAuthState();

  const methods = useForm<InvoiceFormFields>({
    resolver: zodResolver(invoiceSchema),
  });

  const [invoiceItems, setInvoiceItems] = useState<IInvoiceItems[]>([
    { ItemDescription: '', ItemPrice: 0, ItemQuantity: 1, ItemTotal: 0 },
  ]);

  const [invoiceTaxList, setInvoiceTaxList] = useState<IInvoiceTaxList[]>([]);

  const [invoiceDate, setInvoiceDate] = useState<Date | null>(null);

  const [invoiceDueDate, setInvoiceDueDate] = useState<Date | null>(null);

  const [clientSearchQuery, setClientSearchQuery] = useState<
    string | null | undefined
  >('');

  const { data: clients } = useFetchClients({
    limit: 5,
    searchQuery: clientSearchQuery,
  });

  useEffect(() => {
    const selectedClient = clients.find(
      (c) => c.ClientName === clientSearchQuery
    );

    if (selectedClient) {
      methods.setValue('InvoiceClientName', selectedClient.ClientName);
      methods.setValue('InvoiceClientId', selectedClient.ClientId);
      methods.setValue('InvoiceClientAddress', selectedClient.ClientAddress);
      methods.setValue('InvoiceClientPhone', selectedClient.ClientPhone);
    } else {
      methods.setValue('InvoiceClientName', '');
      methods.setValue('InvoiceClientId', '');
      methods.setValue('InvoiceClientAddress', '');
      methods.setValue('InvoiceClientPhone', '');
    }
  }, [clientSearchQuery]);

  useEffect(() => {
    console.log(methods.formState.errors);
  }, [methods.formState.errors]);

  useEffect(() => {
    if (invoiceDate) {
      methods.setValue('InvoiceDate', invoiceDate);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoiceDate]);

  useEffect(() => {
    if (invoiceDueDate) {
      methods.setValue('InvoiceDueDate', invoiceDueDate);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoiceDueDate]);

  const handleItemChange = (
    index: number,
    field: keyof IInvoiceItems,
    value: string | number
  ) => {
    setInvoiceItems((prevItems) => {
      const updatedItems = [...prevItems];
      (updatedItems[index] as any)[field] = value;
      updatedItems[index].ItemTotal =
        Number(updatedItems[index].ItemQuantity) *
        Number(updatedItems[index].ItemPrice);

      return updatedItems;
    });
  };

  const handleTaxChange = (
    index: number,
    field: keyof IInvoiceTaxList,
    value: string | number
  ) => {
    setInvoiceTaxList((prevTaxList) => {
      const updatedTaxList = [...prevTaxList];
      (updatedTaxList[index] as any)[field] = value;

      return updatedTaxList;
    });
  };

  const handleAddItem = () => {
    if (
      invoiceItems.some((item) => {
        if (!item.ItemDescription || !item.ItemPrice || !item.ItemQuantity) {
          return true;
        }
      })
    ) {
      showSnackbar({
        message: 'Please fill the empty row to add new',
        type: 'error',
      });
      return;
    }
    setInvoiceItems((prev) => [
      ...prev,
      { ItemDescription: '', ItemPrice: 0, ItemQuantity: 1, ItemTotal: 0 },
    ]);
  };

  const handleAddTax = () => {
    setInvoiceTaxList((prev) => [...prev, { TaxName: '', TaxAmount: 0 }]);
  };

  useEffect(() => {
    const subTotal = invoiceItems.reduce(
      (acc, obj) => acc + Number(obj.ItemTotal),
      0
    );

    const totalTaxAmt =
      invoiceTaxList.reduce((acc, obj) => acc + Number(obj.TaxAmount), 0) || 0;

    methods.setValue('InvoiceSubtotal', numberToString(subTotal));

    methods.setValue(
      'InvoiceTotalAmount',
      numberToString(subTotal + totalTaxAmt)
    );
  }, [invoiceItems, invoiceTaxList]);

  const navigate = useNavigate();

  const onSubmit = async (data: InvoiceFormFields) => {
    if (!company) return;
    console.log(data, 'data', invoiceItems, invoiceTaxList);
    try {
      if (
        invoiceItems.length === 0 ||
        invoiceItems.some((item) => {
          if (!item.ItemDescription || !item.ItemPrice || !item.ItemQuantity) {
            return true;
          }
        })
      ) {
        throw new CustomError('Please add items to generate invoice');
      }

      showModalLoader({});

      await DbPayment.createInvoice({
        cmpId: company.CompanyId,
        data,
        items: invoiceItems,
        taxes: invoiceTaxList,
      });

      showSnackbar({
        message: 'Invoice created successfully',
        type: 'success',
      });
      closeModalLoader();

      navigate(PageRoutes.INVOICE_LIST);
    } catch (error) {
      console.log(error);
      errorHandler(error);
      closeModalLoader();
    }
  };

  return (
    <div className="flex flex-col w-full h-full p-6 gap-6">
      <div className="flex justify-between w-full p-4 rounded bg-primaryGold text-surface items-center">
        <span className="font-semibold text-xl">Create new invoice</span>

        <Button
          label="Save"
          onClick={methods.handleSubmit(onSubmit)}
          type="black"
          className="px-6 py-2"
        />
      </div>
      <FormProvider {...methods}>
        <form
          onSubmit={methods.handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
        >
          <div className="flex gap-4 justify-between">
            <div className="flex flex-col bg-surface shadow p-4 rounded gap-4 w-[60%] max-w-2xl justify-start">
              <div className="font-semibold">Bill To.</div>
              <InputAutoComplete
                label="Client"
                value={clientSearchQuery}
                onChange={setClientSearchQuery}
                data={clients.map((data) => {
                  return { label: data.ClientName, value: data.ClientName };
                })}
              />
            </div>
            <div className="flex flex-col bg-surface shadow p-4 rounded gap-4 w-[40%] max-w-xl justify-start">
              <div className="font-semibold">Transaction details</div>
              <div className="flex flex-col gap-4">
                <InputWithTopHeader
                  className="mx-0"
                  label="Invoice No."
                  register={methods.register}
                  decimalCount={0}
                  name="InvoiceNumber"
                  error={methods.formState.errors?.InvoiceNumber?.message}
                />
                <InputDate
                  label="Invoice date"
                  value={invoiceDate}
                  setValue={setInvoiceDate}
                  error={methods.formState.errors?.InvoiceDate?.message}
                />

                <InputDate
                  label="Due date"
                  value={invoiceDueDate}
                  setValue={setInvoiceDueDate}
                  error={methods.formState.errors?.InvoiceDueDate?.message}
                />
              </div>
            </div>
          </div>

          {/* Item details */}
          <div className="flex flex-col gap-4 bg-surface shadow rounded p-4">
            <div className="font-semibold">Enter items details</div>
            <div className="grid grid-cols-4 gap-4 bg-onHoverBg p-2 rounded">
              <div className="font-semibold">Description</div>
              <div className="font-semibold">Quantity</div>
              <div className="font-semibold">Rate</div>
              <div className="font-semibold">Amount</div>
            </div>
            {invoiceItems.map((item, index) => (
              <div key={index} className="grid grid-cols-4 gap-4">
                <div className="flex items-center gap-2 w-full">
                  <FaRegTrashAlt
                    onClick={() => {
                      if (invoiceItems.length <= 1) return;
                      setInvoiceItems((prev) =>
                        prev.filter((_, idx) => idx !== index)
                      );
                    }}
                    className="cursor-pointer text-lg hover:scale-105"
                  />
                  <InputWithTopHeader
                    className="mx-0 w-full"
                    placeholder="Description"
                    value={item.ItemDescription}
                    onChange={(e) =>
                      handleItemChange(index, 'ItemDescription', e.target.value)
                    }
                  />
                </div>

                <InputWithTopHeader
                  className="mx-0"
                  placeholder="Quantity"
                  value={item.ItemQuantity}
                  decimalCount={2}
                  onChange={(e) =>
                    handleItemChange(index, 'ItemQuantity', e.target.value)
                  }
                />

                <InputWithTopHeader
                  className="mx-0"
                  placeholder="Price"
                  value={item.ItemPrice}
                  decimalCount={2}
                  leadingIcon={<div>$</div>}
                  onChange={(e) =>
                    handleItemChange(index, 'ItemPrice', e.target.value)
                  }
                />

                <InputWithTopHeader
                  className="mx-0"
                  placeholder="Price"
                  leadingIcon={<div>$</div>}
                  value={item.ItemTotal}
                  decimalCount={2}
                  disabled
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

          <div className="flex gap-4 w-full justify-between">
            <div className="flex flex-col max-w-xl gap-4 bg-surface shadow rounded p-4 w-full">
              <div className="font-semibold">Other details</div>
              <TextareaWithTopHeader
                className="mx-0"
                title="Description"
                register={methods.register}
                name="InvoiceDescription"
                error={methods.formState.errors.InvoiceDescription?.message}
              />
              <InputWithTopHeader
                className="mx-0"
                label="Terms & Condition"
                register={methods.register}
                name="InvoiceTerms"
                error={methods.formState.errors.InvoiceTerms?.message}
              />
            </div>

            <div className="flex flex-col gap-4 bg-surface shadow rounded p-4 w-full max-w-lg">
              <div className="font-semibold">Pricing details</div>
              <InputWithTopHeader
                className="mx-0"
                label="Subtotal"
                register={methods.register}
                name="InvoiceSubtotal"
                error={methods.formState.errors.InvoiceSubtotal?.message}
                leadingIcon={<div>$</div>}
              />

              {/* Tax details */}

              <div className="flex flex-col gap-4">
                {invoiceTaxList.map((tax, index) => (
                  <div key={index} className="flex items-end gap-2">
                    <InputWithTopHeader
                      label="Tax name"
                      className="mx-0"
                      value={tax.TaxName}
                      onChange={(e) =>
                        handleTaxChange(index, 'TaxName', e.target.value)
                      }
                    />
                    <InputWithTopHeader
                      label="Tax amount"
                      className="mx-0"
                      value={tax.TaxAmount}
                      onChange={(e) =>
                        handleTaxChange(index, 'TaxAmount', e.target.value)
                      }
                      leadingIcon={<div>$</div>}
                    />
                    <IoIosCloseCircleOutline
                      onClick={() =>
                        setInvoiceTaxList((prev) =>
                          prev.filter((_, idx) => idx !== index)
                        )
                      }
                      className="text-3xl cursor-pointer mb-1"
                    />
                  </div>
                ))}
                <Button label="Add tax" onClick={handleAddTax} type="black" />
              </div>

              <InputWithTopHeader
                className="mx-0"
                fontClassName="font-semibold text-lg"
                label="Total Amount"
                register={methods.register}
                name="InvoiceTotalAmount"
                error={methods.formState.errors.InvoiceTotalAmount?.message}
                leadingIcon={<div>$</div>}
              />

              <InputWithTopHeader
                className="mx-0"
                label="Received Amount"
                register={methods.register}
                name="InvoiceReceivedAmount"
                error={methods.formState.errors.InvoiceReceivedAmount?.message}
                leadingIcon={<div>$</div>}
              />
            </div>
          </div>
        </form>
      </FormProvider>
    </div>
  );
};

export default InvoiceGenerate;
