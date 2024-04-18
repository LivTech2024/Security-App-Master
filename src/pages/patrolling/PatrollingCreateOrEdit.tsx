import { IoArrowBackCircle } from "react-icons/io5";
import { useNavigate } from "react-router";
import { PageRoutes } from "../../@types/enum";
import InputWithTopHeader from "../../common/inputs/InputWithTopHeader";
import {
  PatrollingFormFields,
  patrollingSchema,
} from "../../utilities/zod/schema";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import SwitchWithSideHeader from "../../common/switch/SwitchWithSideHeader";
import { useEffect, useState } from "react";
import CheckpointForm from "../../component/patrolling/CheckpointForm";
import { useAuthState, useEditFormStore } from "../../store";
import CustomError, { errorHandler } from "../../utilities/CustomError";
import {
  closeModalLoader,
  showModalLoader,
  showSnackbar,
} from "../../utilities/TsxUtils";
import DbPatrol from "../../firebase_configs/DB/DbPatrol";
import useFetchLocations from "../../hooks/fetch/useFetchLocations";
import { AiOutlinePlus } from "react-icons/ai";
import InputSelect from "../../common/inputs/InputSelect";
import useFetchClients from "../../hooks/fetch/useFetchClients";
import { openContextModal } from "@mantine/modals";
import Button from "../../common/button/Button";

