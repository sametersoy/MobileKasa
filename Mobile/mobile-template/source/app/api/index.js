const BASE_URL = 'https://gw-mobilkasa.sametersoy.com';

let _onUnauthorized = null;
export const setUnauthorizedHandler = (fn) => { _onUnauthorized = fn; };

const buildQuery = (params) => {
  const qs = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join('&');
  return qs ? `?${qs}` : '';
};

const request = async (path, options = {}) => {
  const url = `${BASE_URL}${path}`;
  console.log('[API] request:', options.method ?? 'GET', url);
  const { headers: optHeaders, ...restOptions } = options;
  let response;
  try {
    response = await fetch(url, {
      headers: { 'Content-Type': 'application/json', ...optHeaders },
      ...restOptions,
    });
  } catch (networkErr) {
    console.warn('[API] network error:', networkErr?.message);
    throw new Error('Sunucuya ulaşılamıyor. İnternet bağlantınızı kontrol edin.');
  }

  console.log('[API] response status:', response.status);

  if (response.status === 401) {
    if (_onUnauthorized) _onUnauthorized();
    throw new Error('Oturum süreniz doldu. Lütfen tekrar giriş yapın.');
  }

  if (!response.ok) {
    let message = 'İstek başarısız';
    try {
      const body = await response.json();
      console.warn('[API] error body:', JSON.stringify(body));
      message = body?.message ?? body ?? message;
    } catch {}
    const error = new Error(typeof message === 'string' ? message : 'İstek başarısız');
    error.status = response.status;
    throw error;
  }

  // 204 No Content
  if (response.status === 204) return null;
  return response.json();
};

