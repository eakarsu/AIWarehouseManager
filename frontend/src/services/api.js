import axios from 'axios';

const API_URL = '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ============================================================
// Auth
// ============================================================
export const register = (email, password, name) => api.post('/auth/register', { email, password, name });
export const login = (email, password) => api.post('/auth/login', { email, password });
export const getMe = () => api.get('/auth/me');
export const updateProfile = (data) => api.put('/auth/me', data);
export const changePassword = (currentPassword, newPassword) =>
  api.put('/auth/password', { currentPassword, newPassword });
export const forgotPassword = (email) => api.post('/auth/forgot-password', { email });
export const resetPassword = (token, password) => api.post('/auth/reset-password', { token, password });
export const demoCredentials = () => api.get('/auth/demo-credentials');
export const logout = () => api.post('/auth/logout');
export const verifyEmail = (token) => api.post('/auth/verify-email', { token });
export const resendVerification = () => api.post('/auth/resend-verification');
export const requestPasswordReset = (email) => api.post('/auth/password-reset/request', { email });
export const confirmPasswordReset = (token, newPassword) =>
  api.post('/auth/password-reset/confirm', { token, newPassword });

// ============================================================
// Floor Plans CRUD + bulk operations (from AIFloorPlanAnalyzer)
// ============================================================
export const getFloorPlans = (params) => api.get('/floor-plans', { params });
export const getFloorPlan = (id) => api.get(`/floor-plans/${id}`);
export const createFloorPlan = (data) => api.post('/floor-plans', data);
export const updateFloorPlan = (id, data) => api.put(`/floor-plans/${id}`, data);
export const deleteFloorPlan = (id) => api.delete(`/floor-plans/${id}`);

// Bulk Operations
export const bulkDelete = (resource, ids) => api.post('/bulk/delete', { resource, ids });
export const bulkUpdate = (resource, ids, updates) => api.post('/bulk/update', { resource, ids, updates });

// ============================================================
// Floor Plan Rooms CRUD (from AIFloorPlanAnalyzer)
// ============================================================
export const getRooms = (params) => api.get('/rooms', { params });
export const getRoom = (id) => api.get(`/rooms/${id}`);
export const createRoom = (data) => api.post('/rooms', data);
export const updateRoom = (id, data) => api.put(`/rooms/${id}`, data);
export const deleteRoom = (id) => api.delete(`/rooms/${id}`);

// ============================================================
// Renovation Suggestions CRUD (from AIFloorPlanAnalyzer)
// ============================================================
export const getSuggestions = (params) => api.get('/suggestions', { params });
export const getSuggestion = (id) => api.get(`/suggestions/${id}`);
export const createSuggestion = (data) => api.post('/suggestions', data);
export const updateSuggestion = (id, data) => api.put(`/suggestions/${id}`, data);
export const deleteSuggestion = (id) => api.delete(`/suggestions/${id}`);

// ============================================================
// Project Estimates CRUD (from AIFloorPlanAnalyzer)
// ============================================================
export const getEstimates = (params) => api.get('/estimates', { params });
export const getEstimate = (id) => api.get(`/estimates/${id}`);
export const createEstimate = (data) => api.post('/estimates', data);
export const updateEstimate = (id, data) => api.put(`/estimates/${id}`, data);
export const deleteEstimate = (id) => api.delete(`/estimates/${id}`);

// ============================================================
// Designs CRUD (from AiInteriorDesign)
// ============================================================
export const getDesigns = (params) => api.get('/designs', { params });
export const getDesign = (id) => api.get(`/designs/${id}`);
export const createDesign = (data) => api.post('/designs', data);
export const updateDesign = (id, data) => api.put(`/designs/${id}`, data);
export const deleteDesign = (id) => api.delete(`/designs/${id}`);

