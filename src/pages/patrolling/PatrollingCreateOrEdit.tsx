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
import InputSelect from "../../common/inputs/InputSelect";

const PatrollingCreateOrEdit = () => {
  const navigate = useNavigate();
  const methods = useForm<PatrollingFormFields>({
    resolver: zodResolver(patrollingSchema),
    defaultValues: {
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

  useEffect(() => {
    console.log(methods.formState.errors);
  }, [methods.formState.errors]);

  const locationId = methods.watch("PatrolLocationId");

  useEffect(() => {
    console.log(locationId, "id");
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

      await DbPatrol.createPatrol({
        cmpId: company.CompanyId,
        data,
      });

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

          <InputSelect
            label="Patrolling location"
            data={locData.map((loc) => {
              return { label: loc.LocationName, value: loc.LocationId };
            })}
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
