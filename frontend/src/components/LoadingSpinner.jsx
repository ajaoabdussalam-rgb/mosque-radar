export default function LoadingSpinner({ text = 'Searching for mosques...' }) {
  return (
    <div className="spinner-container">
      <div className="radar-spinner">
        <div className="radar-circle circle-1"></div>
        <div className="radar-circle circle-2"></div>
        <div className="radar-circle circle-3"></div>
        <span className="radar-center">🕌</span>
      </div>
      <p className="spinnerText">{text}</p>

      <style>{`
        .spinner-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          gap: 20px;
        }

        .radar-spinner {
          position: relative;
          width: 80px;
          height: 80px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .radar-circle {
          position: absolute;
          border-radius: 50%;
          border: 2px solid rgba(16, 185, 129, 0.4);
        }

        .circle-1 {
          width: 30px;
          height: 30px;
          animation: pulseRadar 1.8s infinite;
        }

        .circle-2 {
          width: 55px;
          height: 55px;
          animation: pulseRadar 1.8s infinite 0.4s;
        }

        .circle-3 {
          width: 80px;
          height: 80px;
          animation: pulseRadar 1.8s infinite 0.8s;
        }

        .radar-center {
          font-size: 1.5rem;
          z-index: 2;
        }

        .spinnerText {
          color: var(--text-secondary);
          font-size: 0.95rem;
          font-weight: 500;
        }
      `}</style>
    </div>
  );
}
