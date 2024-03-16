import { useState } from "react";
import Dialog from "../../../common/Dialog";

const AssignShiftModal = ({
  opened,
  setOpened,
}: {
  opened: boolean;
  setOpened: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const [selectedRow, setSelectedRow] = useState(0);

  return (
    <Dialog
      opened={opened}
      setOpened={setOpened}
      title="Assign shift"
      size="80%"
      isFormModal
      negativeCallback={() => setOpened(false)}
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
