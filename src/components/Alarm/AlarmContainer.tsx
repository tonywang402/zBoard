import React from 'react';
import IntervalAlarmPlayer from './IntervalAlarmPlayer';
import moment from 'moment';

export interface AlarmContainerProps {
  intervalMin?: number;
  alarmSrc?: string[];
  needAlarm?: boolean;
}
const isWeekday = () => {
  const now = moment();
  return now.day() > 0 && now.day() < 6;
};

const isWorkingTime = () => {
  const now = moment();
  const weekdayMorningStart = moment().hour(9).minute(29);
  const weekdayMorningEnd = moment().hour(11).minute(30);
  const weekdayAfternoonStart = moment().hour(13).minute(29);
  const weekdayAfternoonEnd = moment().hour(18).minute(0);

  return (
    now.isBetween(weekdayMorningStart, weekdayMorningEnd) ||
    now.isBetween(weekdayAfternoonStart, weekdayAfternoonEnd)
  );
};

export const canPlay = () => {
  return isWeekday() && isWorkingTime();
};

const AlarmContainer: React.FC<AlarmContainerProps> = ({ intervalMin, alarmSrc }) => {
  return <>{canPlay() && <IntervalAlarmPlayer intervalMin={intervalMin} alarmSrc={alarmSrc} />}</>;
};

export default AlarmContainer;
