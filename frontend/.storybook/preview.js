// Global Storybook preview for CRA React app
import React from 'react';
import '../src/index.css';
import '../src/App.css';

// Initialize MSW addon (mock service worker)
import { initialize, mswDecorator } from 'msw-storybook-addon';
import { MemoryRouter } from 'react-router-dom';
initialize();

export const decorators = [
  mswDecorator,
  (Story) => (
    <MemoryRouter>
      <Story />
    </MemoryRouter>
  ),
];

export const parameters = {
  actions: { argTypesRegex: '^on[A-Z].*' },
  controls: { expanded: true },
};
