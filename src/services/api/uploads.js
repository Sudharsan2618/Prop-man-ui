import { BASE, getTokens } from './client'

async function uploadTo(endpoint, file, folder) {
  const formData = new FormData()
  formData.append('file', file)

  const { access_token } = getTokens()
  const headers = {}
  if (access_token) headers['Authorization'] = `Bearer ${access_token}`

  const res = await fetch(`${BASE}${endpoint}?folder=${encodeURIComponent(folder)}`, {
    method: 'POST',
    headers,
    body: formData,
  })

  if (!res.ok) {
    const json = await res.json().catch(() => ({}))
    throw new Error(json.detail || json.message || `Upload failed (${res.status})`)
  }
  const json = await res.json()
  return json.data?.url || json.url
}

export const uploadImage = (file, folder = 'images') => uploadTo('/uploads/image', file, folder)
export const uploadDocument = (file, folder = 'documents') => uploadTo('/uploads/document', file, folder)
