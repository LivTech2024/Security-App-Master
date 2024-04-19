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

export const getRandomNumbers = () => {
  const random = Math.floor(Math.random() * (9999 - 1111 + 1)) + 1111;
  const ms = new Date().getMilliseconds();
  return Number(`${random}${ms}`);
};
