import { useEffect, useState } from "react";
import dayjs from "dayjs";
import TopSection from "../../component/schedule/TopSection";
import CalendarView from "../../component/schedule/schedule_view/CalendarView";

const Schedule = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const [datesArray, setDatesArray] = useState<Date[]>([]);

  const [selectedTenure, setSelectedTenure] = useState<"weekly" | "monthly">(
    "weekly"
  );
  const [selectedView, setSelectedView] = useState<"calendar" | "position">(
    "calendar"
  );

  useEffect(() => {
    if (selectedTenure === "weekly") {
      setDatesArray([]);

      for (
        let i = dayjs(selectedDate).startOf("week");
        i.isBefore(dayjs(selectedDate).endOf("week"));
        i = dayjs(i).add(1, "day")
      ) {
        setDatesArray((prev) => [...prev, i.toDate()]);
      }
    } else if (selectedTenure === "monthly") {
      setDatesArray([]);

      for (
        let i = dayjs(selectedDate).startOf("month");
        i.isBefore(dayjs(selectedDate).endOf("month"));
        i = dayjs(i).add(1, "day")
      ) {
        setDatesArray((prev) => [...prev, i.toDate()]);
      }
    }
  }, [selectedDate, selectedTenure]);

  return (
    <div className="flex flex-col w-full h-full p-6 gap-6">
      <TopSection
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        selectedTenure={selectedTenure}
        setSelectedTenure={setSelectedTenure}
        selectedView={selectedView}
        setSelectedView={setSelectedView}
      />
      {selectedView === "calendar" ? (
        <CalendarView datesArray={datesArray} selectedDate={selectedDate} />
      ) : (
        <div>{selectedView}</div>
      )}
    </div>
  );
};

export default Schedule;
