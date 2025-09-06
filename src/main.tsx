import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ResendEmailService } from './services/resendEmailService';

// Initialize Resend Email Service
const emailService = new ResendEmailService();

// Resend Email Service is ready
console.log('Resend Email Service initialized');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