// ============================================================
// Design Rooms CRUD (from AiInteriorDesign)
// ============================================================
export const getDesignRooms = (designId) => api.get(`/rooms/design/${designId}`);
export const getDesignRoom = (id) => api.get(`/rooms/${id}`);
export const createDesignRoom = (data) => api.post('/rooms', data);
export const updateDesignRoom = (id, data) => api.put(`/rooms/${id}`, data);
export const deleteDesignRoom = (id) => api.delete(`/rooms/${id}`);

// ============================================================
// Furniture CRUD + categories (from AiInteriorDesign)
// ============================================================
export const getFurniture = (params) => api.get('/furniture', { params });
export const getFurnitureItem = (id) => api.get(`/furniture/${id}`);
export const createFurniture = (data) => api.post('/furniture', data);
export const updateFurniture = (id, data) => api.put(`/furniture/${id}`, data);
export const deleteFurniture = (id) => api.delete(`/furniture/${id}`);
export const getFurnitureCategories = () => api.get('/furniture/meta/categories');

// ============================================================
// Palettes CRUD (from AiInteriorDesign)
// ============================================================
export const getPalettes = (params) => api.get('/palettes', { params });
export const getPalette = (id) => api.get(`/palettes/${id}`);
export const createPalette = (data) => api.post('/palettes', data);
export const updatePalette = (id, data) => api.put(`/palettes/${id}`, data);
export const deletePalette = (id) => api.delete(`/palettes/${id}`);

// ============================================================
// Styles CRUD (from AiInteriorDesign)
// ============================================================
export const getStyles = (params) => api.get('/styles', { params });
export const getStyle = (id) => api.get(`/styles/${id}`);
export const createStyle = (data) => api.post('/styles', data);
export const updateStyle = (id, data) => api.put(`/styles/${id}`, data);
export const deleteStyle = (id) => api.delete(`/styles/${id}`);

// ============================================================
// Materials CRUD + categories (combined from both projects)
// ============================================================
export const getMaterials = (params) => api.get('/materials', { params });
export const getMaterial = (id) => api.get(`/materials/${id}`);
export const createMaterial = (data) => api.post('/materials', data);
export const updateMaterial = (id, data) => api.put(`/materials/${id}`, data);
export const deleteMaterial = (id) => api.delete(`/materials/${id}`);
export const getMaterialCategories = () => api.get('/materials/meta/categories');

// ============================================================
// Contractors CRUD (from AIFloorPlanAnalyzer)
// ============================================================
export const getContractors = (params) => api.get('/contractors', { params });
export const getContractor = (id) => api.get(`/contractors/${id}`);
export const createContractor = (data) => api.post('/contractors', data);
export const updateContractor = (id, data) => api.put(`/contractors/${id}`, data);
export const deleteContractor = (id) => api.delete(`/contractors/${id}`);

// ============================================================
// Templates CRUD (from AIFloorPlanAnalyzer)
// ============================================================
export const getTemplates = (params) => api.get('/templates', { params });
export const getTemplate = (id) => api.get(`/templates/${id}`);
export const createTemplate = (data) => api.post('/templates', data);
export const updateTemplate = (id, data) => api.put(`/templates/${id}`, data);
export const deleteTemplate = (id) => api.delete(`/templates/${id}`);

// ============================================================
// Inspirations CRUD + like + meta (from AiInteriorDesign)
// ============================================================
export const getInspirations = (params) => api.get('/inspirations', { params });
export const getInspiration = (id) => api.get(`/inspirations/${id}`);
export const createInspiration = (data) => api.post('/inspirations', data);
export const updateInspiration = (id, data) => api.put(`/inspirations/${id}`, data);
export const deleteInspiration = (id) => api.delete(`/inspirations/${id}`);
export const likeInspiration = (id) => api.post(`/inspirations/${id}/like`);
export const getInspirationStyles = () => api.get('/inspirations/meta/styles');
export const getInspirationRoomTypes = () => api.get('/inspirations/meta/room-types');

