import api from '../api/axios'

export const getDossiers = async () => {
  const { data } = await api.get('/dossiers/')
  return data.results ?? data
}

export const getSoumissions = async () => {
  const { data } = await api.get('/soumissions/')
  return data.results ?? data
}

export const getNotifications = async () => {
  const { data } = await api.get('/notifications/')
  return data.results ?? data
}

export const getPermissions = async () => {
  const { data } = await api.get('/permissions/')
  return data.results ?? data
}
