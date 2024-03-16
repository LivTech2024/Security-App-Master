import React, { useState, useEffect } from "react";
import Dialog from "../../../common/Dialog";
import { Shift, User } from "../../../pages/schedule/Schedule";
import dayjs from "dayjs";

const AssignShiftModal = ({
  opened,
  setOpened,
  selectedEmp,
  selectedEmpDate,
  availableShifts,
}: {
  opened: boolean;
  setOpened: React.Dispatch<React.SetStateAction<boolean>>;
  selectedEmp: User | null;
  selectedEmpDate: string | null;
  availableShifts: Shift[];
}) => {
  const [formData, setFormData] = useState({
    userId: selectedEmp ? selectedEmp._id : "",
    selectedShifts: [] as string[],
  });

  useEffect(() => {
    setFormData((prevData) => ({
      ...prevData,
      userId: selectedEmp ? selectedEmp._id : "",
    }));
  }, [selectedEmp]);

  const handleCheckboxChange = (shiftId: string) => {
    // Check if the shiftId is already in the selectedShifts array
    const isShiftSelected = formData.selectedShifts.includes(shiftId);

    if (isShiftSelected) {
      // If the shift is already selected, remove it from selectedShifts
      setFormData((prevData) => ({
        ...prevData,
        selectedShifts: prevData.selectedShifts.filter((id) => id !== shiftId),
      }));
    } else {
      // If the shift is not selected, add it to selectedShifts
      setFormData((prevData) => ({
        ...prevData,
        selectedShifts: [...prevData.selectedShifts, shiftId],
      }));
    }
  };

  const handleSubmit = async () => {
    try {
      const { userId, selectedShifts } = formData;

      for (const shiftId of selectedShifts) {
        const response = await fetch(`/api/user/update/${userId}/${shiftId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Failed to assign shift");
        }
      }

      // Reset the form after all shifts are assigned
      setFormData({
        userId: selectedEmp ? selectedEmp._id : "",
        selectedShifts: [],
      });

      // Close the modal if needed
      setOpened(false);

      console.log("Shifts assigned successfully");

      // Send additional PUT requests to update shift data
      for (const shiftId of selectedShifts) {
        await fetch(`/api/shift/update/${shiftId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
        });
      }

      console.log("Shift data updated successfully");
    } catch (error) {
      console.error("Error assigning shifts:", error);
    }
  };

  /*******************New***************** */

  const [selectedRow, setSelectedRow] = useState(0);

  return (
    <Dialog
      opened={opened}
      setOpened={setOpened}
      title="Assign shift"
      size="80%"
      isFormModal
      positiveCallback={handleSubmit}
    >
      <div className="flex flex-col bg-gray-100 rounded-md p-4">
        <div className="font-semibold text-lg">Assign (Unassigned shifts)</div>
        <div className="bg-blue-500 p-1 text-xs text-surface w-fit">
          Highlighted employee will be assigned
        </div>

        <table className="mt-4 text-sm">
          <thead className="">
            <tr>
              <th className="py-2 px-4 text-start">First Name</th>
              <th className="py-2 px-4 text-start">Last Name</th>
              <th className="py-2 px-4 text-start">Phone</th>
              <th className="py-2 px-4 text-start">Week Shifts</th>
              <th className="py-2 px-4 text-end">Week Hours</th>
            </tr>
          </thead>
          <tbody>
            <tr
              onClick={() => setSelectedRow(0)}
              className={`${
                selectedRow === 0 ? "bg-blue-500 text-surface" : "bg-surface"
              } cursor-pointer`}
            >
              <td className="text-start px-4 py-2">Mark</td>
              <td className="text-start px-4 py-2">Twain</td>
              <td className="text-start px-4 py-2">+912222222222</td>
              <td className="text-start px-4 py-2">1</td>
              <td className="text-end px-4 py-2">3.0</td>
            </tr>
            <tr
              onClick={() => setSelectedRow(1)}
              className={`${
                selectedRow === 1 ? "bg-blue-500 text-surface" : "bg-surface"
              } cursor-pointer`}
            >
              <td className="text-start px-4 py-2">Jhon</td>
              <td className="text-start px-4 py-2">Doe</td>
              <td className="text-start px-4 py-2">+912222222222</td>
              <td className="text-start px-4 py-2">1</td>
              <td className="text-end px-4 py-2">3.0</td>
            </tr>
          </tbody>
        </table>
      </div>
    </Dialog>
  );
};

export default AssignShiftModal;
