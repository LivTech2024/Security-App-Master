import React from 'react';
import { Select } from '@mantine/core';
import { FaCircleChevronLeft, FaCircleChevronRight } from 'react-icons/fa6';
import { useEditFormStore } from '../../store';
import dayjs from 'dayjs';
import { DatePickerInput } from '@mantine/dates';
import { MdCalendarToday } from 'react-icons/md';
import { PageRoutes, ScheduleView } from '../../@types/enum';
import { useNavigate } from 'react-router-dom';
import Button from '../../common/button/Button';
import PageHeader from '../../common/PageHeader';

const TopSection = ({
  selectedDate,
  setSelectedDate,
  selectedTenure,
  setSelectedTenure,
  selectedView,
  setSelectedView,
  isSelectTenureDisabled = false,
  isWeekSelectorReq = true,
}: {
  selectedDate: Date;
  setSelectedDate: React.Dispatch<React.SetStateAction<Date>>;
  isSelectTenureDisabled?: boolean;
  selectedTenure: 'weekly' | 'monthly';
  setSelectedTenure: React.Dispatch<React.SetStateAction<'weekly' | 'monthly'>>;
  selectedView: ScheduleView;
  setSelectedView: React.Dispatch<React.SetStateAction<ScheduleView>>;
  isWeekSelectorReq?: boolean;
}) => {
  const { setShiftEditData } = useEditFormStore();

  const navigate = useNavigate();
  return (
    <div className="flex flex-col w-full gap-4 ">
      <PageHeader
        title="Schedule"
        rightSection={
          <div className="flex items-center gap-4">
            <Button
              label="View all shifts"
              onClick={() => navigate(PageRoutes.SHIFT_LIST)}
              type="blue"
              className="px-4 py-2"
            />
            <Button
              label="Add new shift"
              onClick={() => {
                setShiftEditData(null);
                navigate(PageRoutes.SHIFT_CREATE_OR_EDIT);
              }}
              type="black"
              className="px-4 py-2"
            />
          </div>
        }
      />

      {/* Top section */}
      <div className="flex items-center justify-between w-full bg-surface shadow p-4 rounded">
        <Select
          allowDeselect={false}
          value={selectedView}
          onChange={(e) => {
            console.log(e);
            setSelectedView(e as ScheduleView);
          }}
          data={[
            { label: 'Calendar view', value: ScheduleView.CALENDAR_VIEW },
            { label: 'By Employee view', value: ScheduleView.BY_EMPLOYEE_VIEW },
            { label: 'Statistics view', value: ScheduleView.STATISTICS_VIEW },
          ]}
          className="text-lg"
          styles={{
            input: {
              border: `1px solid #0000001A`,
              fontWeight: 'normal',
              fontSize: '18px',
              borderRadius: '4px',
              background: '#FFFFFF',
              color: '#000000',
              padding: '12px 12px',
            },
          }}
        />

        {isWeekSelectorReq && (
          <div className="flex items-center gap-4">
            <FaCircleChevronLeft
              className="text-2xl cursor-pointer"
              onClick={() => {
                if (!isSelectTenureDisabled && selectedTenure === 'monthly') {
                  setSelectedDate((prev) =>
                    dayjs(prev).subtract(1, 'month').toDate()
                  );
                  return;
                }
                setSelectedDate((prev) =>
                  dayjs(prev).subtract(1, 'week').toDate()
                );
              }}
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
              onClick={() => {
                if (!isSelectTenureDisabled && selectedTenure === 'monthly') {
                  setSelectedDate((prev) =>
                    dayjs(prev).add(1, 'month').toDate()
                  );
                  return;
                }
                setSelectedDate((prev) => dayjs(prev).add(1, 'week').toDate());
              }}
            />
          </div>
        )}
        <div>
          {!isSelectTenureDisabled ? (
            <Select
              allowDeselect={false}
              value={selectedTenure}
              onChange={(e) => setSelectedTenure(e as 'monthly' | 'weekly')}
              data={[
                { label: 'Weekly', value: 'weekly' },
                { label: 'Monthly', value: 'monthly' },
              ]}
              className="text-lg"
              styles={{
                input: {
                  border: `1px solid #0000001A`,
                  fontWeight: 'normal',
                  fontSize: '18px',
                  borderRadius: '4px',
                  background: '#FFFFFF',
                  color: '#000000',
                  padding: '12px 12px',
                },
              }}
            />
          ) : (
            <span>&nbsp;</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default TopSection;
