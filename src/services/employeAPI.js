import api from '../api/axios'

export const employeAPI = {
  getStats: () => api.get('/employe/stats/'),

  getDossiers: () => api.get('/dossiers/'),
  getPermissions: () => api.get('/permissions/'),
  getDossierDetail: (id) => api.get(`/dossiers/${id}/`),

  uploadFichier: (dossierId, file) => {
    const fd = new FormData()
    fd.append('dossier', dossierId)
    fd.append('fichier', file)
    fd.append('nom', file.name)
    return api.post('/fichiers/', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
  deleteFichier: (id) => api.delete(`/fichiers/${id}/`),

  getSoumissions: () => api.get('/soumissions/'),
  createSoumission: (dossierId, commentaire) =>
    api.post('/soumissions/', { dossier_id: dossierId, commentaire }),

  getNotifications: () => api.get('/notifications/'),
  getUnreadCount:   () => api.get('/notifications/non-lues-count/'),
  markAsRead:       (id) => api.post(`/notifications/${id}/marquer-lu/`),
  markAllAsRead:    () => api.post('/notifications/marquer-tout-lu/'),
}

export const adminAPI = {
  getSoumissions:      () => api.get('/soumissions/'),
  approuver:           (id) => api.post(`/soumissions/${id}/approuver/`),
  rejeter:             (id, raison) => api.post(`/soumissions/${id}/rejeter/`, { raison }),
  getDossierDetail:    (id) => api.get(`/dossiers/${id}/`),
  getSoumissionFichiers: (id) => api.get(`/soumissions/${id}/fichiers/`),
}
