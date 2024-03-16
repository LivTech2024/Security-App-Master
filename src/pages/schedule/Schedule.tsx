import { DatePickerInput } from "@mantine/dates";
import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { MdCalendarToday } from "react-icons/md";
import AddShiftModal from "../../component/shifts/modal/AddShiftModal";
import AssignShiftModal from "../../component/schedule/modal/AssignShiftModal";

export interface Shift {
  _id: string;
  date: string;
  start_time: string;
  end_time: string;
  position: string;
  description?: string;
  isAssigned?: boolean;
}

export interface User {
  _id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  role: string;
  shifts: string[];
}

const Schedule = () => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [addShiftModal, setAddShiftModal] = useState(false);
  const [assignShiftModal, setAssignShiftModal] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState<User | null>(null);
  const [selectedEmpDate, setSelectedEmpDate] = useState<string | null>(null);
  console.log(users);

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

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch("/api/user/getusers");

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        setUsers(data);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    fetchUsers();
  }, []);

  // Function to get shifts for a user on a specific day
  const getUserShiftForDay = (userId: string, date: string) => {
    return shifts.filter(
      (shift) => shift._id === userId && dayjs(shift.date).isSame(dayjs(date))
    );
  };

  //* To get the available shift of a particular date
  const getShiftForDay = (date: string | null) => {
    return shifts.filter((shift) =>
      dayjs(shift.date).isSame(dayjs(date), "date")
    );
  };

  return (
    <div className="flex flex-col w-full h-full p-6 gap-6">
      <div className="flex justify-between w-full p-4 rounded bg-primaryGold text-surface items-center">
        <span className="font-semibold text-xl">Schedule</span>

        <button
          onClick={() => setAddShiftModal(true)}
          className="bg-primary text-surface px-4 py-2 rounded"
        >
          Add new shift
        </button>
      </div>

      <AddShiftModal opened={addShiftModal} setOpened={setAddShiftModal} />

      <div className="flex items-center gap-4">
        <div className="font-medium">
          Week of {dayjs(selectedDate).format("MMM DD, YYYY")}
        </div>
        <DatePickerInput
          rightSection={
            <label>
              <MdCalendarToday size={16} className="cursor-pointer" />
            </label>
          }
          value={selectedDate}
          onChange={(e) => setSelectedDate(e)}
        />
      </div>

      <table className="w-full">
        <thead className="text-sm font-normal">
          <tr className="border-b-[30px] border-gray-200">
            {[0, 1, 2, 3, 4, 5, 6].map((dayIndex) => (
              <th key={dayIndex} className="w-[14.29%] text-center font-bold">
                {dayjs(selectedDate)
                  .startOf("week")
                  .add(dayIndex, "day")
                  .format("dddd MMM-DD")}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="text-sm">
          {/* Map all the shifts according to date */}

          <tr>
            <td className="text-center px-2 py-2">
              <div className="flex flex-col">
                <div className="font-semibold">10:00 - 13:00</div>
                <div
                  onClick={() => setAssignShiftModal(true)}
                  className="flex flex-col p-1 bg-[#faf9f9] cursor-pointer border hover:border-gray-500"
                >
                  <div>Mark Twain</div>
                  <div>Testing</div>
                </div>
              </div>
            </td>
            <td className="text-center px-2 py-2">
              <div className="flex flex-col">
                <div className="font-semibold">10:00 - 13:00</div>
                <div
                  onClick={() => setAssignShiftModal(true)}
                  className="flex flex-col p-1 bg-[#faf9f9] cursor-pointer border hover:border-gray-500"
                >
                  <div className="bg-[#ffff64] py-[2px]">(Unassigned)</div>
                  <div>Testing</div>
                </div>
              </div>
            </td>
            <td className="text-center px-2 py-2">
              <div className="flex flex-col">
                <div className="font-semibold">10:00 - 13:00</div>
                <div
                  onClick={() => setAssignShiftModal(true)}
                  className="flex flex-col p-1 bg-[#faf9f9] cursor-pointer border hover:border-gray-500"
                >
                  <div className="bg-[#ffff64] py-[2px]">(Unassigned)</div>
                  <div>Testing</div>
                </div>
              </div>
            </td>
            <td className="text-center px-2 py-2">
              <div className="flex flex-col">
                <div className="font-semibold">10:00 - 13:00</div>
                <div
                  onClick={() => setAssignShiftModal(true)}
                  className="flex flex-col p-1 bg-[#faf9f9] cursor-pointer border hover:border-gray-500"
                >
                  <div className="bg-[#ffff64] py-[2px]">(Unassigned)</div>
                  <div>Testing</div>
                </div>
              </div>
            </td>
            <td className="text-center px-2 py-2">
              <div className="flex flex-col">
                <div className="font-semibold">10:00 - 13:00</div>
                <div
                  onClick={() => setAssignShiftModal(true)}
                  className="flex flex-col p-1 bg-[#faf9f9] cursor-pointer border hover:border-gray-500"
                >
                  <div className="bg-[#ffff64] py-[2px]">(Unassigned)</div>
                  <div>Testing</div>
                </div>
              </div>
            </td>
            <td className="text-center px-2 py-2">
              <div className="flex flex-col">
                <div className="font-semibold">10:00 - 13:00</div>
                <div
                  onClick={() => setAssignShiftModal(true)}
                  className="flex flex-col p-1 bg-[#faf9f9] cursor-pointer border hover:border-gray-500"
                >
                  <div className="bg-[#ffff64] py-[2px]">(Unassigned)</div>
                  <div>Testing</div>
                </div>
              </div>
            </td>
            <td className="text-center px-2 py-2">
              <div className="flex flex-col">
                <div className="font-semibold">10:00 - 13:00</div>
                <div
                  onClick={() => setAssignShiftModal(true)}
                  className="flex flex-col p-1 bg-[#faf9f9] cursor-pointer border hover:border-gray-500"
                >
                  <div className="bg-[#ffff64] py-[2px]">(Unassigned)</div>
                  <div>Testing</div>
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <div className="hidden">
        <AssignShiftModal
          opened={assignShiftModal}
          setOpened={setAssignShiftModal}
          selectedEmp={selectedEmp}
          selectedEmpDate={selectedEmpDate}
          availableShifts={getShiftForDay(selectedEmpDate)}
        />
      </div>
    </div>
  );
};

export default Schedule;
