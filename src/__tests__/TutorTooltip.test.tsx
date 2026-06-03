import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TutorTooltip } from '../components/TutorTooltip';
import { TutorProvider } from '../contexts/TutorContext';
import React from 'react';

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

function renderWithTutor(children: React.ReactNode) {
  return render(
    <TutorProvider>
      <TutorTooltip text="Test guidance">
        {children}
      </TutorTooltip>
    </TutorProvider>
  );
}

describe('TutorTooltip', () => {
  it('renders children passthrough when tutor mode is OFF (default)', () => {
    renderWithTutor(<span>child content</span>);
    expect(screen.getByText('child content')).toBeInTheDocument();
  });

  it('does not render tutor ring when tutor mode is OFF', () => {
    const { container } = renderWithTutor(<span>child content</span>);
    expect(container.querySelector('[class*="border-dashed"]')).toBeNull();
  });
});
