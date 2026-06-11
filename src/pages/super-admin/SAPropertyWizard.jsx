import { useEffect, useState, useMemo, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  createProperty,
  updateProperty,
  fetchPropertyDetails,
  fetchUsersByRole,
  uploadImage,
} from '../../services/api'
import { reportError } from '../../utils/errors'
import './SAPropertyWizard.css'

const STEPS = [
  { key: 'basic', label: 'Basic Info', icon: 'apartment', desc: 'Name, unit & location' },
  { key: 'details', label: 'Details', icon: 'straighten', desc: 'Type, size & furnishing' },
  { key: 'pricing', label: 'Pricing', icon: 'payments', desc: 'Rent, deposit & charges' },
  { key: 'photos', label: 'Photos', icon: 'photo_library', desc: 'Upload property images' },
  { key: 'owner', label: 'Owner', icon: 'real_estate_agent', desc: 'Assign NRI owner' },
  { key: 'managers', label: 'Managers', icon: 'manage_accounts', desc: 'Assign managers' },
  { key: 'review', label: 'Review', icon: 'fact_check', desc: 'Confirm & publish' },
]

const MAX_IMAGES = 10

// Indian states + UTs — used to drive the state dropdown so input stays
// consistent across listings.
const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
]

const TYPE_OPTIONS = [
  { value: 'apartment', label: 'Apartment' },
  { value: 'villa', label: 'Villa' },
  { value: 'independent_house', label: 'Independent House' },
  { value: 'penthouse', label: 'Penthouse' },
]

const FURNISHING_OPTIONS = [
  { value: 'fully_furnished', label: 'Fully Furnished' },
  { value: 'semi_furnished', label: 'Semi Furnished' },
  { value: 'unfurnished', label: 'Unfurnished' },
]

const BHK_OPTIONS = ['1 BHK', '1.5 BHK', '2 BHK', '2.5 BHK', '3 BHK', '3.5 BHK', '4 BHK', '4+ BHK']

const EMPTY_FORM = {
  name: '', unit: '', address: '', city: '', state: '', pincode: '',
  type: 'apartment', bhk: '2 BHK', sqft: '', furnishing: 'semi_furnished',
  floor: '', total_floors: '', facing: '', rent: '', security_deposit: '',
  maintenance_charges: '', description: '', premium: false, images: [],
}

