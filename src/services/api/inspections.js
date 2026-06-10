import { get } from './client'

export async function fetchInspections() {
  const res = await get('/inspections')
  return res.data || []
}

export async function fetchInspectionById(id) {
  const res = await get(`/inspections/${id}`)
  return res.data
}

export async function fetchInspectionStats() {
  try {
    const res = await get('/inspections/stats')
    return res.data
  } catch { return { total: 0, completed: 0, avg_score: 0 } }
}
