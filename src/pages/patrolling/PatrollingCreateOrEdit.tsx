import { IoArrowBackCircle } from "react-icons/io5";
import { useNavigate } from "react-router";
import { PageRoutes } from "../../@types/enum";
import InputWithTopHeader from "../../common/inputs/InputWithTopHeader";
import Button from "../../common/button/Button";
import {
  PatrollingFormFields,
  patrollingSchema,
} from "../../utilities/zod/schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import PlacesAutocomplete, {
  geocodeByAddress,
  getLatLng,
} from "react-places-autocomplete";
import InputHeader from "../../common/inputs/InputHeader";
import SwitchWithSideHeader from "../../common/switch/SwitchWithSideHeader";
import { useState } from "react";
import CheckpointForm from "../../component/patrolling/CheckpointForm";
import { generateBarcodesAndDownloadPDF } from "../../utilities/generateBarcodesAndDownloadPdf";
import InputAutoComplete from "../../common/inputs/InputAutocomplete";

const PatrollingCreateOrEdit = () => {
  const navigate = useNavigate();
  const methods = useForm<PatrollingFormFields>({
    resolver: zodResolver(patrollingSchema),
  });

  const [patrolArea, patrolLoc] = methods.watch([
    "PatrolArea",
    "PatrolLocation",
  ]);

  const [checkPoints, setCheckPoints] = useState<{ checkPointName: string }[]>([
    { checkPointName: "" },
  ]);

  console.log(checkPoints, "checkPoints");

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

  const testBarcode = async () => {
    const barcodeData = [
      { text: "123456", name: "First CheckPoint" },
      { text: "789012", name: "Second CheckPoint" },
      { text: "123456", name: "First CheckPoint" },
      { text: "789012", name: "Second CheckPoint" },

      // Add more barcode data as needed
    ];
    console.log("started");
    await generateBarcodesAndDownloadPDF(barcodeData);

    console.log("done");
  };
  return (
    <div className="flex flex-col w-full h-full p-6 gap-6">
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
          onClick={() => {
            testBarcode();
          }}
          className="px-14 py-2"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6 bg-surface shadow-md rounded border">
        <InputWithTopHeader className="mx-0" label="Patrolling Name" />
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
                        backgroundColor: suggestion.active ? "#DAC0A3" : "#fff",
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
        <InputWithTopHeader className="mx-0" label="Time" />
        <InputAutoComplete
          className="mx-0"
          label="Guard"
          data={[{ label: "Yuvraj Singh", value: "yy" }]}
          onChange={(e) => console.log(e)}
        />
        <div className="md:col-span-2 flex items-end w-full gap-4">
          <InputWithTopHeader
            className="mx-0 w-full"
            label="Restricted Radius (In Meters)"
          />
          <SwitchWithSideHeader
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
    </div>
  );
};

export default PatrollingCreateOrEdit;
