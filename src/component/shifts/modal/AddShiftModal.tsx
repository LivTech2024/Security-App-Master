import React, { useEffect, useState } from "react";
import Dialog from "../../../common/Dialog";
import InputSelect from "../../../common/inputs/InputSelect";
import { z } from "zod";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import InputDate from "../../../common/inputs/InputDate";
import TextareaWithTopHeader from "../../../common/inputs/TextareaWithTopHeader";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import InputTime from "../../../common/inputs/InputTime";
import InputWithTopHeader from "../../../common/inputs/InputWithTopHeader";

const addShiftFormSchema = z.object({
  position: z.enum(["supervisor", "guard", "other"]),
  date: z.date().default(new Date()),
  start_time: z.string().min(2, { message: "Start time is required" }),
  end_time: z.string().min(2, { message: "End time is required" }),
  description: z.string().nullable().optional(),
  name: z.string().min(2, { message: "Shift name is required" }),
});

export type AddShiftFormFields = z.infer<typeof addShiftFormSchema>;

const AddShiftModal = ({
  opened,
  setOpened,
}: {
  opened: boolean;
  setOpened: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const methods = useForm<AddShiftFormFields>({
    resolver: zodResolver(addShiftFormSchema),
  });

  const [shiftDate, setShiftDate] = useState<Date | null>(new Date());

  const [startTime, setStartTime] = useState("06:00 AM");

  const [endTime, setEndTime] = useState("10:00 PM");

  useEffect(() => {
    if (shiftDate) {
      methods.setValue("date", shiftDate);
    }
  }, [shiftDate]);

  useEffect(() => {
    if (startTime) {
      methods.setValue("start_time", startTime);
    }
  }, [startTime]);

  useEffect(() => {
    if (endTime) {
      methods.setValue("end_time", endTime);
    }
  }, [endTime]);

  const onSubmit = async (data: AddShiftFormFields) => {
    try {
      const res = await fetch("/api/shift/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      const responseData = await res.json();
      if (!res.ok) {
        toast.error(responseData.message);
        return;
      }
      if (res.ok) {
        methods.reset();
        setOpened(false);
        toast.success("Shift added successfully");
      }
    } catch (error) {
      toast.error("Something went wrong!");
    }
  };

  return (
    <>
      <Dialog
        opened={opened}
        setOpened={setOpened}
        title="Add Shift"
        size="80%"
        isFormModal
        positiveCallback={methods.handleSubmit(onSubmit)}
      >
        <FormProvider {...methods}>
          <form
            onSubmit={methods.handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <InputSelect
                label="Select Position"
                options={[
                  { title: "Supervisor", value: "supervisor" },
                  { title: "Guard", value: "guard" },
                  { title: "Other", value: "other" },
                ]}
                register={methods.register}
                name="position"
                error={methods.formState.errors.position?.message}
              />

              <InputWithTopHeader
                className="mx-0"
                label="Shift name"
                register={methods.register}
                name="name"
                error={methods.formState.errors?.name?.message}
              />

              <InputDate
                label="Date"
                value={shiftDate}
                setValue={setShiftDate}
              />

              <InputTime
                label="Start time"
                value={startTime}
                onChange={setStartTime}
                use12Hours={true}
              />

              <InputTime
                label="End time"
                value={endTime}
                onChange={setEndTime}
                use12Hours={true}
              />

              <div className="col-span-2">
                <TextareaWithTopHeader
                  title="Description"
                  className="mx-0"
                  register={methods.register}
                  name="description"
                />
              </div>
            </div>
          </form>
        </FormProvider>
      </Dialog>
      <ToastContainer />
    </>
  );
};

export default AddShiftModal;
