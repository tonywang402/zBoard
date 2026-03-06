import React from 'react';
import { render, screen } from '@testing-library/react';
import OwnerRotationCard from '../OwnerRotationCard';

const members = [
  { name: 'Alice', startDate: '2026-01-01', endDate: '2026-03-31' },
  { name: 'Bob',   startDate: '2026-04-01', endDate: '2026-06-30' },
  { name: 'Carol', startDate: '2026-07-01', endDate: '2026-12-31' },
];

describe('OwnerRotationCard', () => {
  beforeAll(() => {
    jest.spyOn(Date, 'now').mockReturnValue(new Date('2026-03-06').getTime());
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  it('displays the member whose date window contains today as current owner', () => {
    render(<OwnerRotationCard subject="Stand Up" members={members} color="green.500" icon={null} />);
    // Alice covers 2026-01-01 to 2026-03-31; today (2026-03-06) falls in her range
    expect(screen.getByText('Alice')).toBeInTheDocument();
  });

  it('shows the next owner (Bob) after the current owner (Alice)', () => {
    render(<OwnerRotationCard subject="Stand Up" members={members} color="green.500" icon={null} />);
    expect(screen.getByText('Bob')).toBeInTheDocument();
    // Carol is two steps ahead and is not shown
    expect(screen.queryByText('Carol')).not.toBeInTheDocument();
  });

  it('renders without crashing when members is empty', () => {
    render(
      <OwnerRotationCard subject="Showcase" members={[]} color="blue.500" icon={null} />
    );
    // With no members, ownerIndex = -1, preOwner/owner/nextOwner fall back to the
    // string 'None'. Since 'None'.name is undefined, no name text is rendered.
    expect(screen.queryByText('Alice')).not.toBeInTheDocument();
    expect(screen.getByText('Showcase')).toBeInTheDocument();
  });

  it('matches a member on exact startDate boundary (isSameOrBefore)', () => {
    const exactStartMember = [{ name: 'TodayStart', startDate: '2026-03-06', endDate: '2026-12-31' }];
    render(
      <OwnerRotationCard subject="Test" members={exactStartMember} color="red.500" icon={null} />
    );
    expect(screen.getByText('TodayStart')).toBeInTheDocument();
  });

  it('matches a member on exact endDate boundary (isSameOrBefore)', () => {
    const exactEndMember = [{ name: 'TodayEnd', startDate: '2026-01-01', endDate: '2026-03-06' }];
    render(
      <OwnerRotationCard subject="Test" members={exactEndMember} color="red.500" icon={null} />
    );
    expect(screen.getByText('TodayEnd')).toBeInTheDocument();
  });

  it('shows the previous owner when current is not the first member', () => {
    // To get a previous owner, mock today within Bob's range
    jest.spyOn(Date, 'now').mockReturnValue(new Date('2026-05-01').getTime());
    render(<OwnerRotationCard subject="Stand Up" members={members} color="green.500" icon={null} />);
    // Alice is preOwner, Bob is owner, Carol is nextOwner
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
    expect(screen.getByText('Carol')).toBeInTheDocument();
  });
});
