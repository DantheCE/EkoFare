import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StopTimeline from './StopTimeline';
import { useStopSelection } from '../../hooks/useStopSelection';
import { findMockRoute } from '../../lib/api/mock/fixtures';

function Harness({ routeId }: { routeId: string }) {
  const stops = findMockRoute(routeId)!.stops;
  const { selection, focusIdx, select, setFocusIdx } = useStopSelection(stops.length);
  return (
    <StopTimeline
      stops={stops}
      selection={selection}
      focusIdx={focusIdx}
      onSelect={select}
      onFocusChange={setFocusIdx}
    />
  );
}

describe('StopTimeline interaction', () => {
  it('tags origin FROM then destination TO across two taps', async () => {
    const user = userEvent.setup();
    render(<Harness routeId="mile2-cms" />); // Mile 2, Orile, Costain, National Theatre, CMS

    const orile = screen.getByRole('button', { name: /^Orile,/ });
    await user.click(orile);
    expect(screen.getByText('FROM')).toBeInTheDocument();
    expect(screen.queryByText('TO')).not.toBeInTheDocument();

    const cms = screen.getByRole('button', { name: /^CMS,/ });
    await user.click(cms);
    expect(screen.getByText('FROM')).toBeInTheDocument();
    expect(screen.getByText('TO')).toBeInTheDocument();
  });

  it('treats a tap before the origin as a new origin', async () => {
    const user = userEvent.setup();
    render(<Harness routeId="mile2-cms" />);

    await user.click(screen.getByRole('button', { name: /^Costain,/ })); // origin = idx 2
    await user.click(screen.getByRole('button', { name: /^Mile 2,/ })); // earlier → new origin
    // only FROM should be set, no destination yet
    expect(screen.getByText('FROM')).toBeInTheDocument();
    expect(screen.queryByText('TO')).not.toBeInTheDocument();
  });

  it('renders a very long stop name in full (no truncation)', () => {
    render(<Harness routeId="airport-tbs" />);
    expect(
      screen.getByText('Murtala Muhammed International Airport'),
    ).toBeInTheDocument();
  });
});