function getInitials(name) {
  if (!name) return '?'
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

function toFormString(v) {
  return v === null || v === undefined ? '' : String(v)
}

export default function SAPropertyWizard() {
  const navigate = useNavigate()
  const { propertyId } = useParams()
  const isEdit = Boolean(propertyId)

  const [step, setStep] = useState(0)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)        // draft save in flight
  const [publishing, setPublishing] = useState(false) // publish in flight
  const [loading, setLoading] = useState(isEdit)
  const [status, setStatus] = useState('draft')

  // Owner assignment
  const [owners, setOwners] = useState([])
  const [ownerSearch, setOwnerSearch] = useState('')
  const [selectedOwner, setSelectedOwner] = useState(null)
  const [skipOwner, setSkipOwner] = useState(false)

  // Manager assignment
  const [managers, setManagers] = useState([])
  const [managerSearch, setManagerSearch] = useState('')
  const [selectedManagers, setSelectedManagers] = useState([])
  const [skipManagers, setSkipManagers] = useState(false)

  // Photo uploads
  const [uploadingImages, setUploadingImages] = useState(false)
  const [imageError, setImageError] = useState('')

  // Pincode lookup
  const [pincodeLookup, setPincodeLookup] = useState({ loading: false, hit: false })

  const setField = (key, value) => setForm(prev => ({ ...prev, [key]: value }))

  // ── Load existing property in edit mode ──
  useEffect(() => {
    if (!isEdit) return
    let cancelled = false
    setLoading(true)
    fetchPropertyDetails(propertyId)
      .then((p) => {
        if (cancelled || !p) return
        setForm({
          name: toFormString(p.name),
          unit: toFormString(p.unit),
          address: toFormString(p.address),
          city: toFormString(p.city),
          state: toFormString(p.state),
          pincode: toFormString(p.pincode),
          type: p.type || 'apartment',
          bhk: p.bhk || '2 BHK',
          sqft: toFormString(p.sqft),
          furnishing: p.furnishing || 'semi_furnished',
          floor: toFormString(p.floor),
          total_floors: toFormString(p.total_floors),
          facing: toFormString(p.facing),
          rent: toFormString(p.rent),
          security_deposit: toFormString(p.security_deposit),
          maintenance_charges: toFormString(p.maintenance_charges),
          description: toFormString(p.description),
          premium: Boolean(p.premium),
          images: Array.isArray(p.images) ? p.images : [],
        })
        setStatus(p.status || 'draft')
        if (p.owner) { setSelectedOwner(p.owner); setSkipOwner(false) } else { setSkipOwner(true) }
        if (Array.isArray(p.managers) && p.managers.length > 0) {
          setSelectedManagers(p.managers.map(m => ({ id: m.id, name: m.name, email: m.email })))
        } else {
          setSkipManagers(true)
        }
      })
      .catch((err) => reportError(err, { context: 'SAPropertyWizard.load' }))
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [propertyId, isEdit])

  // Load owners / managers when those steps open
  useEffect(() => {
    if (step === 4 && !skipOwner) {
      fetchUsersByRole('owner', ownerSearch).then(setOwners).catch(() => setOwners([]))
    }
  }, [step, ownerSearch, skipOwner])

  useEffect(() => {
    if (step === 5 && !skipManagers) {
      fetchUsersByRole('manager', managerSearch).then(setManagers).catch(() => setManagers([]))
    }
  }, [step, managerSearch, skipManagers])

  // ── Validation ──
  const validateBasic = useCallback(() => {
    if (!form.name.trim() || !form.unit.trim() || !form.address.trim() || !form.city.trim() || !form.state.trim()) {
      return 'Please fill all required fields (name, unit, address, city, state).'
    }
    if (!/^\d{6}$/.test(form.pincode)) return 'Pincode must be exactly 6 digits.'
    return null
  }, [form])

  const validateForPublish = useCallback(() => {
    const basic = validateBasic()
    if (basic) return basic
    if (!form.sqft || Number(form.sqft) <= 0) return 'Area (sqft) must be greater than 0 to publish.'
    if (!form.total_floors || Number(form.total_floors) <= 0) return 'Total floors must be greater than 0 to publish.'
    if (!form.rent || Number(form.rent) <= 0) return 'Monthly rent must be greater than 0 to publish.'
    return null
  }, [form, validateBasic])

  const validateStep = useCallback((s) => {
    switch (s) {
      case 0: return validateBasic()
      case 4:
        if (!skipOwner && !selectedOwner) return 'Select an owner — or check "Skip" to assign later.'
        return null
      case 5:
        if (!skipManagers && selectedManagers.length === 0) return 'Select at least one manager — or check "Skip" to assign later.'
        return null
      default: return null
    }
  }, [validateBasic, skipOwner, selectedOwner, skipManagers, selectedManagers])

  const goNext = () => {
    const err = validateStep(step)
    if (err) { setFormError(err); return }
    setFormError('')
    setStep(s => Math.min(s + 1, STEPS.length - 1))
  }
  const goBack = () => { setFormError(''); setStep(s => Math.max(s - 1, 0)) }

  const goToStep = (i) => {
    if (i === step) return
    if (i < step) { setFormError(''); setStep(i); return }
    const err = validateStep(step)
    if (err) { setFormError(err); return }
    setFormError('')
    setStep(i)
  }

  const buildPayload = (nextStatus) => {
    const num = (v, fallback = null) => (v === '' || v === null || v === undefined ? fallback : Number(v))
    const payload = {
      name: form.name.trim(),
      unit: form.unit.trim(),
      address: form.address.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
      pincode: form.pincode.trim(),
      type: form.type,
      bhk: form.bhk,
      furnishing: form.furnishing,
      sqft: num(form.sqft),
      floor: num(form.floor, 0),
      total_floors: num(form.total_floors),
      facing: form.facing.trim() || null,
      rent: num(form.rent),
      security_deposit: num(form.security_deposit, 0),
      maintenance_charges: num(form.maintenance_charges, 0),
      description: form.description.trim() || null,
      premium: form.premium,
      status: nextStatus,
      amenities: [],
      images: form.images || [],
    }
    payload.owner_id = (!skipOwner && selectedOwner) ? selectedOwner.id : null
    payload.manager_ids = (!skipManagers && selectedManagers.length > 0)
      ? selectedManagers.map(m => m.id)
      : null
    return payload
  }

  const persist = async (nextStatus) => {
    setFormError('')
    // Draft needs only basic info; publish needs the full set.
    const err = nextStatus === 'active' ? validateForPublish() : validateBasic()
    if (err) { setFormError(err); return }

    const isPublish = nextStatus === 'active'
    if (isPublish) setPublishing(true); else setSaving(true)
    try {
      const payload = buildPayload(nextStatus)
      if (isEdit) {
        await updateProperty(propertyId, payload)
      } else {
        await createProperty(payload)
      }
      navigate('/sa/properties')
    } catch (e) {
      setFormError(e?.message || 'Failed to save property.')
    } finally {
      setSaving(false)
      setPublishing(false)
    }
  }

  const toggleManager = (m) => {
    setSelectedManagers(prev => {
      const exists = prev.find(x => x.id === m.id)
      return exists ? prev.filter(x => x.id !== m.id) : [...prev, m]
    })
  }

  const filteredOwners = useMemo(() => owners, [owners])
  const filteredManagers = useMemo(() => managers, [managers])

  // ── Image upload ──
  const handleImageFiles = async (files) => {
    if (!files || files.length === 0) return
    const current = form.images || []
    const room = MAX_IMAGES - current.length
    if (room <= 0) {
      setImageError(`Maximum ${MAX_IMAGES} images. Remove one to add another.`)
      return
    }
    const toUpload = Array.from(files).slice(0, room)
    setImageError('')
    setUploadingImages(true)
    try {
      const uploaded = []
      for (const file of toUpload) {
        const url = await uploadImage(file, `properties/${propertyId || 'new'}`)
        if (url) uploaded.push(url)
      }
      if (uploaded.length) {
        setForm((prev) => ({ ...prev, images: [...(prev.images || []), ...uploaded] }))
      }
    } catch (e) {
      setImageError(e?.message || 'Failed to upload image(s).')
    } finally {
      setUploadingImages(false)
    }
  }

  const removeImage = (url) => {
    setForm((prev) => ({ ...prev, images: (prev.images || []).filter((u) => u !== url) }))
  }

  // ── Pincode → city/state auto-fill (api.postalpincode.in) ──
  const lookupPincode = async (pin) => {
    if (!/^\d{6}$/.test(pin)) return
    setPincodeLookup({ loading: true, hit: false })
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`)
      const data = await res.json()
      const post = Array.isArray(data) && data[0]?.Status === 'Success'
        ? data[0].PostOffice?.[0]
        : null
      if (post) {
        setForm((prev) => ({
          ...prev,
          // Only overwrite if blank — don't stomp user edits.
          city: prev.city || post.District || post.Block || '',
          state: prev.state || post.State || '',
        }))
        setPincodeLookup({ loading: false, hit: true })
      } else {
        setPincodeLookup({ loading: false, hit: false })
      }
    } catch {
      setPincodeLookup({ loading: false, hit: false })
    }
  }

  const onPincodeChange = (v) => {
    const digits = v.replace(/\D/g, '').slice(0, 6)
    setField('pincode', digits)
    if (digits.length === 6) lookupPincode(digits)
    else if (pincodeLookup.hit) setPincodeLookup({ loading: false, hit: false })
  }

  // ── Step bodies ──
  const renderBasicInfo = () => (
    <>
      <div className="sapw2__form-row">
        <div className="sapw2__form-group">
          <label className="sapw2__form-label">Property Name *</label>
          <input className="sapw2__form-input" placeholder="e.g. Serenity Heights" value={form.name} onChange={e => setField('name', e.target.value)} />
        </div>
        <div className="sapw2__form-group">
          <label className="sapw2__form-label">Unit *</label>
          <input className="sapw2__form-input" placeholder="e.g. Apt 4B" value={form.unit} onChange={e => setField('unit', e.target.value)} />
        </div>
      </div>
      <div className="sapw2__form-group">
        <label className="sapw2__form-label">Address *</label>
        <input className="sapw2__form-input" placeholder="Full street address" value={form.address} onChange={e => setField('address', e.target.value)} />
      </div>
      <div className="sapw2__form-row sapw2__form-row--3">
        <div className="sapw2__form-group">
          <label className="sapw2__form-label">Pincode *</label>
          <div style={{ position: 'relative' }}>
            <input
              className="sapw2__form-input"
              placeholder="400001"
              maxLength={6}
              value={form.pincode}
              onChange={(e) => onPincodeChange(e.target.value)}
            />
            {pincodeLookup.loading && (
              <span className="sapw2__hint" style={{ display: 'block', marginTop: 4 }}>Looking up…</span>
            )}
            {pincodeLookup.hit && !pincodeLookup.loading && (
              <span className="sapw2__hint" style={{ display: 'block', marginTop: 4, color: 'var(--status-success)' }}>
                City & state pre-filled — edit if needed.
              </span>
            )}
          </div>
        </div>
        <div className="sapw2__form-group">
          <label className="sapw2__form-label">City *</label>
          <input className="sapw2__form-input" placeholder="Mumbai" value={form.city} onChange={e => setField('city', e.target.value)} />
        </div>
        <div className="sapw2__form-group">
          <label className="sapw2__form-label">State *</label>
          <select
            className="sapw2__form-select"
            value={form.state}
            onChange={(e) => setField('state', e.target.value)}
          >
            <option value="">Select state…</option>
            {INDIAN_STATES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>
    </>
  )

  const renderPhotos = () => (
    <>
      <p className="sapw2__hint" style={{ marginBottom: 'var(--space-3)' }}>
        Upload up to {MAX_IMAGES} images (JPG, PNG, or WebP — max 5 MB each).
        The first image is used as the cover on listings.
      </p>

      {imageError && (
        <div className="sapw2__form-error">
          <span className="material-symbols-outlined">error</span>
          <span>{imageError}</span>
        </div>
      )}

      <div className="sapw2__img-grid">
        {(form.images || []).map((url, idx) => (
          <div key={url} className="sapw2__img-tile">
            <img src={url} alt={`Property ${idx + 1}`} />
            {idx === 0 && <span className="sapw2__img-cover-badge">Cover</span>}
            <button
              type="button"
              className="sapw2__img-remove"
              onClick={() => removeImage(url)}
              aria-label="Remove image"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        ))}

        {(form.images || []).length < MAX_IMAGES && (
          <label className={`sapw2__img-drop ${uploadingImages ? 'sapw2__img-drop--busy' : ''}`}>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              hidden
              disabled={uploadingImages}
              onChange={(e) => { handleImageFiles(e.target.files); e.target.value = '' }}
            />
            {uploadingImages ? (
              <>
                <span className="material-symbols-outlined sapw2__spin">progress_activity</span>
                <span>Uploading…</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined">add_photo_alternate</span>
                <span>Add photos</span>
                <span className="sapw2__hint">
                  {(form.images || []).length} / {MAX_IMAGES}
                </span>
              </>
            )}
          </label>
        )}
      </div>
    </>
  )

  const renderDetails = () => (
    <>
      <div className="sapw2__form-row">
        <div className="sapw2__form-group">
          <label className="sapw2__form-label">Type *</label>
          <select className="sapw2__form-select" value={form.type} onChange={e => setField('type', e.target.value)}>
            {TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div className="sapw2__form-group">
          <label className="sapw2__form-label">BHK *</label>
          <select className="sapw2__form-select" value={form.bhk} onChange={e => setField('bhk', e.target.value)}>
            {BHK_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
      </div>
      <div className="sapw2__form-row sapw2__form-row--3">
        <div className="sapw2__form-group">
          <label className="sapw2__form-label">Area (sqft)</label>
          <input className="sapw2__form-input" type="number" placeholder="1200" value={form.sqft} onChange={e => setField('sqft', e.target.value)} />
        </div>
        <div className="sapw2__form-group">
          <label className="sapw2__form-label">Floor</label>
          <input className="sapw2__form-input" type="number" placeholder="4" value={form.floor} onChange={e => setField('floor', e.target.value)} />
        </div>
        <div className="sapw2__form-group">
          <label className="sapw2__form-label">Total Floors</label>
          <input className="sapw2__form-input" type="number" placeholder="12" value={form.total_floors} onChange={e => setField('total_floors', e.target.value)} />
        </div>
      </div>
      <div className="sapw2__form-row">
        <div className="sapw2__form-group">
          <label className="sapw2__form-label">Furnishing *</label>
          <select className="sapw2__form-select" value={form.furnishing} onChange={e => setField('furnishing', e.target.value)}>
            {FURNISHING_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div className="sapw2__form-group">
          <label className="sapw2__form-label">Facing</label>
          <input className="sapw2__form-input" placeholder="East, North, etc." value={form.facing} onChange={e => setField('facing', e.target.value)} />
        </div>
      </div>
      <p className="sapw2__hint">Area, floors & rent can stay empty in a draft — they're required only to publish.</p>
    </>
  )

  const renderPricing = () => (
    <>
      <div className="sapw2__form-row sapw2__form-row--3">
        <div className="sapw2__form-group">
          <label className="sapw2__form-label">Monthly Rent (₹)</label>
          <input className="sapw2__form-input" type="number" placeholder="35000" value={form.rent} onChange={e => setField('rent', e.target.value)} />
        </div>
        <div className="sapw2__form-group">
          <label className="sapw2__form-label">Security Deposit (₹)</label>
          <input className="sapw2__form-input" type="number" placeholder="105000" value={form.security_deposit} onChange={e => setField('security_deposit', e.target.value)} />
        </div>
        <div className="sapw2__form-group">
          <label className="sapw2__form-label">Maintenance (₹)</label>
          <input className="sapw2__form-input" type="number" placeholder="3000" value={form.maintenance_charges} onChange={e => setField('maintenance_charges', e.target.value)} />
        </div>
      </div>
      <div className="sapw2__form-group">
        <label className="sapw2__form-label">Description</label>
        <textarea className="sapw2__form-input sapw2__form-textarea" placeholder="Property description..." rows={3} value={form.description} onChange={e => setField('description', e.target.value)} />
      </div>
      <label className="sapw2__form-check">
        <input type="checkbox" checked={form.premium} onChange={e => setField('premium', e.target.checked)} />
        <span>Mark as Premium Listing</span>
      </label>
    </>
  )

  const renderAssign = (kind) => {
    const isOwner = kind === 'owner'
    const skip = isOwner ? skipOwner : skipManagers
    const setSkip = isOwner
      ? (v) => { setSkipOwner(v); if (v) setSelectedOwner(null) }
      : (v) => { setSkipManagers(v); if (v) setSelectedManagers([]) }
    const searchVal = isOwner ? ownerSearch : managerSearch
    const setSearchVal = isOwner ? setOwnerSearch : setManagerSearch
    const list = isOwner ? filteredOwners : filteredManagers
    const label = isOwner ? 'owner' : 'managers'

    return (
      <>
        <label className="sapw2__assign-skip">
          <input type="checkbox" checked={skip} onChange={e => setSkip(e.target.checked)} />
          <span>Skip — assign {label} later</span>
        </label>
        {!skip && (
          <>
            <div className="sapw2__assign-search">
              <span className="material-symbols-outlined">search</span>
              <input placeholder={`Search ${label} by name or email...`} value={searchVal} onChange={e => setSearchVal(e.target.value)} />
            </div>
            {isOwner && selectedOwner && (
              <div className="sapw2__selected-tags">
                <span className="sapw2__selected-tag">
                  {selectedOwner.name}
                  <button onClick={() => setSelectedOwner(null)}><span className="material-symbols-outlined">close</span></button>
                </span>
              </div>
            )}
            {!isOwner && selectedManagers.length > 0 && (
              <div className="sapw2__selected-tags">
                {selectedManagers.map(m => (
                  <span key={m.id} className="sapw2__selected-tag">
                    {m.name}
                    <button onClick={() => toggleManager(m)}><span className="material-symbols-outlined">close</span></button>
                  </span>
                ))}
              </div>
            )}
            <div className="sapw2__assign-list">
              {list.length === 0 && (
                <div className="sapw2__empty"><span className="material-symbols-outlined">person_off</span>No {label} found.</div>
              )}
              {list.map(u => {
                const isSelected = isOwner ? selectedOwner?.id === u.id : selectedManagers.some(x => x.id === u.id)
                const onClick = isOwner ? () => setSelectedOwner(isSelected ? null : u) : () => toggleManager(u)
                return (
                  <button key={u.id} type="button" className={`sapw2__assign-item ${isSelected ? 'sapw2__assign-item--selected' : ''}`} onClick={onClick}>
                    <div className="sapw2__assign-item-avatar">{getInitials(u.name)}</div>
                    <div className="sapw2__assign-item-info">
                      <p className="sapw2__assign-item-name">{u.name}</p>
                      <p className="sapw2__assign-item-email">{u.email}</p>
                    </div>
                    <div className={`sapw2__assign-check ${isSelected ? 'sapw2__assign-check--active' : ''}`}>
                      {isSelected && <span className="material-symbols-outlined">check</span>}
                    </div>
                  </button>
                )
              })}
            </div>
          </>
        )}
      </>
    )
  }

  const renderReview = () => {
    const furnLabel = FURNISHING_OPTIONS.find(f => f.value === form.furnishing)?.label || form.furnishing
    const typeLabel = TYPE_OPTIONS.find(t => t.value === form.type)?.label || form.type
    const publishBlock = validateForPublish()
    return (
      <>
        {publishBlock ? (
          <div className="sapw2__review-warn">
            <span className="material-symbols-outlined">info</span>
            <span>{publishBlock} You can still save it as a draft.</span>
          </div>
        ) : (
          <div className="sapw2__review-ok">
            <span className="material-symbols-outlined">check_circle</span>
            <span>All set — this listing is ready to publish.</span>
          </div>
        )}

        <div className="sapw2__review-card">
          <p className="sapw2__review-card-title">Basic Info</p>
          <div className="sapw2__review-grid">
            <div className="sapw2__review-field"><span className="sapw2__review-label">Name</span><span className="sapw2__review-value">{form.name || '—'}</span></div>
            <div className="sapw2__review-field"><span className="sapw2__review-label">Unit</span><span className="sapw2__review-value">{form.unit || '—'}</span></div>
            <div className="sapw2__review-field"><span className="sapw2__review-label">Address</span><span className="sapw2__review-value">{form.address || '—'}</span></div>
            <div className="sapw2__review-field"><span className="sapw2__review-label">City</span><span className="sapw2__review-value">{form.city || '—'}</span></div>
            <div className="sapw2__review-field"><span className="sapw2__review-label">State</span><span className="sapw2__review-value">{form.state || '—'}</span></div>
            <div className="sapw2__review-field"><span className="sapw2__review-label">Pincode</span><span className="sapw2__review-value">{form.pincode || '—'}</span></div>
          </div>
        </div>

        <div className="sapw2__review-card">
          <p className="sapw2__review-card-title">Details & Pricing</p>
          <div className="sapw2__review-grid">
            <div className="sapw2__review-field"><span className="sapw2__review-label">Type</span><span className="sapw2__review-value">{typeLabel}</span></div>
            <div className="sapw2__review-field"><span className="sapw2__review-label">BHK</span><span className="sapw2__review-value">{form.bhk}</span></div>
            <div className="sapw2__review-field"><span className="sapw2__review-label">Area</span><span className="sapw2__review-value">{form.sqft ? `${form.sqft} sqft` : '—'}</span></div>
            <div className="sapw2__review-field"><span className="sapw2__review-label">Furnishing</span><span className="sapw2__review-value">{furnLabel}</span></div>
            <div className="sapw2__review-field"><span className="sapw2__review-label">Floor</span><span className="sapw2__review-value">{form.floor || '—'} / {form.total_floors || '—'}</span></div>
            <div className="sapw2__review-field"><span className="sapw2__review-label">Rent</span><span className="sapw2__review-value">{form.rent ? `₹${Number(form.rent).toLocaleString('en-IN')}/mo` : '—'}</span></div>
          </div>
        </div>

        <div className="sapw2__review-card">
          <p className="sapw2__review-card-title">Photos</p>
          {(form.images || []).length === 0 ? (
            <p className="sapw2__review-value sapw2__review-value--muted">No images uploaded</p>
          ) : (
            <div className="sapw2__img-grid">
              {(form.images || []).slice(0, 8).map((url, idx) => (
                <div key={url} className="sapw2__img-tile sapw2__img-tile--review">
                  <img src={url} alt={`Property ${idx + 1}`} />
                  {idx === 0 && <span className="sapw2__img-cover-badge">Cover</span>}
                </div>
              ))}
              {(form.images || []).length > 8 && (
                <div className="sapw2__img-tile sapw2__img-tile--more">
                  +{(form.images || []).length - 8}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="sapw2__review-card">
          <p className="sapw2__review-card-title">Assignments</p>
          <div className="sapw2__review-grid">
            <div className="sapw2__review-field">
              <span className="sapw2__review-label">Owner</span>
              <span className={`sapw2__review-value ${!selectedOwner || skipOwner ? 'sapw2__review-value--muted' : ''}`}>
                {skipOwner ? 'Assign later' : selectedOwner ? selectedOwner.name : 'Not assigned'}
              </span>
            </div>
            <div className="sapw2__review-field">
              <span className="sapw2__review-label">Managers</span>
              <span className={`sapw2__review-value ${selectedManagers.length === 0 || skipManagers ? 'sapw2__review-value--muted' : ''}`}>
                {skipManagers ? 'Assign later' : selectedManagers.length > 0 ? selectedManagers.map(m => m.name).join(', ') : 'Not assigned'}
              </span>
            </div>
          </div>
        </div>
      </>
    )
  }

  const renderStep = () => {
    switch (step) {
      case 0: return renderBasicInfo()
      case 1: return renderDetails()
      case 2: return renderPricing()
      case 3: return renderPhotos()
      case 4: return renderAssign('owner')
      case 5: return renderAssign('managers')
      case 6: return renderReview()
      default: return null
    }
  }

  const isLastStep = step === STEPS.length - 1
  const busy = saving || publishing

  if (loading) {
    return (
      <div className="sapw2">
        <div className="sapw2__loading">
          <span className="material-symbols-outlined sapw2__spin">progress_activity</span>
          Loading property…
        </div>
      </div>
    )
  }

  return (
    <div className="sapw2">
      {/* Header */}
      <header className="sapw2__header">
        <button className="sapw2__back-btn" onClick={() => navigate('/sa/properties')} aria-label="Back to properties">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div className="sapw2__header-text">
          <h1 className="sapw2__title">{isEdit ? 'Edit Property' : 'New Property'}</h1>
          <p className="sapw2__subtitle">
            {isEdit ? `Editing · ${form.name || 'Untitled'}` : 'Create a listing — save as draft anytime'}
          </p>
        </div>
        <span className={`sapw2__status-chip sapw2__status-chip--${status}`}>
          {status === 'active' ? 'Published' : status === 'archived' ? 'Archived' : 'Draft'}
        </span>
      </header>

      <div className="sapw2__shell">
        {/* Left nav — vertical steps */}
        <nav className="sapw2__nav" aria-label="Wizard steps">
          {STEPS.map((s, i) => (
            <button
              key={s.key}
              type="button"
              className={`sapw2__nav-item ${i === step ? 'sapw2__nav-item--active' : ''} ${i < step ? 'sapw2__nav-item--done' : ''}`}
              onClick={() => goToStep(i)}
            >
              <span className="sapw2__nav-icon">
                {i < step
                  ? <span className="material-symbols-outlined">check</span>
                  : <span className="material-symbols-outlined">{s.icon}</span>}
              </span>
              <span className="sapw2__nav-text">
                <span className="sapw2__nav-label">{s.label}</span>
                <span className="sapw2__nav-desc">{s.desc}</span>
              </span>
            </button>
          ))}
        </nav>

        {/* Right — step content */}
        <div className="sapw2__content">
          <div className="sapw2__content-head">
            <h2 className="sapw2__step-title">{STEPS[step].label}</h2>
            <span className="sapw2__step-count">Step {step + 1} of {STEPS.length}</span>
          </div>

          {formError && (
            <div className="sapw2__form-error">
              <span className="material-symbols-outlined">error</span>
              <span>{formError}</span>
            </div>
          )}

          <div className="sapw2__body">{renderStep()}</div>

          {/* Footer actions */}
          <div className="sapw2__footer">
            <div className="sapw2__footer-left">
              {step > 0 && (
                <button className="sapw2__btn sapw2__btn--ghost" onClick={goBack} disabled={busy}>Back</button>
              )}
            </div>
            <div className="sapw2__footer-right">
              <button className="sapw2__btn sapw2__btn--secondary" onClick={() => persist('draft')} disabled={busy}>
                {saving ? 'Saving…' : 'Save as Draft'}
              </button>
              {isLastStep ? (
                <button className="sapw2__btn sapw2__btn--success" onClick={() => persist('active')} disabled={busy}>
                  {publishing ? 'Publishing…' : (isEdit && status === 'active' ? 'Save & Keep Live' : 'Publish')}
                </button>
              ) : (
                <button className="sapw2__btn sapw2__btn--primary" onClick={goNext} disabled={busy}>Next</button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
