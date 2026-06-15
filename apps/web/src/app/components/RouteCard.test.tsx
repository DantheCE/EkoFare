import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RouteCard from './RouteCard';
import { useSavedRoutes } from '../../store/useSavedRoutes';
import { findMockRoute } from '../../lib/api/mock/fixtures';

const route = findMockRoute('mile2-cms')!;

beforeEach(() => {
  useSavedRoutes.setState({ saved: {} });
});

describe('RouteCard', () => {
  it('renders the route name, meta and end-to-end fare', () => {
    render(<RouteCard route={route} />);
    expect(screen.getByText('Mile 2 → CMS')).toBeInTheDocument();
    expect(screen.getByText('₦550')).toBeInTheDocument();
    expect(screen.getByText('Danfo · 5 stops · ~35 min')).toBeInTheDocument();
  });

  it('shows the MAJOR status badge', () => {
    render(<RouteCard route={route} />);
    expect(screen.getByText('★ Major')).toBeInTheDocument();
  });

  it('links to the route detail page', () => {
    render(<RouteCard route={route} />);
    const link = screen.getByRole('link', { name: /Mile 2 → CMS/ });
    expect(link).toHaveAttribute('href', '/routes/mile2-cms');
  });

  it('toggles saved state via the heart without leaking navigation', async () => {
    const user = userEvent.setup();
    render(<RouteCard route={route} />);

    const heart = screen.getByRole('button', { name: /save Mile 2 → CMS/i });
    expect(heart).toHaveAttribute('aria-pressed', 'false');

    await user.click(heart);

    expect(useSavedRoutes.getState().isSaved('mile2-cms')).toBe(true);
    expect(
      screen.getByRole('button', { name: /remove Mile 2 → CMS from saved/i }),
    ).toHaveAttribute('aria-pressed', 'true');
  });
});
