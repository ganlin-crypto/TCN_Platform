'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Nav from '@/components/Nav';
import { insertListing, insertAuditLog } from '@/lib/db';

const sectors = ['Energy', 'Renewable Energy', 'Real Estate', 'Technology'];

export default function SubmitListing() {
  const router = useRouter();
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    sector: '',
    location: '',
    timeline: '',
    targetAmount: '',
    description: '',
    highlights: '',
    submitterName: '',
    submitterEmail: '',
  });

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const highlights = form.highlights
        .split('\n')
        .map((h) => h.trim())
        .filter(Boolean);

      const id = await insertListing({
        name: form.name,
        sector: form.sector,
        location: form.location,
        timeline: form.timeline,
        description: form.description,
        highlights,
        submitterName: form.submitterName,
        targetAmount: Math.round(parseFloat(form.targetAmount || '0') * 1_000_000),
      });

      await insertAuditLog({
        timestamp: new Date().toISOString(),
        eventType: 'listing_submitted',
        userId: 'sub-temp',
        userName: form.submitterName,
        role: 'submitter',
        details: 'New listing submitted for admin review',
        listingId: id,
      });

      setSubmittedId(id);
    } catch (err) {
      console.error(err);
      setError('Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '11px 16px',
    border: '1.5px solid #dedcf2',
    borderRadius: 10,
    fontSize: 14,
    color: '#0f0e2a',
    background: '#fff',
    outline: 'none',
    fontFamily: 'var(--font-dm)',
    boxShadow: '0 1px 4px rgba(84,82,214,0.06)',
    transition: 'border-color 0.16s',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 700,
    color: '#2e2c5e',
    letterSpacing: '0.04em',
    marginBottom: 8,
    display: 'block',
    fontFamily: 'var(--font-dm)',
  };

  if (submittedId) {
    return (
      <div style={{ position: 'relative', zIndex: 10 }}>
        <Nav role="submitter" />
        <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 60px' }}>
          <div
            style={{
              background: '#fff',
              border: '1.5px solid #70d0a0',
              borderRadius: 20,
              padding: '48px',
              textAlign: 'center',
              maxWidth: 480,
              boxShadow: '0 4px 24px rgba(84,82,214,0.10)',
            }}
          >
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#edfaf3', border: '2px solid #70d0a0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 24 }}>
              ✓
            </div>
            <h2 style={{ fontFamily: 'var(--font-outfit)', fontSize: 22, fontWeight: 800, color: '#0f0e2a', marginBottom: 12 }}>
              Listing Submitted
            </h2>
            <p style={{ fontSize: 14, color: '#7a78a8', lineHeight: 1.7, marginBottom: 24 }}>
              Your listing has been saved to the database and submitted for admin review. You will be notified once it is approved or if additional information is required.
            </p>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                color: '#5452d6',
                background: '#eeecff',
                border: '1px solid #c8c6e8',
                borderRadius: 8,
                padding: '8px 16px',
                marginBottom: 24,
              }}
            >
              ID: {submittedId} · STATUS: PENDING REVIEW
            </div>
            <button
              onClick={() => router.push('/submitter/dashboard')}
              style={{
                padding: '12px 28px',
                background: '#5452d6',
                border: 'none',
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 700,
                color: '#fff',
                cursor: 'pointer',
                fontFamily: 'var(--font-dm)',
              }}
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', zIndex: 10 }}>
      <Nav role="submitter" />

      <div style={{ padding: '40px 60px 80px', maxWidth: 760, margin: '0 auto' }}>
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={() => router.back()}
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#7a78a8', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'var(--font-dm)' }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M9 2L4 7L9 12" stroke="#7a78a8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back
          </button>
        </div>

        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontFamily: 'var(--font-outfit)', fontSize: 28, fontWeight: 800, color: '#0f0e2a', letterSpacing: '-0.02em', marginBottom: 8 }}>
            Submit a Listing
          </h1>
          <p style={{ fontSize: 14, color: '#7a78a8', lineHeight: 1.7 }}>
            All submissions are reviewed by TCN Admin before publication. Listings must represent genuine collaboration opportunities — not financial solicitations.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div
            style={{
              background: '#fff',
              border: '1.5px solid #dedcf2',
              borderRadius: 16,
              padding: '32px 36px',
              boxShadow: '0 4px 24px rgba(84,82,214,0.10)',
              marginBottom: 20,
            }}
          >
            <h2 style={{ fontFamily: 'var(--font-outfit)', fontSize: 16, fontWeight: 700, color: '#0f0e2a', marginBottom: 24 }}>
              Project Information
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label style={labelStyle}>Project Name <span style={{ color: '#b82030' }}>*</span></label>
                <input name="name" value={form.name} onChange={handleChange} required placeholder="e.g. Clearwater Solar Farm Development" style={inputStyle} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={labelStyle}>Sector <span style={{ color: '#b82030' }}>*</span></label>
                  <select name="sector" value={form.sector} onChange={handleChange} required style={inputStyle}>
                    <option value="">Select sector...</option>
                    {sectors.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Location <span style={{ color: '#b82030' }}>*</span></label>
                  <input name="location" value={form.location} onChange={handleChange} required placeholder="e.g. Austin, Texas, USA" style={inputStyle} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={labelStyle}>Collaboration Timeline <span style={{ color: '#b82030' }}>*</span></label>
                  <input name="timeline" value={form.timeline} onChange={handleChange} required placeholder="e.g. Q2 2025 – Q4 2026" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Collaboration Reference Value (M USD)</label>
                  <input name="targetAmount" type="number" min="0" step="0.1" value={form.targetAmount} onChange={handleChange} placeholder="e.g. 24.5" style={inputStyle} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Project Description <span style={{ color: '#b82030' }}>*</span></label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  required
                  rows={5}
                  placeholder="Describe the collaboration opportunity, what partners are sought, and the scope of coordination expected. Do not include financial projections or return expectations."
                  style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
                />
              </div>
              <div>
                <label style={labelStyle}>Key Highlights</label>
                <textarea
                  name="highlights"
                  value={form.highlights}
                  onChange={handleChange}
                  rows={3}
                  placeholder="One highlight per line, e.g.:&#10;240 MW installed capacity&#10;Permitting at 70% completion"
                  style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
                />
              </div>
            </div>
          </div>

          <div
            style={{
              background: '#fff',
              border: '1.5px solid #dedcf2',
              borderRadius: 16,
              padding: '32px 36px',
              boxShadow: '0 4px 24px rgba(84,82,214,0.10)',
              marginBottom: 20,
            }}
          >
            <h2 style={{ fontFamily: 'var(--font-outfit)', fontSize: 16, fontWeight: 700, color: '#0f0e2a', marginBottom: 24 }}>
              Submitter Contact
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={labelStyle}>Organization Name <span style={{ color: '#b82030' }}>*</span></label>
                <input name="submitterName" value={form.submitterName} onChange={handleChange} required placeholder="e.g. Greenfield Capital Partners" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Contact Email <span style={{ color: '#b82030' }}>*</span></label>
                <input name="submitterEmail" type="email" value={form.submitterEmail} onChange={handleChange} required placeholder="contact@organization.com" style={inputStyle} />
              </div>
            </div>
          </div>

          {error && (
            <div style={{ padding: '12px 16px', background: '#fff0f2', border: '1px solid #f0a0a8', borderRadius: 10, fontSize: 13, color: '#b82030', marginBottom: 16 }}>
              {error}
            </div>
          )}

          <div
            style={{
              padding: '16px 20px',
              background: '#eeecff',
              border: '1px solid #c8c6e8',
              borderRadius: 12,
              fontSize: 12,
              color: '#5452d6',
              lineHeight: 1.6,
              marginBottom: 24,
            }}
          >
            <strong>Compliance reminder:</strong> Listings must not contain representations of economic returns, profit projections, or financial solicitations. TCN is a collaboration infrastructure platform — it does not originate, promote, or recommend opportunities.
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              style={{
                padding: '12px 24px',
                border: '1.5px solid #dedcf2',
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 500,
                color: '#7a78a8',
                background: '#fff',
                cursor: 'pointer',
                fontFamily: 'var(--font-dm)',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: '12px 28px',
                background: submitting ? '#8280e8' : '#5452d6',
                border: 'none',
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 700,
                color: '#fff',
                cursor: submitting ? 'wait' : 'pointer',
                fontFamily: 'var(--font-dm)',
                boxShadow: '0 3px 14px rgba(84,82,214,0.28)',
              }}
            >
              {submitting ? 'Submitting…' : 'Submit for Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