export const authApi = {
  login: (email, password) =>
    request('/api/auth/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  register: (fullName, email, password) =>
    request('/api/auth/auth/register', {
      method: 'POST',
      body: JSON.stringify({ fullName, email, password }),
    }),
};

// Auth servis çağrıları (sakin yönetimi)
export const residentApi = (token) => {
  const headers = { Authorization: `Bearer ${token}` };
  const get = (path) => request(`/api/auth${path}`, { headers });
  const post = (path, body) =>
    request(`/api/auth${path}`, { method: 'POST', headers, body: JSON.stringify(body) });
  const put = (path, body) =>
    request(`/api/auth${path}`, { method: 'PUT', headers, body: JSON.stringify(body) });
  const del = (path) =>
    request(`/api/auth${path}`, { method: 'DELETE', headers });

  return {
    list: (buildingId) => get(`/residents?buildingId=${buildingId}`),
    register: (body) => post('/auth/register-sakin', body),
    update: (id, body) => put(`/residents/${id}`, body),
    addUnit: (id, unitId) => post(`/residents/${id}/units`, { unitId }),
    removeUnit: (id, unitId) => del(`/residents/${id}/units/${unitId}`),
    deactivate: (id) => del(`/residents/${id}`),
    deleteAccount: () => del('/auth/account'),
  };
};

export const webApi = (token) => {
  const headers = { Authorization: `Bearer ${token}` };
  const get  = (path) => request(`/api/web${path}`, { headers });
  const post = (path, body) =>
    request(`/api/web${path}`, { method: 'POST', headers, body: JSON.stringify(body) });
  const put  = (path, body) =>
    request(`/api/web${path}`, { method: 'PUT', headers, body: JSON.stringify(body) });
  const del  = (path) =>
    request(`/api/web${path}`, { method: 'DELETE', headers });
  const patch = (path, body) =>
    request(`/api/web${path}`, {
      method: 'PATCH', headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

  return {
    // Binalar
    buildings:      () => get('/buildings'),
    addBuilding:    (body) => post('/buildings', body),
    updateBuilding: (id, body) => put(`/buildings/${id}`, body),
    deleteBuilding: (id) => del(`/buildings/${id}`),
    // Finans
    financial:        (bid) => get(`/buildings/${bid}/financial`),
    financialSummary: (bid) => get(`/buildings/${bid}/financial/summary`),
    addTransaction:   (bid, body) => post(`/buildings/${bid}/financial`, body),
    delTransaction:   (bid, id) => del(`/buildings/${bid}/financial/${id}`),
    // Bildirim gönder
    sendNotification: (bid, body) => post(`/buildings/${bid}/notifications`, body),
    // Sayaçlar
    meters:      (bid) => get(`/buildings/${bid}/meters`),
    addMeter:    (bid, body) => post(`/buildings/${bid}/meters`, body),
    delMeter:    (bid, id) => del(`/buildings/${bid}/meters/${id}`),
    readings:    (bid, mid) => get(`/buildings/${bid}/meters/${mid}/readings`),
    addReading:  (bid, mid, body) => post(`/buildings/${bid}/meters/${mid}/readings`, body),
    // İhaleler
    tenders:      (bid) => get(`/buildings/${bid}/tenders`),
    tenderDetail: (bid, id) => get(`/buildings/${bid}/tenders/${id}`),
    addTender:    (bid, body) => post(`/buildings/${bid}/tenders`, body),
    closeTender:  (bid, id) => patch(`/buildings/${bid}/tenders/${id}/close`),
    awardOffer:   (bid, tid, oid) => patch(`/buildings/${bid}/tenders/${tid}/offers/${oid}/award`),
    // Belgeler
    documents:   (bid) => get(`/buildings/${bid}/documents`),
    delDocument: (bid, id) => del(`/buildings/${bid}/documents/${id}`),
    // Aidat kuralları
    duesRules:    (bid) => get(`/buildings/${bid}/dues/rules`),
    addDuesRule:  (bid, body) => post(`/buildings/${bid}/dues/rules`, body),
    delDuesRule:  (bid, id) => del(`/buildings/${bid}/dues/rules/${id}`),
    generateDues: (bid, body) => post(`/buildings/${bid}/dues/generate`, body),
  };
};

// Perakende: şubeler, ürünler, satış, stok girişi, tedarikçiler (WebServis /api/stores)
export const storeApi = (token) => {
  const headers = { Authorization: `Bearer ${token}` };
  const call = (method, path, body) =>
    request(`/api/web/stores${path}`, {
      method, headers, body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  const get = (path, params) => call('GET', `${path}${params ? buildQuery(params) : ''}`);

  return {
    // Şubeler
    list: () => get(''),
    current: () => get('/current'),
    create: (body) => call('POST', '', body),
    update: (storeId, body) => call('PUT', `/${storeId}`, body),
    deactivate: (storeId) => call('DELETE', `/${storeId}`),
    members: (storeId) => get(`/${storeId}/members`),
    addMember: (storeId, body) => call('POST', `/${storeId}/members`, body),
    removeMember: (storeId, userId) => call('DELETE', `/${storeId}/members/${userId}`),
    // Ürünler
    products: (storeId, params) => get(`/${storeId}/products`, params),
    byBarcode: (storeId, barcode) =>
      get(`/${storeId}/products/by-barcode/${encodeURIComponent(barcode)}`),
    createProduct: (storeId, body) => call('POST', `/${storeId}/products`, body),
    productDetail: (storeId, productId) => get(`/${storeId}/products/${productId}`),
    updateProduct: (storeId, productId, body) => call('PUT', `/${storeId}/products/${productId}`, body),
    adjustStock: (storeId, productId, body) =>
      call('POST', `/${storeId}/products/${productId}/stock-adjustments`, body),
    // Satış
    createSale: (storeId, body) => call('POST', `/${storeId}/sales`, body),
    sales: (storeId, params) => get(`/${storeId}/sales`, params),
    salesSummary: (storeId, params) => get(`/${storeId}/sales/summary`, params),
    saleDetail: (storeId, saleId) => get(`/${storeId}/sales/${saleId}`),
    // Tedarikçiler
    suppliers: (storeId, params) => get(`/${storeId}/suppliers`, params),
    createSupplier: (storeId, body) => call('POST', `/${storeId}/suppliers`, body),
    updateSupplier: (storeId, id, body) => call('PUT', `/${storeId}/suppliers/${id}`, body),
    deleteSupplier: (storeId, id) => call('DELETE', `/${storeId}/suppliers/${id}`),
    // Stok girişi
    createPurchase: (storeId, body) => call('POST', `/${storeId}/purchases`, body),
    purchases: (storeId, params) => get(`/${storeId}/purchases`, params),
    purchaseDetail: (storeId, id) => get(`/${storeId}/purchases/${id}`),
    // Tüm şubeler (birleşik görünüm)
    allProducts: (params) => get('/all/products', params),
    productBranches: (productId) => get(`/all/products/${productId}`),
    allSales: (params) => get('/all/sales', params),
    allSalesSummary: (params) => get('/all/sales/summary', params),
  };
};

export const mobileApi = (token) => {
  const headers = { Authorization: `Bearer ${token}` };
  const get = (path) => request(`/api/mobile${path}`, { headers });
  const post = (path, body) =>
    request(`/api/mobile${path}`, { method: 'POST', headers, body: JSON.stringify(body) });
  const put = (path, body) =>
    request(`/api/mobile${path}`, { method: 'PUT', headers, body: JSON.stringify(body) });
  const patch = (path, body) =>
    request(`/api/mobile${path}`, {
      method: 'PATCH', headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

  return {
    get,
    dashboard: () => get('/dashboard'),
    // Bildirimler
    notifications: (buildingId, params = {}) =>
      get(`/buildings/${buildingId}/notifications${buildQuery(params)}`),
    markRead: (buildingId, notifId) =>
      patch(`/buildings/${buildingId}/notifications/${notifId}/read`),
    markAllRead: (buildingId) =>
      patch(`/buildings/${buildingId}/notifications/read-all`),
    // Daireler
    units: (buildingId, params = {}) =>
      get(`/buildings/${buildingId}/units${buildQuery(params)}`),
    createUnit: (buildingId, body) =>
      post(`/buildings/${buildingId}/units`, body),
    updateUnit: (buildingId, unitId, body) =>
      put(`/buildings/${buildingId}/units/${unitId}`, body),
    // Aidatlar
    dues: (buildingId, params = {}) =>
      get(`/buildings/${buildingId}/dues${buildQuery(params)}`),
    payDue: (buildingId, duesId, body) =>
      patch(`/buildings/${buildingId}/dues/${duesId}/pay`, body),
    unpayDue: (buildingId, duesId) =>
      patch(`/buildings/${buildingId}/dues/${duesId}/unpay`),
    // Anketler
    polls: (buildingId) => get(`/buildings/${buildingId}/polls`),
    vote: (buildingId, pollId, pollOptionId) =>
      post(`/buildings/${buildingId}/polls/${pollId}/vote`, { pollOptionId }),
    // Geri bildirim
    sendFeedback: (body) => post('/feedback', body),
    // Sakinler (bina sahibi doğrulamalı)
    residents: (buildingId) => get(`/buildings/${buildingId}/residents`),
  };
};
