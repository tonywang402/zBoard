import React, { createContext, ReactNode, useContext, useState } from 'react';

interface AlarmToggleContextType {
  alarmToggle: boolean;
  setAlarmToggle: (value: boolean) => void;
  sendAlertToWeComToggle: boolean;
  setSendAlertToWeComToggle: (value: boolean) => void;
}

interface AlarmToggleProviderProps {
  children: ReactNode;
}

export const AlarmToggleContext = createContext<AlarmToggleContextType>({
  alarmToggle: true,
  setAlarmToggle: () => {},
  sendAlertToWeComToggle: true,
  setSendAlertToWeComToggle: () => {},
});

const AlarmToggleProvider: React.FC<AlarmToggleProviderProps> = ({ children }) => {
  const [alarmToggle, setAlarmToggle] = useState(true);
  const [sendAlertToWeComToggle, setSendAlertToWeComToggle] = useState(false);

  return (
    <AlarmToggleContext.Provider
      value={{ alarmToggle, setAlarmToggle, sendAlertToWeComToggle, setSendAlertToWeComToggle }}
    >
      {children}
    </AlarmToggleContext.Provider>
  );
};

export const useAlarmToggle = () => useContext(AlarmToggleContext);

export default AlarmToggleProvider;
