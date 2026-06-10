import { get, post, invalidateApiCache } from './client'

export async function verifyDeposit(agreementId, paymentData) {
  const res = await post(`/agreements/${agreementId}/verify-deposit`, { body: paymentData })
  return res.data
}

export async function signAgreement(agreementId, signature) {
  return post(`/agreements/${agreementId}/sign`, { body: { signature } })
}

export async function fetchAgreementById(agreementId) {
  const res = await get(`/agreements/${agreementId}`)
  return res.data
}

export async function fetchAgreements(params = {}) {
  const res = await get('/agreements', { params })
  return res.data || []
}

export async function adminConfirmAdvance(agreementId, notes) {
  const res = await post(`/agreements/${agreementId}/confirm-advance`, { body: { notes } })
  invalidateApiCache([
    'onboarding:workflows',
    'properties:search',
    'owner:properties:me',
    'tenant:properties:me',
    'owner:dashboard',
  ])
  return res
}
