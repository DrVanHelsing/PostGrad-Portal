// ============================================
// Digital Signature Component (Mock)
// ============================================
import { useState, useRef, useCallback, useEffect } from 'react';
import { HiOutlinePencilSquare, HiOutlineTrash } from 'react-icons/hi2';

export default function SignaturePad({ onSign, signerName }) {
  const [mode, setMode] = useState('draw'); // 'draw' | 'type'
  const [typed, setTyped] = useState('');
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const hasStrokes = useRef(false);

  /* Canvas drawing */
  const startDraw = useCallback((e) => {
    drawing.current = true;
    hasStrokes.current = true;
    const ctx = canvasRef.current.getContext('2d');
    const rect = canvasRef.current.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  }, []);

  const draw = useCallback((e) => {
    if (!drawing.current) return;
    const ctx = canvasRef.current.getContext('2d');
    const rect = canvasRef.current.getBoundingClientRect();
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#003366';
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  }, []);

  const stopDraw = useCallback(() => { drawing.current = false; }, []);

  const clearCanvas = () => {
    const ctx = canvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    hasStrokes.current = false;
  };

  useEffect(() => {
    if (mode === 'draw' && canvasRef.current) {
      const canvas = canvasRef.current;
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    }
  }, [mode]);

  const handleSign = () => {
    const sigData = mode === 'draw'
      ? (canvasRef.current ? canvasRef.current.toDataURL() : null)
      : typed.trim();
    if (mode === 'draw' && !hasStrokes.current) return;
    if (mode === 'type' && !typed.trim()) return;
    onSign({ type: mode, data: sigData, name: signerName, date: new Date() });
  };

  return (
    <div className="signature-pad-wrapper">
      <div className="signature-pad-tabs">
        <button
          className={`signature-tab ${mode === 'draw' ? 'active' : ''}`}
          onClick={() => setMode('draw')}
        >
          <HiOutlinePencilSquare /> Draw
        </button>
        <button
          className={`signature-tab ${mode === 'type' ? 'active' : ''}`}
          onClick={() => setMode('type')}
        >
          Type
        </button>
      </div>

      {mode === 'draw' ? (
        <div className="signature-canvas-container">
          <canvas
            ref={canvasRef}
            className="signature-canvas"
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={stopDraw}
            onMouseLeave={stopDraw}
          />
          <button className="btn btn-ghost btn-sm signature-clear" onClick={clearCanvas}>
            <HiOutlineTrash /> Clear
          </button>
        </div>
      ) : (
        <div className="signature-type-container">
          <input
            className="signature-type-input"
            placeholder="Type your full name here"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
          />
          {typed && (
            <div className="signature-type-preview">
              {typed}
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
        <button className="btn btn-primary btn-sm" onClick={handleSign}>
          Apply Signature
        </button>
      </div>
    </div>
  );
}
