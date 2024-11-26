/* eslint-disable @typescript-eslint/no-explicit-any */
import dayjs from 'dayjs';
import { FieldValue, GeoPoint, Timestamp } from 'firebase/firestore';

export const fullTextSearchIndex = (text: string): string[] => {
  const textList: string[] = [];

  if (text && text.length > 0) {
    for (let i = 0; i < text.length; i++) {
      for (let j = i + 1; j <= text.length; j++) {
        textList.push(text.substring(i, j));
      }
    }
  }

  return textList;
};

export const fullTextSearchIndexSingleWay = (text: string): string[] => {
  const textList: string[] = [];

  if (text && text.length > 0) {
    for (let i = 0; i <= text.length; i++) {
      const textResult = text.substring(0, i);
      if (textResult && textResult.length > 0) {
        textList.push(textResult);
      }
    }
  }

  return textList;
};

export const firebaseDataToObject = (docData: Record<string, unknown>) => {
  Object.keys(docData).forEach((key) => {
    const value = docData[key];

    if (
      value instanceof Object &&
      '_nanoseconds' in value &&
      '_seconds' in value &&
      typeof value._nanoseconds === 'number' &&
      typeof value._seconds === 'number'
    ) {
      const milliseconds = value._nanoseconds / 1e6;
      const timestampMilliseconds = value._seconds * 1000 + milliseconds;
      docData[key] = new Date(timestampMilliseconds).toString();
    }

    if (value instanceof Timestamp) {
      docData[key] = value.toDate().toString();
    }

    if (value instanceof FieldValue) {
      docData[key] = null;
    }

    if (value instanceof GeoPoint) {
      docData[key] = value.toJSON();
    }
  });

  return docData;
};

export const toDate = (value: any): Date => {
  if (value instanceof Date) {
    return value;
  } else if (value instanceof Timestamp) {
    return value.toDate();
  } else if (typeof value === 'string' || typeof value === 'number') {
    return new Date(value);
  } else {
    throw new TypeError('Invalid date value');
  }
};

export const removeTimeFromDate = (date: Date) => {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};

export const formatDate = (dateText: any, dateFormat = 'DD MMM-YY') => {
  const date = toDate(dateText);
  return dayjs(date).format(dateFormat);
};

export const formatDateRange = ({
  startDateString,
  endDateString,
}: {
  startDateString: string;
  endDateString: string;
}) => {
  const dateFormat = 'DD/MM/YYYY';

  // Check if startDateString and endDateString match the expected format
  if (
    !dayjs(startDateString, dateFormat).isValid() ||
    !dayjs(endDateString, dateFormat).isValid()
  ) {
    throw new Error('Invalid date format. Expected format: DD/MM/YYYY');
  }

  const startDate: dayjs.Dayjs = dayjs(startDateString);
  const endDate: dayjs.Dayjs = dayjs(endDateString);

  const getFormattedDate = (date: dayjs.Dayjs): string => {
    const day: string = date.format('D');
    const monthAbbreviation: string = date.format('MMM');

    return `${day} ${monthAbbreviation}`;
  };

  const isSameDay: boolean = startDate.isSame(endDate, 'day');

  if (isSameDay) {
    const today: dayjs.Dayjs = dayjs();
    today.set('hour', 0);
    today.set('minute', 0);
    today.set('second', 0);
    today.set('millisecond', 0);

    if (startDate.isSame(today, 'day')) {
      return 'Today';
    } else {
      return 'Yesterday';
    }
  }

  const isSameYear: boolean = startDate.isSame(endDate, 'year');

  if (isSameYear) {
    const startDateResult: string = getFormattedDate(startDate);
    const endDateResult: string = getFormattedDate(endDate);
    return `${startDateResult} - ${endDateResult}`;
  }

  const startDateResult = `${getFormattedDate(startDate)} ${startDate.format(
    'YYYY'
  )}`;
  const endDateResult = `${getFormattedDate(endDate)} ${endDate.format('YYYY')}`;
  return `${startDateResult} - ${endDateResult}`;
};