// ============================================================
// AI Floor Plan Analysis (from AIFloorPlanAnalyzer)
// ============================================================
export const analyzeFloorPlan = (data) => api.post('/ai/analyze', data);
export const generateSuggestions = (roomId) => api.post('/ai/suggestions', { room_id: roomId });
export const estimateCosts = (floorPlanId) => api.post('/ai/estimate', { floor_plan_id: floorPlanId });
export const recommendMaterials = (roomId, style) => api.post('/ai/materials', { room_id: roomId, style });
export const optimizeLayout = (floorPlanId) => api.post('/ai/optimize', { floor_plan_id: floorPlanId });
export const detectRooms = (data) => api.post('/ai/detect-rooms', data);
export const getHomeStagingAdvice = (data) => api.post('/ai/home-staging', data);
export const placeFurniture = (data) => api.post('/ai/furniture-placement', data);
export const predictMaintenance = (data) => api.post('/ai/maintenance-prediction', data);
export const auditEnergy = (data) => api.post('/ai/energy-audit', data);
export const inspectHome = (data) => api.post('/ai/home-inspection', data);

// ============================================================
// AI Design (from AiInteriorDesign)
// ============================================================
export const generateDesign = (data) => api.post('/ai/generate-design', data);
export const generatePalette = (data) => api.post('/ai/generate-palette', data);
export const recommendFurniture = (data) => api.post('/ai/recommend-furniture', data);
export const analyzeRoom = (data) => api.post('/ai/analyze-room', data);
export const generateStyleGuide = (data) => api.post('/ai/generate-style-guide', data);
export const matchStyle = (data) => api.post('/ai/match-style', data);
export const planBudget = (data) => api.post('/ai/plan-budget', data);
export const visualizeTransformation = (data) => api.post('/ai/visualize-transformation', data);
export const generateImage = (data) => api.post('/ai/generate-image', data);

// ============================================================
// AI History (combined from both projects)
// ============================================================
export const getAIHistory = (params) => api.get('/ai/history', { params });
export const getAIHistoryItem = (id) => api.get(`/ai/history/${id}`);

// ============================================================
// AI Result Endpoints - Full Analyses
// ============================================================
export const getFullAnalyses = () => api.get('/full-analyses');
export const getFullAnalysis = (id) => api.get(`/full-analyses/${id}`);
export const deleteFullAnalysis = (id) => api.delete(`/full-analyses/${id}`);

// AI Result Endpoints - Room Detections
export const getRoomDetections = () => api.get('/room-detections');
export const getRoomDetection = (id) => api.get(`/room-detections/${id}`);
export const deleteRoomDetection = (id) => api.delete(`/room-detections/${id}`);

// AI Result Endpoints - Home Staging
export const getHomeStagingList = () => api.get('/home-staging');
export const getHomeStaging = (id) => api.get(`/home-staging/${id}`);
export const deleteHomeStaging = (id) => api.delete(`/home-staging/${id}`);

// AI Result Endpoints - Furniture Placements
export const getFurniturePlacements = () => api.get('/furniture-placements');
export const getFurniturePlacement = (id) => api.get(`/furniture-placements/${id}`);
export const deleteFurniturePlacement = (id) => api.delete(`/furniture-placements/${id}`);

// AI Result Endpoints - Maintenance Predictions
export const getMaintenancePredictions = () => api.get('/maintenance-predictions');
export const getMaintenancePrediction = (id) => api.get(`/maintenance-predictions/${id}`);
export const deleteMaintenancePrediction = (id) => api.delete(`/maintenance-predictions/${id}`);

// AI Result Endpoints - Energy Audits
export const getEnergyAudits = () => api.get('/energy-audits');
export const getEnergyAudit = (id) => api.get(`/energy-audits/${id}`);
export const deleteEnergyAudit = (id) => api.delete(`/energy-audits/${id}`);

// AI Result Endpoints - Home Inspections
export const getHomeInspections = () => api.get('/home-inspections');
export const getHomeInspection = (id) => api.get(`/home-inspections/${id}`);
export const deleteHomeInspection = (id) => api.delete(`/home-inspections/${id}`);

