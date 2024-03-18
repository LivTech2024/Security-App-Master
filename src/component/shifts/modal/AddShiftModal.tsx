import React, { useEffect, useState } from "react";
import Dialog from "../../../common/Dialog";
import InputSelect from "../../../common/inputs/InputSelect";
import { z } from "zod";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import InputDate from "../../../common/inputs/InputDate";
import TextareaWithTopHeader from "../../../common/inputs/TextareaWithTopHeader";
import "react-toastify/dist/ReactToastify.css";
import InputTime from "../../../common/inputs/InputTime";
import InputWithTopHeader from "../../../common/inputs/InputWithTopHeader";
import { ShiftPositions } from "../../../@types/database";
import { useEditFormStore } from "../../../store";
import { useQueryClient } from "@tanstack/react-query";
import {
  closeModalLoader,
  showModalLoader,
  showSnackbar,
} from "../../../utilities/TsxUtils";
import DbShift from "../../../firebase_configs/DB/DbShift";
import { REACT_QUERY_KEYS } from "../../../@types/enum";
import { errorHandler } from "../../../utilities/CustomError";
import { openContextModal } from "@mantine/modals";

const addShiftFormSchema = z.object({
  position: z.enum([
    ShiftPositions.guard,
    ShiftPositions.supervisor,
    ShiftPositions.other,
  ]),
  date: z.date().default(new Date()),
  start_time: z.string().min(2, { message: "Start time is required" }),
  end_time: z.string().min(2, { message: "End time is required" }),
  description: z.string().nullable().optional(),
  name: z.string().min(2, { message: "Shift name is required" }),
  location: z.string().min(3, { message: "Location is required" }),
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

  const { shiftEditData } = useEditFormStore();

  const isEdit = !!shiftEditData;

  const queryClient = useQueryClient();

  useEffect(() => {
    console.log(methods.formState.errors);
  }, [methods.formState]);

  useEffect(() => {
    let allFieldValues: AddShiftFormFields = {
      position: ShiftPositions.guard,
      date: new Date(),
      start_time: "06:00 AM",
      end_time: "10:00 PM",
      name: "",
      location: "",
      description: "",
    };
    if (isEdit) {
      setStartTime(shiftEditData.ShiftStartTime);
      setEndTime(shiftEditData.ShiftEndTime);
      setShiftDate(new Date(shiftEditData.ShiftDate));
      allFieldValues = {
        position: shiftEditData.ShiftPosition,
        date: new Date(shiftEditData.ShiftDate),
        start_time: shiftEditData.ShiftStartTime,
        end_time: shiftEditData.ShiftEndTime,
        name: shiftEditData.ShiftName,
        location: shiftEditData.ShiftLocation,
        description: shiftEditData.ShiftDescription,
      };
    }

    methods.reset(allFieldValues);
  }, [isEdit, shiftEditData, methods, opened]);

  /* const getLatLng = () => {
    setKey("AIzaSyCXI2H1SSthFqN3zLiYYNbEzlReufuG-_U");
    fromAddress("1600 Amphitheatre Parkway, Mountain View, CA")
      .then((response) => {
        const { lat, lng } = response.results[0].geometry.location;
        console.log(lat, lng, "lat, lng");
      })
      .catch((error) => {
        console.log(error);
      });
  };

  useEffect(() => {
    if (!opened) return;
    getLatLng();
  }, [opened]); */

  const onSubmit = async (data: AddShiftFormFields) => {
    try {
      showModalLoader({});

      if (isEdit) {
        await DbShift.updateShift(data, shiftEditData.ShiftId);
      } else {
        await DbShift.addShift(data);
      }

      await queryClient.invalidateQueries({
        queryKey: [REACT_QUERY_KEYS.SHIFT_LIST],
      });

      await queryClient.invalidateQueries({
        queryKey: [REACT_QUERY_KEYS.SCHEDULES],
      });

      closeModalLoader();
      setOpened(false);
      showSnackbar({
        message: "Shift created successfully",
        type: "success",
      });
      methods.reset();
    } catch (error) {
      console.log(error);
      closeModalLoader();
      errorHandler(error);
    }
  };

  const onDelete = async () => {
    if (!isEdit) return;
    try {
      showModalLoader({});

      await DbShift.deleteShift(shiftEditData.ShiftId);

      await queryClient.invalidateQueries({
        queryKey: [REACT_QUERY_KEYS.SHIFT_LIST],
      });

      showSnackbar({
        message: "Shift deleted successfully",
        type: "success",
      });

      closeModalLoader();
      methods.reset();
      setOpened(false);
    } catch (error) {
      console.log(error);
      closeModalLoader();
      errorHandler(error);
    }
  };

  return (
    <Dialog
      opened={opened}
      setOpened={setOpened}
      title="Add Shift"
      size="80%"
      isFormModal
      positiveCallback={methods.handleSubmit(onSubmit)}
      negativeCallback={() =>
        isEdit
          ? openContextModal({
              modal: "confirmModal",
              withCloseButton: false,
              centered: true,
              closeOnClickOutside: true,
              innerProps: {
                title: "Confirm",
                body: "Are you sure to delete this shift",
                onConfirm: () => {
                  onDelete();
                },
                onCancel: () => {
                  setOpened(true);
                },
              },
              size: "30%",
              styles: {
                body: { padding: "0px" },
              },
            })
          : setOpened(false)
      }
      negativeLabel={isEdit ? "Delete" : "Cancel"}
      positiveLabel={isEdit ? "Update" : "Save"}
    >
      <FormProvider {...methods}>
        <form
          onSubmit={methods.handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <InputSelect
              label="Select Position"
              disabled={isEdit}
              options={[
                { title: "Guard", value: "guard" },
                { title: "Supervisor", value: "supervisor" },
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

            <InputDate label="Date" value={shiftDate} setValue={setShiftDate} />

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

            <InputWithTopHeader
              label="Shift Location"
              className="mx-0"
              register={methods.register}
              name="location"
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
  );
};

export default AddShiftModal;
