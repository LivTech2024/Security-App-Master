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
import { useEditFormStore } from "../../../store";
import { useQueryClient } from "@tanstack/react-query";
import {
  closeModalLoader,
  showModalLoader,
  showSnackbar,
} from "../../../utilities/TsxUtils";
import DbShift from "../../../firebase_configs/DB/DbShift";
import { REACT_QUERY_KEYS, ShiftPositions } from "../../../@types/enum";
import { errorHandler } from "../../../utilities/CustomError";
import { openContextModal } from "@mantine/modals";
import PlacesAutocomplete, {
  geocodeByAddress,
  getLatLng,
} from "react-places-autocomplete";
import InputHeader from "../../../common/inputs/InputHeader";

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
  location: z.object({ lat: z.string(), lng: z.string() }),
  address: z.string().min(3, { message: "Shift address is required" }),
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

  const [startTime, setStartTime] = useState("09:00 AM");

  const [endTime, setEndTime] = useState("05:00 PM");

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
    setShiftDate(new Date());
    setStartTime("09:00 AM");
    setEndTime("05:00 PM");
    let allFieldValues: AddShiftFormFields = {
      position: ShiftPositions.guard,
      date: new Date(),
      start_time: "09:00 AM",
      end_time: "05:00 PM",
      name: "",
      location: { lat: "", lng: "" },
      address: "",
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
        location: {
          lat: String(shiftEditData.ShiftLocation.latitude),
          lng: String(shiftEditData.ShiftLocation.longitude),
        },
        address: shiftEditData.ShiftAddress,
        description: shiftEditData.ShiftDescription,
      };
    }

    methods.reset(allFieldValues);
  }, [isEdit, shiftEditData, methods, opened]);

  const address = methods.watch("address");

  const handleSelect = async (selectedAddress: string) => {
    try {
      methods.setValue("address", selectedAddress);
      const results = await geocodeByAddress(selectedAddress);
      const latLng = await getLatLng(results[0]);
      const { lat, lng } = latLng;
      methods.setValue("location", { lat: String(lat), lng: String(lng) });
    } catch (error) {
      console.error("Error selecting address", error);
    }
  };

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
            <PlacesAutocomplete
              value={address}
              onChange={(val) => methods.setValue("address", val)}
              onSelect={handleSelect}
            >
              {({
                getInputProps,
                suggestions,
                getSuggestionItemProps,
                loading,
              }) => (
                <div className="flex flex-col gap-1">
                  <InputHeader title="Shift location" />
                  <input
                    {...getInputProps({
                      className:
                        "location-search-input py-2 px-2 rounded w-full text-lg outline-none border border-inputBorder focus-within:ring-[2px]",
                    })}
                  />
                  <div className="relative">
                    <div className="autocomplete-dropdown-container rounded-b-2xl border absolute max-h-[200px] w-full overflow-scroll remove-vertical-scrollbar">
                      {loading && (
                        <div className="cursor-pointer py-2 px-2 bg-white">
                          Loading...
                        </div>
                      )}
                      {suggestions.map((suggestion) => {
                        const style = {
                          backgroundColor: suggestion.active
                            ? "#DAC0A3"
                            : "#fff",
                        };
                        return (
                          <div
                            className="cursor-pointer py-2 px-2"
                            {...getSuggestionItemProps(suggestion, { style })}
                          >
                            {suggestion.description}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </PlacesAutocomplete>

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
