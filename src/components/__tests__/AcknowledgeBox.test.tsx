import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AlarmToggleContext } from '../../pages/AlarmToggleContext';
import AcknowledgeBox from '../AcknowledgeBox';

jest.mock('../Alarm/AlarmContainer', () => () => <div data-testid="alarm-container" />);

const renderWithAlarm = (alarmToggle: boolean, needAlarm = true) =>
  render(
    <AlarmToggleContext.Provider
      value={{
        alarmToggle,
        setAlarmToggle: jest.fn(),
        sendAlertToWeComToggle: false,
        setSendAlertToWeComToggle: jest.fn(),
      }}
    >
      <AcknowledgeBox intervalMin={30} alarmSrc={['/audio/test.mp3']} needAlarm={needAlarm} />
    </AlarmToggleContext.Provider>
  );

describe('AcknowledgeBox', () => {
  it('shows "Need ACK" button before acknowledgement', () => {
    renderWithAlarm(false);
    expect(screen.getByText('Need ACK')).toBeInTheDocument();
    expect(screen.queryByText('ACKED')).not.toBeInTheDocument();
  });

  it('transitions to ACKED badge after clicking Need ACK', async () => {
    const user = userEvent.setup();
    renderWithAlarm(false);
    await user.click(screen.getByText('Need ACK'));
    expect(screen.getByText('ACKED')).toBeInTheDocument();
    expect(screen.queryByText('Need ACK')).not.toBeInTheDocument();
  });

  it('renders AlarmContainer when alarmToggle=true and needAlarm=true', () => {
    renderWithAlarm(true);
    expect(screen.getByTestId('alarm-container')).toBeInTheDocument();
  });

  it('does not render AlarmContainer when alarmToggle=false', () => {
    renderWithAlarm(false);
    expect(screen.queryByTestId('alarm-container')).not.toBeInTheDocument();
  });

  it('does not render AlarmContainer when needAlarm=false even with alarmToggle=true', () => {
    renderWithAlarm(true, false);
    expect(screen.queryByTestId('alarm-container')).not.toBeInTheDocument();
  });
});
