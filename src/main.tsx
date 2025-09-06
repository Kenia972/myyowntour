import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { EmailService } from './services/emailService';

// Initialiser le service d'email au démarrage
EmailService.init();

// Afficher les instructions de configuration si nécessaire
if (!EmailService.isConfigured()) {
  console.log(EmailService.getConfigurationInstructions());
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
