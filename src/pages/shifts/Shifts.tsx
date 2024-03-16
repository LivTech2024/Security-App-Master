import { useState, useEffect } from "react";
import AddShiftModal from "../../component/shifts/modal/AddShiftModal";

interface Shift {
  _id: string;
  date: string;
  start_time: string;
  end_time: string;
  position: string;
  description?: string;
}

const Shifts = () => {
  const [createShiftDialog, setCreateShiftDialog] = useState(false);
  const [shifts, setShifts] = useState<Shift[]>([]);

  useEffect(() => {
    const fetchShifts = async () => {
      try {
        const response = await fetch("/api/shift/getshifts");

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setShifts(data);
      } catch (error) {
        console.error("Error fetching shifts:", error);
      }
    };

    fetchShifts();
  }, []);

  return (
    <div className="flex flex-col w-full h-full p-6 gap-6">
      <div className="flex justify-between w-full p-4 rounded bg-primaryGold text-surface items-center">
        <span className="font-semibold text-xl">Shifts</span>
        <button
          onClick={() => setCreateShiftDialog(true)}
          className="bg-primary text-surface px-4 py-2 rounded"
        >
          Create Shift
        </button>
      </div>

      <AddShiftModal
        opened={createShiftDialog}
        setOpened={setCreateShiftDialog}
      />

      <table className="rounded overflow-hidden w-full">
        <thead className="bg-primary text-surface text-sm">
          <tr>
            <th className="uppercase px-4 py-2 w-[20%] text-center">Date</th>
            <th className="uppercase px-4 py-2 w-[20%] text-center">
              Start Time
            </th>
            <th className="uppercase px-4 py-2 w-[20%] text-center">
              End Time
            </th>
            <th className="uppercase px-4 py-2 w-[20%] text-center">
              Position
            </th>
            <th className="uppercase px-4 py-2 w-[20%] text-center">
              Description
            </th>
          </tr>
        </thead>
        <tbody className="[&>*:nth-child(even)]:bg-[#5856560f]">
          {shifts.map((shift, index) => (
            <tr
              key={index}
              onClick={() => setCreateShiftDialog(true)}
              className="cursor-pointer "
            >
              <td className="px-4 py-2 text-center">
                {new Date(shift.date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "2-digit",
                  year: "numeric",
                })}
              </td>
              <td className="px-4 py-2 text-center">{shift.start_time}</td>
              <td className="px-4 py-2 text-center">{shift.end_time}</td>
              <td className="px-4 py-2 text-center">{shift.position}</td>
              <td className="px-4 py-2 text-center">
                {shift.description || "N/A"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Shifts;
