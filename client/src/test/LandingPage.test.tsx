import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { LandingPage } from '../pages/LandingPage';
import * as AuthContextModule from '../context/AuthContext';

// Mock IntersectionObserver for jsdom environment (required by framer-motion whileInView)
class MockIntersectionObserver {
  readonly root = null;
  readonly rootMargin = '';
  readonly scrollMargin = '';
  readonly thresholds: ReadonlyArray<number> = [];
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
}
window.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;
if (typeof globalThis !== 'undefined') {
  (globalThis as unknown as { IntersectionObserver: unknown }).IntersectionObserver =
    MockIntersectionObserver;
}

describe('LandingPage Component - Dark Hero & Floating Cards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });
  });

  it('renders dark hero headline with emerald accent', () => {
    render(
      <BrowserRouter>
        <LandingPage />
      </BrowserRouter>
    );

    expect(screen.getByText(/Land More Interviews with/i)).toBeInTheDocument();
    expect(screen.getByText(/Intelligent ATS/i)).toBeInTheDocument();
    expect(screen.getByText(/Precision/i)).toBeInTheDocument();
  });

  it('renders primary green pill button and secondary dark button for unauthenticated users', () => {
    render(
      <BrowserRouter>
        <LandingPage />
      </BrowserRouter>
    );

    const getStartedBtn = screen.getByRole('link', { name: /get started free/i });
    expect(getStartedBtn).toBeInTheDocument();
    expect(getStartedBtn).toHaveAttribute('href', '/register');

    const signInBtn = screen.getByRole('link', { name: /sign in/i });
    expect(signInBtn).toBeInTheDocument();
    expect(signInBtn).toHaveAttribute('href', '/login');
  });

  it('renders "Go to Dashboard" button when user is authenticated', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: { _id: '1', name: 'Test User', email: 'test@example.com' },
      accessToken: 'token-123',
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });

    render(
      <BrowserRouter>
        <LandingPage />
      </BrowserRouter>
    );

    const dashboardBtn = screen.getByRole('link', { name: /go to dashboard/i });
    expect(dashboardBtn).toBeInTheDocument();
    expect(dashboardBtn).toHaveAttribute('href', '/dashboard');
  });

  it('renders floating glass card stats and indicators without crashing', () => {
    render(
      <BrowserRouter>
        <LandingPage />
      </BrowserRouter>
    );

    expect(screen.getByText(/ATS Audit Preview/i)).toBeInTheDocument();
    expect(screen.getByText('88')).toBeInTheDocument();
    expect(screen.getByText(/2,400\+/i)).toBeInTheDocument();
    expect(screen.getByText(/STAR AI Rewrite/i)).toBeInTheDocument();
    expect(screen.getByText(/Target Skills: 96% Match/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Vector PDF Export/i).length).toBeGreaterThan(0);
  });

  it('handles mouse movements, scrolling, and window resizing without crashing (verifying fix for previous tilt crash)', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <BrowserRouter>
        <LandingPage />
      </BrowserRouter>
    );

    // Simulate aggressive mouse movement
    fireEvent.mouseMove(window, { clientX: 100, clientY: 200 });
    fireEvent.mouseMove(window, { clientX: 300, clientY: 450 });
    fireEvent.mouseMove(window, { clientX: 800, clientY: 600 });

    // Simulate window resizing
    window.innerWidth = 500;
    fireEvent.resize(window);
    window.innerWidth = 1200;
    fireEvent.resize(window);

    // Simulate scrolling
    fireEvent.scroll(window, { target: { scrollY: 300 } });
    fireEvent.scroll(window, { target: { scrollY: 800 } });

    // Ensure no uncaught React or runtime errors were fired
    expect(consoleErrorSpy).not.toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });
});
