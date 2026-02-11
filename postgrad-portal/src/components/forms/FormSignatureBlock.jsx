// ============================================
// FormSignatureBlock – Signature display + capture
// Wraps the existing SignaturePad component
// ============================================
import { useState } from 'react';
import { HiOutlineCheckCircle, HiOutlinePencilSquare } from 'react-icons/hi2';
import SignaturePad from '../common/SignaturePad';

/**
 * @param {string}   sectionId     – ID of the section being signed
 * @param {string}   label         – Display label (e.g. "Signature of Supervisor")
 * @param {boolean}  signed        – Whether the section is already signed
 * @param {Object}   signatureData – { type, data, name, date }
 * @param {boolean}  canSign       – Whether the current user can sign
 * @param {Function} onSign        – (sigData) => void
 */
export default function FormSignatureBlock({ sectionId, label, signed, signatureData, canSign, onSign }) {
  const [showPad, setShowPad] = useState(false);

  const handleSign = (sigData) => {
    onSign(sigData);
    setShowPad(false);
  };

  return (
    <div className="signature-block">
      <div className="signature-block-label">{label || 'Signature'}</div>

      {signed && signatureData ? (
        <div className="signature-block-signed">
          <HiOutlineCheckCircle />
          <div className="sig-details">
            {signatureData.type === 'draw' && signatureData.data ? (
              <img src={signatureData.data} alt="Signature" className="sig-preview-drawn" />
            ) : (
              <span className="sig-preview">
                {signatureData.data || signatureData.name}
              </span>
            )}
            <span className="sig-name">{signatureData.name}</span>
            <span className="sig-date">
              {signatureData.date
                ? new Date(signatureData.date).toLocaleDateString('en-ZA', {
                    year: 'numeric', month: 'long', day: 'numeric',
                  })
                : ''
              }
            </span>
          </div>
        </div>
      ) : canSign ? (
        <>
          {showPad ? (
            <div style={{ marginTop: 8 }}>
              <SignaturePad onSign={handleSign} signerName="" />
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setShowPad(false)}
                style={{ marginTop: 4 }}
              >
                Cancel
              </button>
            </div>
          ) : (
            <button className="btn btn-outline btn-sm" onClick={() => setShowPad(true)}>
              <HiOutlinePencilSquare /> Sign Here
            </button>
          )}
        </>
      ) : (
        <span style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic' }}>
          Awaiting signature...
        </span>
      )}
    </div>
  );
}
