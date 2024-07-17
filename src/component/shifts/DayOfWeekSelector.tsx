import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import { removeTimeFromDate } from '../../utilities/misc';
import { FaCircleChevronLeft, FaCircleChevronRight } from 'react-icons/fa6';
import { DatePickerInput } from '@mantine/dates';
import { MdCalendarToday } from 'react-icons/md';
import InputRadio from '../../common/inputs/InputRadio';

function arrayContainsAll(subset: Date[], superset: Date[]): boolean {
  const subsetStrings = subset.map((date) => date.toISOString());
  const supersetStrings = superset.map((date) => date.toISOString());
  return subsetStrings.every((date) => supersetStrings.includes(date));
}

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

  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    setDaysOfWeek([]);

    for (
      let i = dayjs(selectedDate).startOf('week');
      i.isBefore(dayjs(selectedDate).endOf('week'));
      i = dayjs(i).add(1, 'day')
    ) {
      setDaysOfWeek((prev) => [...prev, removeTimeFromDate(i.toDate())]);
    }
  }, [selectedDate]);

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

  useEffect(() => {
    if (isMultipleSelectable) return;
    setSelectedDate(selectedDays[0]);
  }, [isMultipleSelectable, selectedDays]);

  return (
    <div className="p-4 bg-onHoverBg flex flex-col w-full gap-2">
      <div className="flex justify-between w-full gap-4">
        <div className="font-semibold">Add to</div>
        <div className="flex items-center gap-4">
          <FaCircleChevronLeft
            className="text-2xl cursor-pointer"
            onClick={() =>
              setSelectedDate((prev) =>
                dayjs(prev).subtract(1, 'week').toDate()
              )
            }
          />
          <label
            htmlFor="date_picker"
            className="flex items-center gap-4 cursor-pointer justify-center w-full"
          >
            <div className="font-semibold">
              Week of {dayjs(selectedDate).format('MMM DD, YYYY')}
            </div>

            <DatePickerInput
              type="default"
              id="date_picker"
              className="font-semibold"
              rightSection={
                <label>
                  <MdCalendarToday size={16} className="cursor-pointer" />
                </label>
              }
              value={selectedDate}
              onChange={(e) => setSelectedDate(e as Date)}
            />
          </label>
          <FaCircleChevronRight
            className="text-2xl cursor-pointer"
            onClick={() =>
              setSelectedDate((prev) => dayjs(prev).add(1, 'week').toDate())
            }
          />
        </div>
        <InputRadio
          disabled={!isMultipleSelectable}
          type="checkbox"
          label="Select all"
          checked={arrayContainsAll(daysOfWeek, selectedDays)}
          onChange={() => {
            if (arrayContainsAll(daysOfWeek, selectedDays)) {
              // Remove only the daysOfWeek dates from selectedDays
              setSelectedDays((prev) =>
                prev.filter(
                  (d) => !daysOfWeek.some((day) => dayjs(day).isSame(d))
                )
              );
            } else {
              setSelectedDays((prev) => [...prev, ...daysOfWeek.map((d) => d)]);
            }
          }}
        />
      </div>
      <div className="flex items-center gap-4 w-full">
        {daysOfWeek.map((day) => (
          <label
            htmlFor={day.toString()}
            key={day.toString()}
            className="flex flex-col w-full items-center cursor-pointer"
          >
            <div className="font-bold">{dayjs(day).format('ddd')}</div>
            <div className="text-gray-500">{dayjs(day).format('MMM-D')}</div>
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