export const splitName = (fullName: string) => {
  const firstSpaceIndex = fullName.indexOf(' ');
  if (firstSpaceIndex !== -1) {
    const firstName = fullName.slice(0, firstSpaceIndex);
    const lastName = fullName.slice(firstSpaceIndex + 1);
    return { firstName, lastName };
  } else {
    return { firstName: fullName, lastName: '' };
  }
};

export const getHoursDiffInTwoTimeString = (
  startTime: string,
  endTime: string
) => {
  const parseTime = (time: string) => {
    const [hourStr, minuteStr] = time.split(':');
    let hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);
    if (time.includes('PM') && hour !== 12) {
      hour += 12;
    } else if (time.includes('AM') && hour === 12) {
      hour = 0;
    }
    return { hour, minute };
  };

  const { hour: startHour, minute: startMinute } = parseTime(startTime);
  const { hour: endHour, minute: endMinute } = parseTime(endTime);

  const startDateTime = dayjs().hour(startHour).minute(startMinute);
  const endDateTime = dayjs().hour(endHour).minute(endMinute);

  let diff = endDateTime.diff(startDateTime, 'hours', true);

  if (diff < 0) {
    diff += 24;
  }

  return Number(diff.toFixed(2));
};

export const parseTime = (time: string) => {
  const [hourStr, minuteStr] = time.split(':');
  let hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr.replace(/\D/g, ''), 10); // Remove any non-digit characters (AM/PM)
  if (time.includes('PM') && hour !== 12) {
    hour += 12;
  } else if (time.includes('AM') && hour === 12) {
    hour = 0;
  }
  return { hour, minute };
};

export const getMinutesDiffInTwoTimeString = (
  time1: string,
  time2: string
): number => {
  const is24HourFormat = (time: string) =>
    !time.includes('AM') && !time.includes('PM');

  const { hour: hour1, minute: minute1 } = parseTime(time1);
  const { hour: hour2, minute: minute2 } = parseTime(time2);

  const dateTime1 = is24HourFormat(time1)
    ? dayjs().hour(hour1).minute(minute1)
    : dayjs(`${dayjs().format('YYYY-MM-DD')} ${time1}`, ['hh:mm A', 'HH:mm']);

  const dateTime2 = is24HourFormat(time2)
    ? dayjs().hour(hour2).minute(minute2)
    : dayjs(`${dayjs().format('YYYY-MM-DD')} ${time2}`, ['hh:mm A', 'HH:mm']);

  const diff = dateTime2.diff(dateTime1, 'minutes');

  return diff;
};

export const getRandomNumbers = () => {
  const random = Math.floor(Math.random() * (9999 - 1111 + 1)) + 1111;
  const ms = new Date().getMilliseconds();
  return Number(`${random}${ms}`);
};

export const roundNumber = (num: number, precision?: number) => {
  if (!precision) {
    precision = 2;
  }
  return Math.round(num * Math.pow(10, precision)) / Math.pow(10, precision);
};

export function findRemovedElements<T>(oldArray: T[], newArray: T[]): T[] {
  const newSet = new Set(newArray);
  const removedElements = oldArray.filter((element) => !newSet.has(element));
  return removedElements;
}

export const reorderArray = (
  list: any[],
  startIndex: number,
  endIndex: number
) => {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
};

export const scrollToDiv = (id: string) => {
  if (!id) return;
  const element = document.querySelector('#' + id);
  if (element) {
    element.scrollIntoView({ behavior: 'auto', inline: 'nearest' });
  }
};

export const getEmpUniqueId = (prefix: string) => {
  const uniqueNumber = new Date().getTime();

  return `${prefix.toUpperCase()}${new Date().getFullYear().toString().slice(2, 4)}${uniqueNumber.toString().slice(7, 13)}`;
};

export function getHourRange(date: Date): string {
  const hour = date.getHours(); // Get the hour from the Date object
  const start = hour.toString().padStart(2, '0') + ':00';
  const end = (hour + 1).toString().padStart(2, '0') + ':00';

  return `${start} - ${end}`;
}