const PatrollingCreateOrEdit = () => {
  const navigate = useNavigate();

  const { patrolEditData } = useEditFormStore();
  const isEdit = !!patrolEditData;

  const methods = useForm<PatrollingFormFields>({
    resolver: zodResolver(patrollingSchema),
    defaultValues: isEdit
      ? {
          PatrolName: patrolEditData.PatrolName,
          PatrolRequiredCount: patrolEditData.PatrolRequiredCount,
          PatrolReminderInMinutes: patrolEditData.PatrolReminderInMinutes,
          PatrolRestrictedRadius: patrolEditData.PatrolRestrictedRadius,
          PatrolKeepGuardInRadiusOfLocation:
            patrolEditData.PatrolKeepGuardInRadiusOfLocation,
          PatrolClientId: patrolEditData.PatrolClientId,
        }
      : {
          PatrolReminderInMinutes: 60,
          PatrolRestrictedRadius: 100,
        },
  });

  const { company } = useAuthState();

  const [checkPoints, setCheckPoints] = useState<
    {
      checkPointName: string;
      checkPointCategory: string | null;
      checkPointHint: string | null;
    }[]
  >([{ checkPointName: "", checkPointCategory: null, checkPointHint: null }]);

  const [locationSearchQuery, setLocationSearchQuery] = useState("");

  const { data: locData } = useFetchLocations({
    limit: 100,
    searchQuery: locationSearchQuery,
  });

  const [clientSearchValue, setClientSearchValue] = useState("");

  const { data: clients } = useFetchClients({
    limit: 5,
    searchQuery: clientSearchValue,
  });

  useEffect(() => {
    console.log(methods.formState.errors);
  }, [methods.formState.errors]);

  const locationId = methods.watch("PatrolLocationId");

  useEffect(() => {
    if (locationId) {
      const selectedLocation = locData.find(
        (loc) => loc.LocationId === locationId
      );
      if (selectedLocation) {
        methods.setValue("PatrolLocationName", selectedLocation?.LocationName);
        methods.setValue("PatrolLocationId", selectedLocation?.LocationId);
        methods.setValue("PatrolLocation", {
          latitude: String(selectedLocation.LocationCoordinates.latitude),
          longitude: String(selectedLocation.LocationCoordinates.longitude),
        });
      }
    } else {
      methods.setValue("PatrolLocationId", "");
      methods.setValue("PatrolLocationName", "");
    }
  }, [locationId]);

  useEffect(() => {
    methods.setValue(
      "PatrolCheckPoints",
      checkPoints
        .filter((d) => d.checkPointName)
        .map((ch) => {
          return {
            name: ch.checkPointName,
            category: ch.checkPointCategory,
            hint: ch.checkPointHint,
          };
        })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkPoints]);

  const [checkpointsCategories, setCheckpointsCategories] = useState<string[]>(
    []
  );

  const [loading, setLoading] = useState(false);

  //*Populate editdata in form
  useEffect(() => {
    if (isEdit) {
      setCheckPoints(
        patrolEditData.PatrolCheckPoints.map((ch) => {
          return {
            checkPointCategory: ch.CheckPointCategory,
            checkPointHint: ch.CheckPointHint,
            checkPointName: ch.CheckPointName,
          };
        })
      );

      patrolEditData.PatrolCheckPoints.map((ch) => {
        if (ch.CheckPointCategory) {
          setCheckpointsCategories((prev) => {
            if (
              ch.CheckPointCategory &&
              !prev.includes(ch.CheckPointCategory)
            ) {
              return [...prev, ch.CheckPointCategory];
            }
            return prev;
          });
        }
      });

      methods.setValue(
        "PatrolLocationName",
        patrolEditData?.PatrolLocationName
      );
      methods.setValue("PatrolLocationId", patrolEditData?.PatrolLocationId);
      methods.setValue("PatrolLocation", {
        latitude: String(patrolEditData.PatrolLocation.latitude),
        longitude: String(patrolEditData.PatrolLocation.longitude),
      });
    }
  }, [isEdit, patrolEditData]);

  const onSubmit = async (data: PatrollingFormFields) => {
    if (!company) return;
    try {
      if (
        checkpointsCategories.length > 0 &&
        checkPoints.some((ch) => !ch.checkPointCategory)
      ) {
        throw new CustomError(
          "Either remove the checkpoints categories or add categories to all checkpoints"
        );
      }

      showModalLoader({});

      if (isEdit) {
        await DbPatrol.updatePatrol({
          data,
          patrolId: patrolEditData.PatrolId,
        });
        showSnackbar({
          message: "Patrol updated successfully",
          type: "success",
        });
      } else {
        await DbPatrol.createPatrol({
          cmpId: company.CompanyId,
          data,
        });
        showSnackbar({
          message: "Patrol created successfully",
          type: "success",
        });
      }

      closeModalLoader();
      navigate(PageRoutes.PATROLLING_LIST);
    } catch (error) {
      errorHandler(error);
      closeModalLoader();
      console.log(error);
    }
  };

  const deletePatrol = async () => {
    if (!isEdit) return;
    try {
      setLoading(true);

      await DbPatrol.deletePatrol(patrolEditData.PatrolId);
      showSnackbar({ message: "Patrol deleted successfully", type: "success" });
      setLoading(false);
      navigate(PageRoutes.PATROLLING_LIST);
    } catch (error) {
      console.log(error);
      errorHandler(error);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (loading) {
      showModalLoader({});
    } else {
      closeModalLoader();
    }
    return () => closeModalLoader();
  }, [loading]);

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

          <div className="flex items-center gap-4">
            {isEdit && (
              <Button
                label="Delete"
                type="white"
                onClick={() => {
                  openContextModal({
                    modal: "confirmModal",
                    withCloseButton: false,
                    centered: true,
                    closeOnClickOutside: true,
                    innerProps: {
                      title: "Confirm",
                      body: "Are you sure to delete this patrol",
                      onConfirm: () => {
                        deletePatrol();
                      },
                    },
                    size: "30%",
                    styles: {
                      body: { padding: "0px" },
                    },
                  });
                }}
                className="px-12 py-2"
              ></Button>
            )}
            <Button
              label="Save"
              type="black"
              onClick={methods.handleSubmit(onSubmit)}
              className="px-14 py-2"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6 bg-surface shadow-md rounded border">
          <InputWithTopHeader
            className="mx-0"
            label="Patrolling Name"
            register={methods.register}
            name="PatrolName"
            error={methods.formState.errors.PatrolName?.message}
          />

          <InputSelect
            label="Patrolling location"
            data={locData.map((loc) => {
              return { label: loc.LocationName, value: loc.LocationId };
            })}
            value={methods.watch("PatrolLocationId")}
            onChange={(e) => methods.setValue("PatrolLocationId", e as string)}
            nothingFoundMessage={
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
            searchable
            searchValue={locationSearchQuery}
            onSearchChange={setLocationSearchQuery}
            clearable
            error={methods.formState.errors.PatrolLocationName?.message}
          />

          <InputWithTopHeader
            className="mx-0"
            label="Patrolling Required Count"
            register={methods.register}
            name="PatrolRequiredCount"
            decimalCount={0}
            error={methods.formState.errors.PatrolRequiredCount?.message}
          />

          <InputWithTopHeader
            className="mx-0"
            label="Patrolling reminder to guard in minutes"
            register={methods.register}
            name="PatrolReminderInMinutes"
            decimalCount={0}
            error={methods.formState.errors.PatrolReminderInMinutes?.message}
          />

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

          <InputSelect
            label="Client"
            value={methods.watch("PatrolClientId") || ""}
            onChange={(e) => methods.setValue("PatrolClientId", e || "")}
            data={clients.map((client) => {
              return { label: client.ClientName, value: client.ClientId };
            })}
            searchable
            clearable
            searchValue={clientSearchValue}
            onSearchChange={setClientSearchValue}
            error={methods.formState.errors.PatrolClientId?.message}
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
          />

          <div className="col-span-2 w-full gap-4 flex flex-col">
            <div className="font-medium text-lg ">Create checkpoints</div>
            <CheckpointForm
              checkpoints={checkPoints}
              setCheckpoints={setCheckPoints}
              checkpointCategories={checkpointsCategories}
              setCheckpointCategories={setCheckpointsCategories}
            />
          </div>
        </div>
      </form>
    </FormProvider>
  );
};

export default PatrollingCreateOrEdit;
