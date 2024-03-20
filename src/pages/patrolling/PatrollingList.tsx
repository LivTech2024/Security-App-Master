import { useNavigate } from "react-router";
import { PageRoutes } from "../../@types/enum";

const PatrollingList = () => {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col w-full h-full p-6 gap-6">
      <div className="flex justify-between w-full p-4 rounded bg-primaryGold text-surface items-center">
        <span className="font-semibold text-xl">Patrolling</span>

        <button
          onClick={() => {
            navigate(PageRoutes.PATROLLING_CREATE_OR_EDIT);
          }}
          className="bg-primary text-surface px-4 py-2 rounded"
        >
          Create Patrolling
        </button>
      </div>

      <table className="rounded overflow-hidden w-full">
        <thead className="bg-primary text-surface text-sm">
          <tr>
            <th className="uppercase px-4 py-2 w-[15%] text-start">
              Patrol Name
            </th>
            <th className="uppercase px-4 py-2 w-[20%] text-start">Area</th>
            <th className="uppercase px-4 py-2 w-[15%] text-start">Time</th>
            <th className="uppercase px-4 py-2 w-[10%] text-center">
              checkpoints
            </th>
            <th className="uppercase px-4 py-2 w-[20%] text-end">
              Assigned to
            </th>
            <th className="uppercase px-4 py-2 w-[15%] text-end">status</th>
          </tr>
        </thead>
        <tbody className="[&>*:nth-child(even)]:bg-[#5856560f]">
          <tr className="cursor-pointer">
            <td className="px-4 py-2 text-start align-top">Building 74</td>
            <td className="px-4 py-2 text-start align-top ">
              <span className="line-clamp-2">
                The Capital Mall, Achole Road, Yashvant Viva Township,
                Nalasopara East, Vasai-Virar, Nala Sopara, Maharashtra, India
              </span>
            </td>
            <td className="px-4 py-2 text-start align-top">20-Mar-06:00 PM</td>
            <td className="px-4 py-2 text-center align-top">5.0</td>
            <td className="px-4 py-2 text-end align-top">Harsh Singh</td>
            <td className="px-4 py-2 text-end capitalize align-top">Pending</td>
          </tr>
          <tr className="cursor-pointer">
            <td className="px-4 py-2 text-start align-top">Building 49</td>
            <td className="px-4 py-2 text-start align-top ">
              <span className="line-clamp-2">
                Yashvant Viva Township, Nalasopara East, Vasai-Virar, Nala
                Sopara, Maharashtra, India
              </span>
            </td>
            <td className="px-4 py-2 text-start align-top">10-Mar-06:00 PM</td>
            <td className="px-4 py-2 text-center align-top">3.0</td>
            <td className="px-4 py-2 text-end align-top">Yuvraj Singh</td>
            <td className="px-4 py-2 text-end capitalize align-top">Pending</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default PatrollingList;
