import { IoArrowBackCircle } from "react-icons/io5";
import { useNavigate } from "react-router";
import { PageRoutes } from "../../@types/enum";
import InputWithTopHeader from "../../common/inputs/InputWithTopHeader";
import Button from "../../common/button/Button";
import {
  PatrollingFormFields,
  patrollingSchema,
} from "../../utilities/zod/schema";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import PlacesAutocomplete, {
  geocodeByAddress,
  getLatLng,
} from "react-places-autocomplete";
import InputHeader from "../../common/inputs/InputHeader";
import SwitchWithSideHeader from "../../common/switch/SwitchWithSideHeader";
import { useEffect, useState } from "react";
import CheckpointForm from "../../component/patrolling/CheckpointForm";
import InputAutoComplete from "../../common/inputs/InputAutocomplete";
import useFetchGuards from "../../hooks/fetch/useFetchGuards";
import { DateTimePicker } from "@mantine/dates";
import { MdCalendarToday } from "react-icons/md";
import { useAuthState } from "../../store";
import { errorHandler } from "../../utilities/CustomError";
import {
  closeModalLoader,
  showModalLoader,
  showSnackbar,
} from "../../utilities/TsxUtils";
import DbPatrol from "../../firebase_configs/DB/DbPatrol";

const PatrollingCreateOrEdit = () => {
  const navigate = useNavigate();
  const methods = useForm<PatrollingFormFields>({
    resolver: zodResolver(patrollingSchema),
  });

  const { company } = useAuthState();

  const [patrolArea, patrolLoc] = methods.watch([
    "PatrolArea",
    "PatrolLocation",
  ]);

  const [checkPoints, setCheckPoints] = useState<{ checkPointName: string }[]>([
    { checkPointName: "" },
  ]);

  const [patrolTime, setPatrolTime] = useState(new Date());

  const [guard, setGuard] = useState<string | null | undefined>("");

  const { data } = useFetchGuards({
    limit: 5,
    searchQuery: guard || undefined,
  });

  useEffect(() => {
    console.log(methods.formState.errors);
  }, [methods.formState.errors]);

  useEffect(() => {
    if (!guard) {
      methods.setValue("PatrolAssignedGuardName", "");
      methods.setValue("PatrolAssignedGuardId", "");
      return;
    }
    methods.setValue("PatrolAssignedGuardName", guard);
    const guardId = data.find((d) => d.EmployeeName === guard)?.EmployeeId;
    console.log(guardId, "id");
    if (guardId) {
      methods.setValue("PatrolAssignedGuardId", guardId);
    }
  }, [guard]);

  useEffect(() => {
    if (!patrolTime) return;

    methods.setValue("PatrolTime", patrolTime);
  }, [patrolTime]);

  useEffect(() => {
    methods.setValue(
      "PatrolCheckPoints",
      checkPoints.map((c) => c.checkPointName)
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkPoints]);

  const handleSelect = async (selectedAddress: string) => {
    try {
      methods.setValue("PatrolArea", selectedAddress);
      const results = await geocodeByAddress(selectedAddress);
      const latLng = await getLatLng(results[0]);
      const { lat, lng } = latLng;
      methods.setValue("PatrolLocation", {
        latitude: String(lat),
        longitude: String(lng),
      });
    } catch (error) {
      console.error("Error selecting address", error);
    }
  };

  const onSubmit = async (data: PatrollingFormFields) => {
    if (!company) return;
    try {
      console.log(data);
      showModalLoader({});

      await DbPatrol.createPatrol(company.CompanyId, data);

      showSnackbar({ message: "Patrol created successfully", type: "success" });
      closeModalLoader();
      navigate(PageRoutes.PATROLLING_LIST);
    } catch (error) {
      errorHandler(error);
      closeModalLoader();
      console.log(error);
    }
  };

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={methods.handleSubmit(onSubmit)}
        className="flex flex-col w-full h-full p-6 gap-6"
      >
        <div className="flex items-center justify-between w-full">
          <div
            onClick={() => navigate(PageRoutes.PATROLLING_LIST)}
            className="flex items-center gap-4 cursor-pointer "
          >
            <div className="cursor-pointer">
              <IoArrowBackCircle className="h-6 w-6" />
            </div>
            <div className="font-semibold text-lg">Create new patrol</div>
          </div>
          <Button
            label="Save"
            type="black"
            onClick={methods.handleSubmit(onSubmit)}
            className="px-14 py-2"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6 bg-surface shadow-md rounded border">
          <InputWithTopHeader
            className="mx-0"
            label="Patrolling Name"
            register={methods.register}
            name="PatrolName"
            error={methods.formState.errors.PatrolName?.message}
          />
          <PlacesAutocomplete
            value={patrolArea}
            onChange={(val) => methods.setValue("PatrolArea", val)}
            onSelect={handleSelect}
          >
            {({
              getInputProps,
              suggestions,
              getSuggestionItemProps,
              loading,
            }) => (
              <div className="flex flex-col gap-1">
                <InputHeader title="Patrolling Area" />
                <input
                  {...getInputProps({
                    className:
                      "location-search-input py-2 px-2 rounded w-full text-lg outline-none border border-inputBorder focus-within:ring-[2px]",
                  })}
                />
                {methods.formState.errors.PatrolArea && (
                  <small className="text-red-600 text-xs px-1 text-start">
                    {methods.formState.errors.PatrolArea.message}
                  </small>
                )}
                {(suggestions.length > 0 || loading) && (
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
                )}
                {patrolLoc?.latitude && patrolLoc?.longitude && (
                  <div className="flex items-center gap-4 text-xs">
                    <div>Lat: {patrolLoc.latitude}</div>
                    <div>Lng: {patrolLoc.longitude}</div>
                  </div>
                )}
              </div>
            )}
          </PlacesAutocomplete>
          {/* DateTime Input */}
          <div className="flex flex-col gap-1">
            <div className={`flex`}>
              <span className={`text-xs line-clamp-1`}>Time</span>
            </div>

            <DateTimePicker
              dropdownType="modal"
              valueFormat="DD/MM/YY hh:mm A"
              rightSection={
                <label>
                  <MdCalendarToday size={16} className="cursor-pointer" />
                </label>
              }
              value={patrolTime}
              onChange={(e) => setPatrolTime(e as Date)}
              className="focus-within:ring-[2px] rounded "
              popoverProps={{
                styles: {
                  dropdown: {
                    backgroundColor: `#FFFFFF`,
                    zIndex: 300,
                    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.4)",
                    position: "fixed",
                  },
                },
              }}
              styles={{
                input: {
                  border: `1px solid #0000001A`,
                  fontWeight: "normal",
                  fontSize: "18px",
                  borderRadius: "4px",
                  background: "#FFFFFF",
                  color: "#000000",
                  padding: "8px 8px",
                },
                day: {
                  color: `#000000`,
                  ":hover": {
                    color: "#000000",
                  },
                },
              }}
            />
            {methods.formState.errors.PatrolTime && (
              <small className="text-red-600 text-xs px-1 text-start">
                {methods.formState.errors.PatrolTime.message}
              </small>
            )}
          </div>
          <div>
            <InputAutoComplete
              className="mx-0"
              label="Guard"
              value={guard}
              data={data.map((d) => {
                return { label: d.EmployeeName, value: d.EmployeeName };
              })}
              onChange={setGuard}
            />
            {methods.formState.errors.PatrolAssignedGuardName && (
              <small className="text-red-600 text-xs px-1 text-start">
                {methods.formState.errors.PatrolAssignedGuardName.message}
              </small>
            )}
          </div>
          <div className="md:col-span-2 flex items-end w-full gap-4">
            <InputWithTopHeader
              className="mx-0 w-full"
              label="Restricted Radius (In Meters)"
              register={methods.register}
              name="PatrolRestrictedRadius"
              decimalCount={2}
              error={methods.formState.errors.PatrolRestrictedRadius?.message}
            />
            <SwitchWithSideHeader
              register={methods.register}
              name="PatrolKeepGuardInRadiusOfLocation"
              className="w-full mb-2 font-medium"
              label="Restrict guard from moving out from this radius while patrolling"
            />
          </div>
          <div className="col-span-2 w-full gap-4 flex flex-col">
            <div className="font-medium text-lg ">Create checkpoints</div>
            <CheckpointForm
              checkpoints={checkPoints}
              setCheckpoints={setCheckPoints}
            />
          </div>
        </div>
      </form>
    </FormProvider>
  );
};

export default PatrollingCreateOrEdit;
