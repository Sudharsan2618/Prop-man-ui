import { get, post, buildApiCacheKey, fetchWithCache, invalidateApiCache } from './client'

export async function fetchOnboardingWorkflows(params = {}) {
  const cacheKey = buildApiCacheKey('onboarding:workflows', params)
  return fetchWithCache(cacheKey, async () => {
    const res = await get('/onboarding-workflows', { params })
    return res?.data || []
  }, { ttlMs: 30_000 })
}

export async function fetchOnboardingWorkflow(workflowId) {
  const res = await get(`/onboarding-workflows/${workflowId}`)
  return res?.data || res
}

export async function submitPoliceVerification(workflowId, documentUrl) {
  const res = await post(`/onboarding-workflows/${workflowId}/police-verification/submit`, {
    body: { document_url: documentUrl },
  })
  invalidateApiCache(['onboarding:workflows'])
  return res
}

export async function reviewPoliceVerification(workflowId, { approve, rejection_reason }) {
  const res = await post(`/onboarding-workflows/${workflowId}/police-verification/review`, {
    body: { approve, rejection_reason },
  })
  invalidateApiCache(['onboarding:workflows'])
  return res
}

export async function submitOriginalAgreement(workflowId, documentUrl) {
  const res = await post(`/onboarding-workflows/${workflowId}/original-agreement/submit`, {
    body: { document_url: documentUrl },
  })
  invalidateApiCache(['onboarding:workflows'])
  return res
}

export async function reviewOriginalAgreement(workflowId, { approve, rejection_reason }) {
  const res = await post(`/onboarding-workflows/${workflowId}/original-agreement/review`, {
    body: { approve, rejection_reason },
  })
  invalidateApiCache(['onboarding:workflows'])
  return res
}

export async function cancelOnboardingWorkflow(workflowId, { reason }) {
  if (!reason) throw new Error('reason is required to cancel onboarding')
  const res = await post(`/onboarding-workflows/${workflowId}/cancel`, {
    body: { reason },
  })
  invalidateApiCache(['onboarding:workflows'])
  return res?.data || res
}
