import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  PageShell, SubPageHeader, GlassCard, PrimaryButton, SecondaryButton,
  InputField, Dropdown, ToggleSwitch, PropertyCard,
} from '../../components'
import { createProperty, formatRent, uploadImage } from '../../services/api'
import './ListNewProperty.css'

const STEPS = ['Basic', 'Photos', 'Specs', 'Terms', 'Review']
const AMENITY_LIST = [
  'Covered Parking', 'Swimming Pool', 'Gymnasium', '24/7 Security',
  'Power Backup', 'Kids Play Area', 'Clubhouse', 'Rooftop Garden',
]

const FURNISHING_MAP = {
  fully: 'fully_furnished',
  semi: 'semi_furnished',
  unfurnished: 'unfurnished',
}

const TYPE_MAP = {
  apartment: 'apartment',
  villa: 'villa',
  penthouse: 'penthouse',
  independent_house: 'independent_house',
}

export default function ListNewProperty() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '', unit: '', address: '', city: '', state: '', pincode: '',
    type: '', bhk: '', furnishing: '', sqft: '',
    amenities: {}, floor: '', totalFloors: '', age: '', facing: '',
    rent: '', depositMultiplier: '3', tenantType: '', leaseDuration: '12', maintenance: '',
    description: '',
  })
  const [photos, setPhotos] = useState({ Hall: null, Bedroom: null, Kitchen: null, Bathroom: null })
  const [photoUrls, setPhotoUrls] = useState([])
  const [uploading, setUploading] = useState(false)
  const fileInputRefs = useRef({})

  const set = (key, val) => { setError(''); setForm((f) => ({ ...f, [key]: val })) }
  const toggleAmenity = (a) => setForm((f) => ({
    ...f, amenities: { ...f.amenities, [a]: !f.amenities[a] },
  }))

  const validateStep = (s) => {
    if (s === 0) {
      if (!form.name.trim()) return 'Property name is required'
      if (!form.unit.trim()) return 'Unit/Apartment number is required'
      if (!form.address.trim()) return 'Address is required'
      if (!form.city.trim()) return 'City is required'
      if (!form.state.trim()) return 'State is required'
      if (!form.pincode.trim() || !/^\d{6}$/.test(form.pincode)) return 'Valid 6-digit pincode is required'
      if (!form.type) return 'Property type is required'
      if (!form.bhk) return 'BHK configuration is required'
      if (!form.furnishing) return 'Furnishing status is required'
      if (!form.sqft || Number(form.sqft) <= 0) return 'Valid area in sqft is required'
    }
    if (s === 2) {
      if (!form.floor && form.floor !== '0') return 'Floor number is required'
      if (!form.totalFloors || Number(form.totalFloors) <= 0) return 'Total floors is required'
    }
    if (s === 3) {
      if (!form.rent || Number(form.rent) <= 0) return 'Monthly rent is required'
      if (!form.maintenance && form.maintenance !== '0') return 'Maintenance charges are required (use 0 if none)'
    }
    return null
  }

  const next = () => {
    const err = validateStep(step)
    if (err) { setError(err); return }
    setError('')
    if (step < 4) setStep(step + 1)
  }
  const prev = () => { setError(''); if (step > 0) setStep(step - 1) }

  const handlePhotoSelect = async (room) => {
    const input = fileInputRefs.current[room]
    if (input) input.click()
  }

  const handlePhotoChange = async (room, e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotos((prev) => ({ ...prev, [room]: file }))

    // Upload immediately
    setUploading(true)
    try {
      const url = await uploadImage(file, 'properties')
      setPhotoUrls((prev) => [...prev, url])
    } catch (err) {
      setError(`Failed to upload ${room} photo: ${err.message}`)
    }
    setUploading(false)
  }

  const handleSubmit = async () => {
    setError('')
    setSubmitting(true)
    try {
      const selectedAmenities = Object.entries(form.amenities)
        .filter(([, v]) => v)
        .map(([k]) => k.toLowerCase().replace(/ /g, '_'))

      const payload = {
        name: form.name.trim(),
        unit: form.unit.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        pincode: form.pincode.trim(),
        type: TYPE_MAP[form.type] || form.type,
        bhk: form.bhk,
        sqft: Number(form.sqft),
        furnishing: FURNISHING_MAP[form.furnishing] || form.furnishing,
        floor: Number(form.floor) || 0,
        total_floors: Number(form.totalFloors) || 1,
        facing: form.facing || null,
        rent: Number(form.rent),
        security_deposit: Number(form.rent) * Number(form.depositMultiplier || 3),
        maintenance_charges: Number(form.maintenance) || 0,
        description: form.description || null,
        premium: false,
        amenities: selectedAmenities,
        images: photoUrls,
      }

      await createProperty(payload)
      navigate('/owner-dashboard', { state: { propertyCreated: true } })
    } catch (err) {
      setError(err.message || 'Failed to create property. Please try again.')
    }
    setSubmitting(false)
  }

  const furnishingLabel = { fully: 'Fully Furnished', semi: 'Semi Furnished', unfurnished: 'Unfurnished' }
  const typeLabel = { apartment: 'Apartment', villa: 'Villa', penthouse: 'Penthouse', independent_house: 'Independent House' }

  return (
    <PageShell
      header={<SubPageHeader title="List New Property" onBack={() => step > 0 ? prev() : navigate(-1)} />}
      stickyFooter={
        step < 4
          ? <PrimaryButton icon="arrow_forward" onClick={next}>Next Step →</PrimaryButton>
          : <div className="lnp__footer-btns">
              <SecondaryButton onClick={() => navigate(-1)}>Save as Draft</SecondaryButton>
              <PrimaryButton icon="check" loading={submitting} disabled={submitting} onClick={handleSubmit}>Submit Listing</PrimaryButton>
            </div>
      }
    >
      <div className="lnp animate-fade-in">
        {/* Error Banner */}
        {error && (
          <div className="lnp__error">
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>error</span>
            <span>{error}</span>
          </div>
        )}

        {/* Stepper */}
        <div className="lnp__stepper">
          {STEPS.map((s, i) => (
            <div key={s} className={`lnp__step ${i <= step ? 'lnp__step--active' : ''} ${i < step ? 'lnp__step--done' : ''}`}>
              <div className="lnp__step-dot">
                {i < step ? <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>check</span> : i + 1}
              </div>
              <span className="lnp__step-label">{s}</span>
              {i < STEPS.length - 1 && <div className="lnp__step-line" />}
            </div>
          ))}
        </div>

        {/* Step 1: Basic Info */}
        {step === 0 && (
          <div className="lnp__form">
            <InputField label="Property Name" icon="home" placeholder="e.g. The Azure Horizon" value={form.name} onChange={(e) => set('name', e.target.value)} />
            <InputField label="Unit / Apt Number" icon="apartment" placeholder="e.g. Apt 4B" value={form.unit} onChange={(e) => set('unit', e.target.value)} />
            <InputField label="Address" type="textarea" placeholder="Full street address" value={form.address} onChange={(e) => set('address', e.target.value)} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
              <InputField label="City" icon="location_city" placeholder="Mumbai" value={form.city} onChange={(e) => set('city', e.target.value)} />
              <InputField label="State" icon="map" placeholder="Maharashtra" value={form.state} onChange={(e) => set('state', e.target.value)} />
            </div>
            <InputField label="Pincode" icon="pin_drop" placeholder="400001" value={form.pincode} onChange={(e) => set('pincode', e.target.value)} />
            <Dropdown label="Property Type" options={[{ value: 'apartment', label: 'Apartment' }, { value: 'villa', label: 'Villa' }, { value: 'penthouse', label: 'Penthouse' }, { value: 'independent_house', label: 'Independent House' }]} value={form.type} onChange={(e) => set('type', e.target.value)} placeholder="Select type" />
            <Dropdown label="BHK Configuration" options={[{ value: '1 BHK', label: '1 BHK' }, { value: '2 BHK', label: '2 BHK' }, { value: '3 BHK', label: '3 BHK' }, { value: '4+ BHK', label: '4 BHK+' }]} value={form.bhk} onChange={(e) => set('bhk', e.target.value)} placeholder="Select BHK" />
            <Dropdown label="Furnishing" options={[{ value: 'fully', label: 'Fully Furnished' }, { value: 'semi', label: 'Semi Furnished' }, { value: 'unfurnished', label: 'Unfurnished' }]} value={form.furnishing} onChange={(e) => set('furnishing', e.target.value)} placeholder="Select" />
            <InputField label="Area (Sq.ft)" icon="square_foot" type="number" placeholder="1500" value={form.sqft} onChange={(e) => set('sqft', e.target.value)} />
          </div>
        )}

        {/* Step 2: Photos */}
        {step === 1 && (
          <div className="lnp__form">
            <p className="lnp__section-title">Property Photos</p>
            {uploading && <p style={{ fontSize: 'var(--fs-caption)', color: 'var(--primary)' }}>Uploading photo...</p>}
            <div className="lnp__photo-grid">
              {['Hall', 'Bedroom', 'Kitchen', 'Bathroom'].map((room) => (
                <div key={room} className={`lnp__photo-zone ${photos[room] ? 'lnp__photo-zone--filled' : ''}`} onClick={() => handlePhotoSelect(room)}>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    style={{ display: 'none' }}
                    ref={(el) => { fileInputRefs.current[room] = el }}
                    onChange={(e) => handlePhotoChange(room, e)}
                  />
                  {photos[room] ? (
                    <>
                      <img src={URL.createObjectURL(photos[room])} alt={room} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--radius-lg)' }} />
                      <span className="lnp__photo-check"><span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#22C55E' }}>check_circle</span></span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined" style={{ fontSize: '28px', color: 'var(--primary)' }}>add_photo_alternate</span>
                      <p style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{room}</p>
                    </>
                  )}
                </div>
              ))}
            </div>
            <p className="lnp__section-title" style={{ marginTop: 'var(--space-4)' }}>Description (optional)</p>
            <InputField type="textarea" placeholder="Describe your property — views, nearby landmarks, special features..." value={form.description} onChange={(e) => set('description', e.target.value)} />
          </div>
        )}

        {/* Step 3: Specs */}
        {step === 2 && (
          <div className="lnp__form">
            <p className="lnp__section-title">Amenities</p>
            <div className="lnp__amenity-toggles">
              {AMENITY_LIST.map((a) => (
                <ToggleSwitch key={a} label={a} checked={!!form.amenities[a]} onChange={() => toggleAmenity(a)} />
              ))}
            </div>
            <InputField label="Floor Number" type="number" placeholder="4" value={form.floor} onChange={(e) => set('floor', e.target.value)} />
            <InputField label="Total Floors" type="number" placeholder="12" value={form.totalFloors} onChange={(e) => set('totalFloors', e.target.value)} />
            <Dropdown label="Property Age" options={[{ value: 'new', label: 'Under Construction' }, { value: '1-5', label: '1-5 Years' }, { value: '5-10', label: '5-10 Years' }, { value: '10+', label: '10+ Years' }]} value={form.age} onChange={(e) => set('age', e.target.value)} placeholder="Select age" />
            <Dropdown label="Facing Direction" options={[{ value: 'North', label: 'North' }, { value: 'South', label: 'South' }, { value: 'East', label: 'East' }, { value: 'West', label: 'West' }]} value={form.facing} onChange={(e) => set('facing', e.target.value)} placeholder="Select" />
          </div>
        )}

        {/* Step 4: Terms */}
        {step === 3 && (
          <div className="lnp__form">
            <InputField label="Expected Monthly Rent (₹)" icon="currency_rupee" type="number" placeholder="45000" value={form.rent} onChange={(e) => set('rent', e.target.value)} />
            <Dropdown label="Security Deposit" options={[{ value: '2', label: '2 months rent' }, { value: '3', label: '3 months rent' }, { value: '6', label: '6 months rent' }]} value={form.depositMultiplier} onChange={(e) => set('depositMultiplier', e.target.value)} />
            <Dropdown label="Preferred Tenant Type" options={[{ value: 'family', label: 'Family' }, { value: 'bachelor', label: 'Bachelor' }, { value: 'any', label: 'Any' }]} value={form.tenantType} onChange={(e) => set('tenantType', e.target.value)} placeholder="Select" />
            <Dropdown label="Lease Duration" options={[{ value: '6', label: '6 months' }, { value: '11', label: '11 months' }, { value: '12', label: '12 months' }, { value: '24', label: '24 months' }]} value={form.leaseDuration} onChange={(e) => set('leaseDuration', e.target.value)} />
            <InputField label="Maintenance Charges (₹/mo)" icon="currency_rupee" type="number" placeholder="3000" value={form.maintenance} onChange={(e) => set('maintenance', e.target.value)} />
          </div>
        )}

        {/* Step 5: Review */}
        {step === 4 && (
          <div className="lnp__form">
            <p className="lnp__section-title">Review Your Listing</p>
            <GlassCard>
              <div className="lnp__review-rows">
                {[
                  ['Property Name', form.name || 'Not provided'],
                  ['Unit', form.unit || '—'],
                  ['Location', [form.city, form.state].filter(Boolean).join(', ') || '—'],
                  ['Pincode', form.pincode || '—'],
                  ['Type', typeLabel[form.type] || form.type || '—'],
                  ['BHK', form.bhk || '—'],
                  ['Area', form.sqft ? `${form.sqft} sqft` : '—'],
                  ['Furnishing', furnishingLabel[form.furnishing] || form.furnishing || '—'],
                  ['Floor', form.floor ? `${form.floor} of ${form.totalFloors}` : '—'],
                  ['Facing', form.facing || '—'],
                  ['Expected Rent', form.rent ? `₹${Number(form.rent).toLocaleString('en-IN')}/mo` : '—'],
                  ['Security Deposit', form.rent && form.depositMultiplier ? `₹${(Number(form.rent) * Number(form.depositMultiplier)).toLocaleString('en-IN')}` : '—'],
                  ['Maintenance', form.maintenance ? `₹${Number(form.maintenance).toLocaleString('en-IN')}/mo` : '₹0/mo'],
                  ['Lease Duration', form.leaseDuration ? `${form.leaseDuration} months` : '—'],
                  ['Photos', photoUrls.length > 0 ? `${photoUrls.length} uploaded` : 'None'],
                  ['Amenities', Object.entries(form.amenities).filter(([,v]) => v).map(([k]) => k).join(', ') || 'None'],
                ].map(([k, v]) => (
                  <div key={k} className="lnp__review-row">
                    <span className="lnp__review-label">{k}</span>
                    <span className="lnp__review-value">{v}</span>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>
        )}
      </div>
    </PageShell>
  )
}
