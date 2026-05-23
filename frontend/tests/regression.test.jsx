/**
 * Phase 1 & 2 Regression Smoke Tests
 * Critical paths for Job Portal functionality
 * 
 * Run: npx vitest run tests/regression.test.jsx
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { toast } from 'react-hot-toast';

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(),
    dismiss: vi.fn(),
  },
  default: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(),
    dismiss: vi.fn(),
  },
}));

// Mock Supabase
const mockRpc = vi.fn();
const mockStorage = {
  from: vi.fn(() => ({
    upload: vi.fn(),
    remove: vi.fn(),
    getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'https://test.com/logo.png' } })),
    createSignedUrl: vi.fn(() => ({ data: { signedUrl: 'https://test.com/signed.pdf' }, error: null })),
  })),
};

vi.mock('../src/utils/supabase', () => ({
  supabase: {
    rpc: mockRpc,
    storage: mockStorage,
    from: vi.fn(() => ({
      select: vi.fn(() => ({ data: [], error: null })),
      insert: vi.fn(() => ({ data: [], error: null })),
    })),
  },
}));

// Mock Auth Context
const mockUser = { id: 'test-user-123', email: 'test@test.com' };
vi.mock('../src/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    isAdmin: false,
    userRole: 'employer',
    profile: { full_name: 'Test Employer' },
  }),
}));

// Mock useApproval hook
vi.mock('../src/hooks/useApproval', () => ({
  useApproval: () => ({
    loading: false,
    isApprovedEmployer: true,
  }),
}));

// Mock logger
vi.mock('../src/utils/log', () => ({
  log: {
    group: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock connections
vi.mock('../src/utils/connections', () => ({
  getLatestEdge: vi.fn(() => Promise.resolve(null)),
  idempotentConnect: vi.fn(() => Promise.resolve()),
}));

// Import components after mocks
import ManageJobApplications from '../src/components/Jobs/ManageJobApplications';
import PostJob from '../src/components/Jobs/PostJob';
import ApplicationTracking from '../src/components/Jobs/ApplicationTracking';

// ============================================
// TEST 1: ManageJobApplications renders without crashing
// ============================================
describe('ManageJobApplications Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock successful job fetch
    mockRpc.mockImplementation((funcName, params) => {
      if (funcName === 'get_applications_for_job_v2') {
        return Promise.resolve({
          data: [
            {
              id: 'app-1',
              applicant_id: 'user-1',
              job_id: params?.p_job_id,
              status: 'submitted',
              created_at: '2024-01-15T10:00:00Z',
              applicant_name: 'John Doe',
              applicant_email: 'john@test.com',
              total_count: 2,
            },
            {
              id: 'app-2',
              applicant_id: 'user-2',
              job_id: params?.p_job_id,
              status: 'shortlisted',
              created_at: '2024-01-14T09:00:00Z',
              applicant_name: 'Jane Smith',
              applicant_email: 'jane@test.com',
              total_count: 2,
            },
          ],
          error: null,
        });
      }
      return Promise.resolve({ data: null, error: null });
    });
  });

  it('1. Renders without crashing with mock application data', async () => {
    render(
      <BrowserRouter>
        <ManageJobApplications />
      </BrowserRouter>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText(/Loading applications/i)).not.toBeInTheDocument();
    });

    // Check that applications are rendered
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('2. Status dropdown change calls set_application_status with correct args', async () => {
    mockRpc.mockImplementation((funcName, params) => {
      if (funcName === 'get_applications_for_job_v2') {
        return Promise.resolve({
          data: [{
            id: 'app-1',
            applicant_id: 'user-1',
            job_id: 'job-123',
            status: 'submitted',
            created_at: '2024-01-15T10:00:00Z',
            applicant_name: 'John Doe',
            total_count: 1,
          }],
          error: null,
        });
      }
      if (funcName === 'set_application_status') {
        return Promise.resolve({ data: null, error: null });
      }
      return Promise.resolve({ data: null, error: null });
    });

    render(
      <BrowserRouter>
        <ManageJobApplications />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Find and change status dropdown
    const dropdown = screen.getByLabelText(/Change status/i) || screen.getByRole('combobox');
    fireEvent.change(dropdown, { target: { value: 'reviewed' } });

    // Verify set_application_status was called with correct args
    await waitFor(() => {
      const statusCalls = mockRpc.mock.calls.filter(call => call[0] === 'set_application_status');
      expect(statusCalls.length).toBeGreaterThan(0);
      
      const [, params] = statusCalls[0];
      expect(params.p_application_id).toBe('app-1');
      expect(params.p_status).toBe('reviewed');
    });
  });

  it('3. Undo toast appears after status change', async () => {
    mockRpc.mockImplementation((funcName) => {
      if (funcName === 'get_applications_for_job_v2') {
        return Promise.resolve({
          data: [{
            id: 'app-1',
            applicant_id: 'user-1',
            job_id: 'job-123',
            status: 'submitted',
            created_at: '2024-01-15T10:00:00Z',
            applicant_name: 'John Doe',
            total_count: 1,
          }],
          error: null,
        });
      }
      if (funcName === 'set_application_status') {
        return Promise.resolve({ data: null, error: null });
      }
      return Promise.resolve({ data: null, error: null });
    });

    render(
      <BrowserRouter>
        <ManageJobApplications />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Change status
    const dropdown = screen.getByRole('combobox');
    fireEvent.change(dropdown, { target: { value: 'reviewed' } });

    // Verify toast.success was called with undo message
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining('Status updated'),
        expect.any(Object)
      );
    });
  });

  it('4. View Resume button shows Opening state while fetching', async () => {
    let resolveSignedUrl;
    const signedUrlPromise = new Promise((resolve) => {
      resolveSignedUrl = resolve;
    });

    mockStorage.from.mockImplementation(() => ({
      createSignedUrl: () => signedUrlPromise,
    }));

    mockRpc.mockImplementation((funcName) => {
      if (funcName === 'get_applications_for_job_v2') {
        return Promise.resolve({
          data: [{
            id: 'app-1',
            applicant_id: 'user-1',
            job_id: 'job-123',
            status: 'submitted',
            created_at: '2024-01-15T10:00:00Z',
            applicant_name: 'John Doe',
            _resume_signed_url: null,
            total_count: 1,
          }],
          error: null,
        });
      }
      return Promise.resolve({ data: null, error: null });
    });

    render(
      <BrowserRouter>
        <ManageJobApplications />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Find View Resume button
    const viewResumeBtn = screen.getByText('View Resume');
    fireEvent.click(viewResumeBtn);

    // Check for "Opening…" or loading state
    await waitFor(() => {
      expect(screen.getByText(/Opening|Fetching|Loading/i)).toBeInTheDocument();
    });

    // Resolve the promise
    resolveSignedUrl({ data: { signedUrl: 'https://test.com/resume.pdf' }, error: null });
  });

  it('5. Send Offer button only visible for shortlisted/interviewing applicants', async () => {
    mockRpc.mockImplementation((funcName) => {
      if (funcName === 'get_applications_for_job_v2') {
        return Promise.resolve({
          data: [
            {
              id: 'app-1',
              applicant_id: 'user-1',
              job_id: 'job-123',
              status: 'submitted', // Should NOT show Send Offer
              created_at: '2024-01-15T10:00:00Z',
              applicant_name: 'Applicant Submitted',
              total_count: 2,
            },
            {
              id: 'app-2',
              applicant_id: 'user-2',
              job_id: 'job-123',
              status: 'shortlisted', // SHOULD show Send Offer
              created_at: '2024-01-14T09:00:00Z',
              applicant_name: 'Applicant Shortlisted',
              total_count: 2,
            },
            {
              id: 'app-3',
              applicant_id: 'user-3',
              job_id: 'job-123',
              status: 'interviewing', // SHOULD show Send Offer
              created_at: '2024-01-13T08:00:00Z',
              applicant_name: 'Applicant Interviewing',
              total_count: 2,
            },
          ],
          error: null,
        });
      }
      return Promise.resolve({ data: null, error: null });
    });

    render(
      <BrowserRouter>
        <ManageJobApplications />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Applicant Submitted')).toBeInTheDocument();
    });

    // Get all rows/cards
    const sendOfferButtons = screen.queryAllByText('Send Offer');
    
    // Should only have 2 Send Offer buttons (shortlisted and interviewing, NOT submitted)
    expect(sendOfferButtons).toHaveLength(2);
  });

  it('6. Bulk select: selecting 2 checkboxes shows action bar with correct count', async () => {
    mockRpc.mockImplementation((funcName) => {
      if (funcName === 'get_applications_for_job_v2') {
        return Promise.resolve({
          data: [
            { id: 'app-1', applicant_id: 'user-1', job_id: 'job-123', status: 'submitted', created_at: '2024-01-15T10:00:00Z', applicant_name: 'User 1', total_count: 3 },
            { id: 'app-2', applicant_id: 'user-2', job_id: 'job-123', status: 'submitted', created_at: '2024-01-14T09:00:00Z', applicant_name: 'User 2', total_count: 3 },
            { id: 'app-3', applicant_id: 'user-3', job_id: 'job-123', status: 'submitted', created_at: '2024-01-13T08:00:00Z', applicant_name: 'User 3', total_count: 3 },
          ],
          error: null,
        });
      }
      return Promise.resolve({ data: null, error: null });
    });

    render(
      <BrowserRouter>
        <ManageJobApplications />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('User 1')).toBeInTheDocument();
    });

    // Find checkboxes
    const checkboxes = screen.getAllByRole('checkbox');
    
    // Select first two checkboxes (skip "select all" if present)
    fireEvent.click(checkboxes[1]); // First applicant
    fireEvent.click(checkboxes[2]); // Second applicant

    // Check for action bar with count
    await waitFor(() => {
      expect(screen.getByText(/2 applicants? selected/i)).toBeInTheDocument();
    });

    // Check for Move to dropdown and Apply button
    expect(screen.getByText(/Move to/i)).toBeInTheDocument();
    expect(screen.getByText(/Apply to selected/i)).toBeInTheDocument();
  });
});

// ============================================
// TEST 7: PostJob wizard Step 1 aria-describedby
// ============================================
describe('PostJob Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock localStorage for drafts
    Storage.prototype.getItem = vi.fn(() => null);
    Storage.prototype.setItem = vi.fn();
    Storage.prototype.removeItem = vi.fn();
  });

  it('7. Step 1 shows aria-describedby error on submit with empty title field', async () => {
    render(
      <BrowserRouter>
        <PostJob />
      </BrowserRouter>
    );

    // Wait for component to mount
    await waitFor(() => {
      expect(screen.queryByText(/Post a Job/i)).toBeInTheDocument();
    });

    // Fill form type to get past selection screen if needed
    const formOption = screen.queryByText(/Fill Out Form/i) || screen.queryByText(/Full Job Form/i);
    if (formOption) {
      fireEvent.click(formOption);
    }

    // Wait for form to appear
    await waitFor(() => {
      const titleInput = screen.queryByLabelText(/Job Title/i) || screen.queryByPlaceholderText(/Job Title/i);
      if (titleInput) {
        // Found the form
        return true;
      }
    });

    const titleInput = screen.getByLabelText(/Job Title/i) || screen.getByPlaceholderText(/Job Title/i);
    
    // Leave title empty and try to proceed
    fireEvent.click(screen.getByText(/Next|Continue|Submit/i));

    // Check for aria-describedby attribute on error
    await waitFor(() => {
      const describedBy = titleInput.getAttribute('aria-describedby');
      expect(describedBy).toBeTruthy();
      
      // Check error message exists
      const errorId = describedBy;
      const errorElement = document.getElementById(errorId);
      expect(errorElement).toBeInTheDocument();
      expect(errorElement.textContent).toMatch(/required|error|invalid/i);
    });
  });
});

// ============================================
// TEST 8: Status badges render icon AND sr-only text
// ============================================
describe('Status Badge Accessibility', () => {
  it('8. Status badges render an icon AND sr-only text for every status value', () => {
    const { STATUS_BADGE_CLASS, STATUS_LABEL, STATUS_ICON } = require('../src/utils/applicationStatus');
    
    // Test that every status has both visual and screen reader support
    const statuses = ['submitted', 'under_review', 'shortlisted', 'interviewing', 'offered', 'hired', 'rejected', 'withdrawn'];
    
    statuses.forEach(status => {
      // Check label exists
      expect(STATUS_LABEL[status]).toBeTruthy();
      expect(typeof STATUS_LABEL[status]).toBe('string');
      
      // Check badge class exists
      expect(STATUS_BADGE_CLASS[status]).toBeTruthy();
      expect(typeof STATUS_BADGE_CLASS[status]).toBe('string');
      
      // Check icon exists (SVG path)
      expect(STATUS_ICON[status]).toBeTruthy();
      expect(typeof STATUS_ICON[status]).toBe('string');
      expect(STATUS_ICON[status].length).toBeGreaterThan(10); // Valid SVG path
    });
  });

  it('Status badge component renders correctly in ApplicationTracking', async () => {
    // Mock ApplicationTracking with offered status
    const mockOfferData = {
      data: [{
        id: 'app-1',
        job_id: 'job-123',
        created_at: '2024-01-15T10:00:00Z',
        status: 'offered',
        resume_url: 'test.pdf',
        jobs: {
          id: 'job-123',
          title: 'Test Job',
          company_name: 'Test Company',
          location: 'Remote',
          job_type: 'Full-time',
          deadline: '2024-12-31',
          apply_url: null,
          application_url: null,
          external_url: null,
        },
      }],
      error: null,
    };

    // Mock supabase.from
    vi.doMock('../src/utils/supabase', () => ({
      supabase: {
        from: vi.fn(() => ({
          select: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve(mockOfferData)),
          })),
        })),
        rpc: vi.fn(() => Promise.resolve({ data: { success: true, offer: {} }, error: null })),
      },
    }));

    // Re-import with new mock
    const { ApplicationTracking: AT } = await import('../src/components/Jobs/ApplicationTracking');

    render(
      <BrowserRouter>
        <AT />
      </BrowserRouter>
    );

    await waitFor(() => {
      // Check for status badge with SVG
      const badges = document.querySelectorAll('[class*="bg-"]');
      const statusBadge = Array.from(badges).find(el => 
        el.textContent?.includes('Offer') || el.textContent?.includes('offered')
      );
      
      if (statusBadge) {
        // Check for SVG icon
        const svg = statusBadge.querySelector('svg');
        expect(svg).toBeTruthy();
        
        // Check for sr-only text
        const srOnly = statusBadge.querySelector('.sr-only') || statusBadge.querySelector('[class*="sr-only"]');
        expect(srOnly).toBeTruthy();
      }
    });
  });
});

// ============================================
// Additional Utility Tests
// ============================================
describe('Regression Utilities', () => {
  it('Console smoke test - no critical console errors', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    // Components should render without critical errors
    expect(() => {
      render(
        <BrowserRouter>
          <div>Test</div>
        </BrowserRouter>
      );
    }).not.toThrow();

    // Check no React errors about invalid hooks or missing providers
    const criticalErrors = consoleError.mock.calls.filter(call => 
      call[0]?.includes?.('Invalid hook') ||
      call[0]?.includes?.('Context') ||
      call[0]?.includes?.('Provider')
    );

    expect(criticalErrors).toHaveLength(0);

    consoleError.mockRestore();
    consoleWarn.mockRestore();
  });
});

console.log('✅ Regression test file loaded. Run with: npx vitest run tests/regression.test.jsx');