// AI Result Endpoints - Layout Optimizations
export const getLayoutOptimizations = () => api.get('/layout-optimizations');
export const getLayoutOptimization = (id) => api.get(`/layout-optimizations/${id}`);
export const deleteLayoutOptimization = (id) => api.delete(`/layout-optimizations/${id}`);

// AI Result Endpoints - Room Dimensions
export const getRoomDimensions = () => api.get('/room-dimensions');
export const getRoomDimension = (id) => api.get(`/room-dimensions/${id}`);
export const deleteRoomDimension = (id) => api.delete(`/room-dimensions/${id}`);

// AI Result Endpoints - AI Suggestions
export const getAISuggestions = () => api.get('/ai-suggestions');
export const getAISuggestion = (id) => api.get(`/ai-suggestions/${id}`);
export const deleteAISuggestion = (id) => api.delete(`/ai-suggestions/${id}`);

// AI Result Endpoints - AI Materials
export const getAIMaterials = () => api.get('/ai-materials');
export const getAIMaterial = (id) => api.get(`/ai-materials/${id}`);
export const deleteAIMaterial = (id) => api.delete(`/ai-materials/${id}`);

// ============================================================
// AR Sessions CRUD + snapshot + arReadyFurniture (from AiInteriorDesign)
// ============================================================
export const getARSessions = (params) => api.get('/ar', { params });
export const getARSession = (id) => api.get(`/ar/${id}`);
export const createARSession = (data) => api.post('/ar', data);
export const updateARSession = (id, data) => api.put(`/ar/${id}`, data);
export const deleteARSession = (id) => api.delete(`/ar/${id}`);
export const createARSnapshot = (id, data) => api.post(`/ar/${id}/snapshot`, data);
export const getARReadyFurniture = () => api.get('/ar/furniture/ar-ready');

// ============================================================
// Shopping Lists CRUD + fromDesign + items (from AiInteriorDesign)
// ============================================================
export const getShoppingLists = (params) => api.get('/shopping', { params });
export const getShoppingList = (id) => api.get(`/shopping/${id}`);
export const createShoppingList = (data) => api.post('/shopping', data);
export const updateShoppingList = (id, data) => api.patch(`/shopping/${id}`, data);
export const deleteShoppingList = (id) => api.delete(`/shopping/${id}`);
export const createShoppingListFromDesign = (designId) => api.post(`/shopping/from-design/${designId}`);
export const addShoppingListItem = (listId, data) => api.post(`/shopping/${listId}/items`, data);
export const updateShoppingListItem = (itemId, data) => api.patch(`/shopping/items/${itemId}`, data);
export const deleteShoppingListItem = (itemId) => api.delete(`/shopping/items/${itemId}`);

// ============================================================
// Subscriptions (from AiInteriorDesign)
// ============================================================
export const getSubscriptionPlans = () => api.get('/subscriptions/plans');
export const getCurrentSubscription = () => api.get('/subscriptions/current');
export const subscribe = (planId) => api.post('/subscriptions/subscribe', { plan: planId });
export const cancelSubscription = () => api.post('/subscriptions/cancel');
export const useCredit = (data) => api.post('/subscriptions/use-credit', data);
export const getSubscriptionHistory = () => api.get('/subscriptions/history');

// ============================================================
// Export (from AiInteriorDesign)
// ============================================================
export const exportDesignPdf = (id) => api.get(`/export/design/${id}/pdf`, { responseType: 'blob' });
export const exportShoppingListPdf = (id) => api.get(`/export/shopping/${id}/pdf`, { responseType: 'blob' });

// ============================================================
// Admin (from AIFloorPlanAnalyzer)
// ============================================================
export const getAdminUsers = (params) => api.get('/admin/users', { params });
export const updateUserRole = (id, role) => api.put(`/admin/users/${id}/role`, { role });

// ============================================================
// Dashboard
// ============================================================
export const getDashboardStats = () => api.get('/dashboard/stats');

export default api;
