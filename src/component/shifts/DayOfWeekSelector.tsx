import React, { useState, useEffect } from "react";
import dayjs from "dayjs";
import { removeTimeFromDate } from "../../utilities/misc";

const DaysOfWeekSelector = ({
  selectedDays,
  setSelectedDays,
  isMultipleSelectable,
}: {
  selectedDays: Date[];
  setSelectedDays: React.Dispatch<React.SetStateAction<Date[]>>;
  isMultipleSelectable: boolean;
}) => {
  const [daysOfWeek, setDaysOfWeek] = useState<Date[]>([]);

  useEffect(() => {
    const today = dayjs();
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const day = today.add(i, "day").toDate();
      days.push(removeTimeFromDate(day));
    }
    setDaysOfWeek(days);
  }, []);

  const toggleDay = (day: Date) => {
    if (isMultipleSelectable) {
      if (selectedDays.some((d) => dayjs(d).isSame(day))) {
        setSelectedDays(selectedDays.filter((d) => !dayjs(d).isSame(day)));
      } else {
        setSelectedDays([...selectedDays, day]);
      }
    } else {
      setSelectedDays([day]);
    }
  };

  console.log(selectedDays, "selected one");

  return (
    <div className="p-4 bg-onHoverBg flex flex-col w-full gap-2">
      <div className="font-semibold">Add to</div>
      <div className="flex items-center gap-4 w-full">
        {daysOfWeek.map((day) => (
          <label
            htmlFor={day.toString()}
            key={day.toString()}
            className="flex flex-col w-full items-center cursor-pointer"
          >
            <div className="font-bold">{dayjs(day).format("ddd")}</div>
            <div className="text-gray-500">{dayjs(day).format("MMM-D")}</div>
            <input
              type="checkbox"
              id={day.toString()}
              checked={selectedDays.some((d) => dayjs(d).isSame(day))}
              onChange={() => toggleDay(day)}
              className=""
            />
          </label>
        ))}
      </div>
    </div>
  );
};

export default DaysOfWeekSelector;
