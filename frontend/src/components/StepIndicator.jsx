import { useLocation } from 'react-router-dom';

const STEPS = [
  { path: '/', label: 'Events' },
  { path: '/events', label: 'Seats' },
  { path: '/checkout', label: 'Payment' },
  { path: '/ticket', label: 'Ticket' }
];

function getStepIndex(pathname) {
  if (pathname.startsWith('/events/')) return 1;
  if (pathname === '/checkout') return 2;
  if (pathname === '/ticket') return 3;
  return 0;
}

export default function StepIndicator() {
  const { pathname } = useLocation();
  const current = getStepIndex(pathname);

  return (
    <div className="steps">
      {STEPS.map((step, i) => (
        <div key={step.label} style={{ display: 'flex', alignItems: 'center' }}>
          <div className={`step ${i < current ? 'done' : ''} ${i === current ? 'active' : ''}`}>
            <div className="step-dot">{i < current ? '✓' : i + 1}</div>
            <span>{step.label}</span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`step-line ${i < current ? 'done' : ''}`} />
          )}
        </div>
      ))}
    </div>
  );
}
