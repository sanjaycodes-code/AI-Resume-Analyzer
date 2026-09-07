import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import * as AuthContextModule from '../context/AuthContext';

describe('Navbar Component - Global Dark Theme Across All Pages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders dark styling and omits "Get Started" on the Landing Page ("/")', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });

    const { container } = render(
      <MemoryRouter initialEntries={['/']}>
        <Navbar />
      </MemoryRouter>
    );

    // Header has global dark background
    const header = container.querySelector('header');
    expect(header?.className).toContain('bg-[#090d16]');

    // Contains Log In link
    expect(screen.getByRole('link', { name: /log in/i })).toBeInTheDocument();

    // Does NOT contain "Get Started" button in Navbar on landing page
    expect(screen.queryByRole('link', { name: /get started/i })).not.toBeInTheDocument();
  });

  it('renders global dark styling and includes "Get Started" button on other pages (e.g. "/login")', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });

    const { container } = render(
      <MemoryRouter initialEntries={['/login']}>
        <Navbar />
      </MemoryRouter>
    );

    // Header has global dark background
    const header = container.querySelector('header');
    expect(header?.className).toContain('bg-[#090d16]');

    // Contains BOTH Log In and Get Started
    expect(screen.getByRole('link', { name: /log in/i })).toBeInTheDocument();
    const getStartedLink = screen.getByRole('link', { name: /get started/i });
    expect(getStartedLink).toBeInTheDocument();
    expect(getStartedLink.className).toContain('bg-emerald-500');
  });

  it('renders global dark styling and emerald active state for authenticated users on "/dashboard"', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: { _id: '1', name: 'John Doe', email: 'john@example.com' },
      accessToken: 'token-xyz',
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });

    const { container } = render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Navbar />
      </MemoryRouter>
    );

    const header = container.querySelector('header');
    expect(header?.className).toContain('bg-[#090d16]');
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /log out/i })).toBeInTheDocument();

    // Dashboard link has emerald active indicator
    const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
    expect(dashboardLink.className).toContain('text-emerald-400');
    expect(dashboardLink.className).toContain('bg-emerald-500/15');
  });
});
