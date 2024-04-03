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
import SwitchWithSideHeader from "../../common/switch/SwitchWithSideHeader";
import { useEffect, useState } from "react";
import CheckpointForm from "../../component/patrolling/CheckpointForm";
import InputAutoComplete from "../../common/inputs/InputAutocomplete";
import { DateTimePicker } from "@mantine/dates";
import { MdCalendarToday } from "react-icons/md";
import { useAuthState } from "../../store";
import CustomError, { errorHandler } from "../../utilities/CustomError";
import {
  closeModalLoader,
  showModalLoader,
  showSnackbar,
} from "../../utilities/TsxUtils";
import DbPatrol from "../../firebase_configs/DB/DbPatrol";
import useFetchLocations from "../../hooks/fetch/useFetchLocations";
import { AiOutlinePlus } from "react-icons/ai";
import useFetchEmployees from "../../hooks/fetch/useFetchEmployees";
import { MultiSelect } from "@mantine/core";
import InputHeader from "../../common/inputs/InputHeader";
import { sendEmail } from "../../utilities/sendEmail";
import { formatDate } from "../../utilities/misc";
import InputSelect from "../../common/inputs/InputSelect";
import useFetchClients from "../../hooks/fetch/useFetchClients";

const PatrollingCreateOrEdit = () => {
  const navigate = useNavigate();
  const methods = useForm<PatrollingFormFields>({
    resolver: zodResolver(patrollingSchema),
  });

  const { company } = useAuthState();

  const [checkPoints, setCheckPoints] = useState<
    { checkPointName: string; checkPointTime: string }[]
  >([{ checkPointName: "", checkPointTime: "" }]);

  const [patrolTime, setPatrolTime] = useState(new Date());

  const [guards, setGuards] = useState<string[]>([]);

  const [selectedGuardsList, setSelectedGuardsList] = useState<
    {
      PatrolAssignedGuardId: string;
      PatrolAssignedGuardName: string;
      PatrolAssignedGuardEmail: string;
    }[]
  >([]);

  const { data } = useFetchEmployees({
    limit: 5,
    searchQuery: undefined,
    empRole: "GUARD",
  });

  const [locationName, setLocationName] = useState<string | null | undefined>(
    ""
  );

  const { data: locData } = useFetchLocations({
    limit: 100,
    searchQuery: locationName,
  });

  const [clientSearchValue, setClientSearchValue] = useState("");

  const { data: clients } = useFetchClients({
    limit: 5,
    searchQuery: clientSearchValue,
  });

  useEffect(() => {
    console.log(methods.formState.errors);
  }, [methods.formState.errors]);

  useEffect(() => {
    if (guards.length > selectedGuardsList.length) {
      const selectedGuardData = data.find(
        (g) => g.EmployeeId === guards[guards.length - 1]
      );

      if (selectedGuardData) {
        setSelectedGuardsList((prev) => [
          ...prev,
          {
            PatrolAssignedGuardEmail: selectedGuardData.EmployeeEmail,
            PatrolAssignedGuardId: selectedGuardData.EmployeeId,
            PatrolAssignedGuardName: selectedGuardData.EmployeeName,
          },
        ]);
      }
    } else {
      const newSelectedGuardsList = guards.map((gId) => {
        const selectedGuardData = data.find((g) => g.EmployeeId === gId);
        return {
          PatrolAssignedGuardEmail: selectedGuardData?.EmployeeEmail || "",
          PatrolAssignedGuardId: selectedGuardData?.EmployeeId || "",
          PatrolAssignedGuardName: selectedGuardData?.EmployeeName || "",
        };
      });

      setSelectedGuardsList(newSelectedGuardsList);
    }
  }, [guards]);

  useEffect(() => {
    if (!locationName) return;
    const location = locData.find((loc) => loc.LocationName === locationName);
    if (location) {
      methods.setValue("PatrolLocationName", locationName);
      methods.setValue("PatrolArea", location?.LocationAddress);
      methods.setValue("PatrolLocation", {
        latitude: String(location.LocationCoordinates.latitude),
        longitude: String(location.LocationCoordinates.longitude),
      });
    }
  }, [locationName]);

  useEffect(() => {
    if (!patrolTime) return;

    methods.setValue("PatrolTime", patrolTime);
  }, [patrolTime]);

  useEffect(() => {
    methods.setValue(
      "PatrolCheckPoints",
      checkPoints
        .filter((d) => d.checkPointName && d.checkPointTime)
        .map((ch) => {
          return { name: ch.checkPointName, time: ch.checkPointTime };
        })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkPoints]);

  const onSubmit = async (data: PatrollingFormFields) => {
    if (!company) return;
    try {
      if (!selectedGuardsList || selectedGuardsList.length === 0) {
        throw new CustomError("Please assign a guard");
      }
      showModalLoader({});

      await DbPatrol.createPatrol({
        cmpId: company.CompanyId,
        data,
        guards: selectedGuardsList,
      });

      const sendEmailPromise = selectedGuardsList.map(async (guard) => {
        return sendEmail({
          message: `You have been assigned for the patrol.\n Patrol Name: ${
            data.PatrolName
          }\n Timing: ${formatDate(data.PatrolTime, "DD/MM/YY")}\n Address: ${
            data.PatrolArea
          }`,
          subject: "Your patrol update",
          to_email: guard.PatrolAssignedGuardEmail,
          to_name: guard.PatrolAssignedGuardName,
        });
      });

      await Promise.all(sendEmailPromise);

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
        <div className="flex items-center justify-between w-full bg-primaryGold rounded p-4 shadow">
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

          <InputAutoComplete
            label="Patrolling location"
            data={locData.map((loc) => {
              return { label: loc.LocationName, value: loc.LocationName };
            })}
            value={locationName}
            onChange={setLocationName}
            dropDownHeader={
              <div
                onClick={() => {
                  navigate(PageRoutes.LOCATIONS);
                }}
                className="bg-primaryGold text-surface font-medium p-2 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <AiOutlinePlus size={18} />
                  <span>Add location</span>
                </div>
              </div>
            }
            error={methods.formState.errors.PatrolArea?.message}
          />

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
          <div className="flex flex-col gap-1">
            <InputHeader title="Assign guards" />
            <MultiSelect
              placeholder="Pick guards"
              data={data.map((d) => {
                return { label: d.EmployeeName, value: d.EmployeeId };
              })}
              value={guards}
              onChange={setGuards}
              searchable
              nothingFoundMessage="No guard found..."
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
              }}
            />
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
          <InputWithTopHeader
            className="mx-0"
            label="Patrolling Required Count"
            register={methods.register}
            name="PatrolRequiredCount"
            decimalCount={0}
            error={methods.formState.errors.PatrolRequiredCount?.message}
          />
          <InputSelect
            label="Client"
            value={methods.watch("PatrolClientId")}
            onChange={(e) => methods.setValue("PatrolClientId", e || "")}
            data={clients.map((client) => {
              return { label: client.ClientName, value: client.ClientId };
            })}
            nothingFoundMessage={
              <div
                onClick={() => {
                  navigate(PageRoutes.CLIENTS);
                }}
                className="bg-primaryGold text-surface font-medium p-2 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <AiOutlinePlus size={18} />
                  <span>Add Client</span>
                </div>
              </div>
            }
            searchable
            clearable
            searchValue={clientSearchValue}
            onSearchChange={setClientSearchValue}
            error={methods.formState.errors.PatrolClientId?.message}
          />
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
