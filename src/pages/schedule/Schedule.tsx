import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import TopSection from '../../component/schedule/TopSection';
import { ScheduleView } from '../../@types/enum';
import ByEmployeeView from '../../component/schedule/schedule_view/ByEmployeeView';
import CalendarView from '../../component/schedule/schedule_view/calendar_view/CalendarView';
import StatisticsView from '../../component/schedule/schedule_view/StatisticsView';

const Schedule = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const [datesArray, setDatesArray] = useState<Date[]>([]);

  const [selectedTenure, setSelectedTenure] = useState<'weekly' | 'monthly'>(
    'weekly'
  );
  const [selectedView, setSelectedView] = useState<ScheduleView>(
    ScheduleView.CALENDAR_VIEW
  );

  useEffect(() => {
    if (selectedTenure === 'weekly') {
      setDatesArray([]);

      for (
        let i = dayjs(selectedDate).startOf('week');
        i.isBefore(dayjs(selectedDate).endOf('week'));
        i = dayjs(i).add(1, 'day')
      ) {
        setDatesArray((prev) => [...prev, i.toDate()]);
      }
    } else if (selectedTenure === 'monthly') {
      setDatesArray([]);

      for (
        let i = dayjs(selectedDate).startOf('month');
        i.isBefore(dayjs(selectedDate).endOf('month'));
        i = dayjs(i).add(1, 'day')
      ) {
        setDatesArray((prev) => [...prev, i.toDate()]);
      }
    }
  }, [selectedDate, selectedTenure]);

  useEffect(() => {
    setSelectedTenure('weekly');
  }, [selectedView]);

  return (
    <div className="flex flex-col w-full h-full p-6 gap-6">
      <TopSection
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        selectedTenure={selectedTenure}
        setSelectedTenure={setSelectedTenure}
        selectedView={selectedView}
        setSelectedView={setSelectedView}
        isSelectTenureDisabled={
          selectedView === ScheduleView.BY_EMPLOYEE_VIEW ||
          selectedView === ScheduleView.STATISTICS_VIEW
        }
        isWeekSelectorReq={
          selectedView === ScheduleView.STATISTICS_VIEW ? false : true
        }
      />
      {selectedView === ScheduleView.CALENDAR_VIEW ? (
        <CalendarView datesArray={datesArray} />
      ) : selectedView === ScheduleView.BY_EMPLOYEE_VIEW ? (
        <ByEmployeeView datesArray={datesArray} />
      ) : (
        <StatisticsView />
      )}
    </div>
  );
};

export default Schedule;
