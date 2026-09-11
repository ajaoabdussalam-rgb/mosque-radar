import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import Alert from '../components/Alert';
import Badge from '../components/Badge';

export default function SubmitMosquePage() {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    latitude: '',
    longitude: '',
    submittedBy: ''
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [generalError, setGeneralError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successData, setSuccessData] = useState(null);

  // Autofill current device GPS coordinates
  const autofillGPS = () => {
    if (!navigator.geolocation) {
      setGeneralError('Geolocation is not supported on this device.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData((prev) => ({
          ...prev,
          latitude: pos.coords.latitude.toFixed(6),
          longitude: pos.coords.longitude.toFixed(6)
        }));
        setFieldErrors((prev) => ({ ...prev, coordinates: null, latitude: null, longitude: null }));
      },
      () => {
        setGeneralError('Could not acquire GPS position. Please enter coordinates manually.');
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setFieldErrors((prev) => ({ ...prev, image: 'Image exceeds 5MB size limit' }));
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setFieldErrors((prev) => ({ ...prev, image: null }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneralError(null);
    setFieldErrors({});

    // Client-side quick check
    const errors = {};
    if (!formData.name.trim() || formData.name.trim().length < 2) {
      errors.name = 'Mosque name must be at least 2 characters';
    }
    if (!formData.address.trim() || formData.address.trim().length < 3) {
      errors.address = 'Address must be at least 3 characters';
    }

    const lat = parseFloat(formData.latitude);
    const lng = parseFloat(formData.longitude);

    if (isNaN(lat) || lat < -90 || lat > 90) {
      errors.latitude = 'Latitude must be between -90 and 90';
    }
    if (isNaN(lng) || lng < -180 || lng > 180) {
      errors.longitude = 'Longitude must be between -180 and 180';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    try {
      setIsSubmitting(true);

      let uploadedImageUrls = [];
      if (selectedFile) {
        const uploadRes = await api.uploadImage(selectedFile);
        if (uploadRes.url) {
          uploadedImageUrls.push(uploadRes.url);
        }
      }

      const payload = {
        name: formData.name.trim(),
        address: formData.address.trim(),
        latitude: lat,
        longitude: lng,
        images: uploadedImageUrls,
        submittedBy: formData.submittedBy.trim() || 'Community Member'
      };

      const res = await api.createMosque(payload);
      setSuccessData(res.data);
    } catch (err) {
      if (err.errors) {
        setFieldErrors(err.errors);
      } else {
        setGeneralError(err.message || 'Submission failed. Please check your inputs.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (successData) {
    return (
      <div className="glass-card success-container">
        <span className="success-badge-huge">✅</span>
        <h2>Mosque Submitted Successfully!</h2>
        <p className="success-msg">
          Thank you for contributing <strong>"{successData.name}"</strong> to Mosque Radar.
        </p>
        <div className="pending-notice">
          <span>ℹ️</span>
          <span>
            Your submission has been queued for community moderation (Status: <strong>Pending</strong>).
            Once verified by a moderator, it will appear automatically on the live proximity radar.
          </span>
        </div>
        <div className="success-actions">
          <button
            type="button"
            onClick={() => {
              setSuccessData(null);
              setFormData({ name: '', address: '', latitude: '', longitude: '', submittedBy: '' });
              setSelectedFile(null);
              setPreviewUrl(null);
            }}
            className="btn btn-primary"
          >
            + Submit Another Mosque
          </button>
          <Link to="/" className="btn btn-secondary">
            Return to Radar
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="submit-page">
      <div className="submit-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '8px' }}>
          <h1 style={{ margin: 0 }}>Submit a Discovered Mosque</h1>
          <Badge variant="primary">Community Contribution</Badge>
        </div>
        <p className="submit-sub">
          Help travelers and locals discover prayer spaces in your area.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="submit-form glass-card">
        {generalError && (
          <Alert
            type="error"
            title="Submission Error"
            message={generalError}
            onClose={() => setGeneralError(null)}
          />
        )}

        {/* Mosque Name */}
        <div className="form-group">
          <label className="form-label" htmlFor="name">
            Mosque Name *
          </label>
          <input
            id="name"
            type="text"
            className="form-input"
            placeholder="e.g. Al-Noor Islamic Center"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          {fieldErrors.name && <p className="form-error">{fieldErrors.name}</p>}
        </div>

        {/* Address */}
        <div className="form-group">
          <label className="form-label" htmlFor="address">
            Address or Street Landmark *
          </label>
          <textarea
            id="address"
            rows="2"
            className="form-textarea"
            placeholder="e.g. 14 Airport Road, Near Central Hospital, Kano"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            required
          />
          {fieldErrors.address && <p className="form-error">{fieldErrors.address}</p>}
        </div>

        {/* Coordinates Row */}
        <div className="coords-input-section">
          <div className="coords-header">
            <span className="form-label" style={{ marginBottom: 0 }}>
              Geographic Coordinates *
            </span>
            <button
              type="button"
              onClick={autofillGPS}
              className="btn btn-secondary btn-sm gps-autofill"
            >
              📍 Autofill My Current GPS
            </button>
          </div>

          <div className="coords-fields-grid">
            <div className="form-group" style={{ marginBottom: 0 }}>
              <input
                id="latitude"
                type="number"
                step="any"
                className="form-input"
                placeholder="Latitude (e.g. 6.5244)"
                value={formData.latitude}
                onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                required
              />
              {fieldErrors.latitude && <p className="form-error">{fieldErrors.latitude}</p>}
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <input
                id="longitude"
                type="number"
                step="any"
                className="form-input"
                placeholder="Longitude (e.g. 3.3792)"
                value={formData.longitude}
                onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                required
              />
              {fieldErrors.longitude && <p className="form-error">{fieldErrors.longitude}</p>}
            </div>
          </div>
          {fieldErrors.coordinates && <p className="form-error">{fieldErrors.coordinates}</p>}
        </div>

        {/* Photo Upload */}
        <div className="form-group">
          <label className="form-label" htmlFor="image">
            Mosque Photo (Optional, JPEG/PNG/WebP, Max 5MB)
          </label>
          <input
            id="image"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="form-input"
            onChange={handleFileChange}
          />
          {fieldErrors.image && <p className="form-error">{fieldErrors.image}</p>}

          {previewUrl && (
            <div className="image-preview-container">
              <img src={previewUrl} alt="Preview" className="img-preview" />
              <button
                type="button"
                onClick={() => {
                  setSelectedFile(null);
                  setPreviewUrl(null);
                }}
                className="preview-remove"
              >
                Remove Photo
              </button>
            </div>
          )}
        </div>

        {/* Submitter Name */}
        <div className="form-group">
          <label className="form-label" htmlFor="submittedBy">
            Your Name / Nickname (Optional)
          </label>
          <input
            id="submittedBy"
            type="text"
            className="form-input"
            placeholder="e.g. Abdussalam or Anonymous"
            value={formData.submittedBy}
            onChange={(e) => setFormData({ ...formData, submittedBy: e.target.value })}
          />
        </div>

        <button type="submit" disabled={isSubmitting} className="btn btn-primary btn-block">
          {isSubmitting ? 'Submitting to Moderation...' : 'Submit Mosque to Radar'}
        </button>
      </form>

      <style>{`
        .submit-page {
          max-width: 680px;
          margin: 0 auto;
        }

        .submit-header {
          text-align: center;
          margin-bottom: 28px;
        }

        .submit-sub {
          color: var(--text-secondary);
          margin-top: 8px;
        }

        .coords-input-section {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-sm);
          padding: 16px;
          margin-bottom: 20px;
        }

        .coords-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          flex-wrap: wrap;
          gap: 8px;
        }

        .coords-fields-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .image-preview-container {
          margin-top: 12px;
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .img-preview {
          width: 90px;
          height: 90px;
          object-fit: cover;
          border-radius: 8px;
          border: 1px solid var(--border-subtle);
        }

        .preview-remove {
          background: transparent;
          color: #f87171;
          border: none;
          cursor: pointer;
          font-size: 0.88rem;
          text-decoration: underline;
        }

        .btn-block {
          width: 100%;
          padding: 14px;
          font-size: 1.05rem;
          margin-top: 10px;
        }

        .success-container {
          text-align: center;
          max-width: 580px;
          margin: 40px auto;
          padding: 48px 30px;
        }

        .success-badge-huge {
          font-size: 4rem;
          display: block;
          margin-bottom: 16px;
        }

        .success-msg {
          color: var(--text-secondary);
          font-size: 1.1rem;
          margin: 12px 0 24px 0;
        }

        .pending-notice {
          background: rgba(245, 158, 11, 0.12);
          border: 1px solid rgba(245, 158, 11, 0.3);
          border-radius: var(--radius-sm);
          padding: 14px;
          text-align: left;
          display: flex;
          gap: 12px;
          font-size: 0.9rem;
          color: #fde68a;
          margin-bottom: 28px;
        }

        .success-actions {
          display: flex;
          gap: 14px;
          justify-content: center;
        }
      `}</style>
    </div>
  );
}
