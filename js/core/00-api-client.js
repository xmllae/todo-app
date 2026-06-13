// Shared API client and browser-side storage helpers for auth/session flows.

window.TuoleApi = (function createTuoleApi() {
  const STORAGE_KEYS = {
    token: 'tuole_token',
    guestMode: 'tuole_guest_mode',
    guestData: 'tuole_guest',
    sideNavState: 'tuole_gsn_state_v1',
    subscriptions: 'tuole_subs'
  };

  const EVENTS = {
    sessionReady: 'tuole:session-ready',
    sessionCleared: 'tuole:session-cleared'
  };

  const API_BASE = (function resolveApiBase() {
    const rawBase =
      typeof window.__TUOLE_API_BASE === 'string' ? window.__TUOLE_API_BASE.trim() : '';

    return rawBase.replace(/\/+$/, '') || '/api';
  })();

  function readStoredValue(key) {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      return null;
    }
  }

  function writeStoredValue(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (error) {}
  }

  function removeStoredValue(key) {
    try {
      localStorage.removeItem(key);
    } catch (error) {}
  }

  function readStoredJson(key, fallbackValue) {
    const rawValue = readStoredValue(key);

    if (!rawValue) {
      return fallbackValue;
    }

    try {
      return JSON.parse(rawValue);
    } catch (error) {
      return fallbackValue;
    }
  }

  function writeStoredJson(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {}
  }

  function buildUrl(path) {
    const cleanPath = String(path || '').replace(/^\/+/, '');
    return `${API_BASE}/${cleanPath}`;
  }

  function createError(message, meta) {
    const error = new Error(message);

    error.userMessage = message;

    if (meta && typeof meta === 'object') {
      Object.assign(error, meta);
    }

    return error;
  }

  async function readPayload(response) {
    const rawText = await response.text();

    if (!rawText) {
      return {
        data: {},
        isJson: true,
        rawText: ''
      };
    }

    try {
      return {
        data: JSON.parse(rawText),
        isJson: true,
        rawText
      };
    } catch (error) {
      return {
        data: null,
        isJson: false,
        rawText
      };
    }
  }

  function resolveResponseErrorMessage(actionLabel, response, payloadMeta) {
    const payload = payloadMeta && payloadMeta.data ? payloadMeta.data : null;
    const statusText = response && response.status ? `（${response.status}）` : '';

    if (payload && typeof payload.error === 'string' && payload.error.trim()) {
      return payload.error.trim();
    }

    if (payload && typeof payload.message === 'string' && payload.message.trim()) {
      return payload.message.trim();
    }

    if (response && response.status === 401) {
      return actionLabel === '加载数据' ? '登录状态已过期，请重新登录' : '账号或密码不正确';
    }

    if (!payloadMeta || !payloadMeta.isJson) {
      return `${actionLabel}接口返回了异常响应${statusText}`;
    }

    return `${actionLabel}失败${statusText}`;
  }

  function resolveNetworkErrorMessage(actionLabel, path) {
    return `${actionLabel}服务不可用，请检查 ${buildUrl(path)} 是否已部署`;
  }

  async function request(path, options, actionLabel) {
    let response;

    try {
      response = await fetch(buildUrl(path), options);
    } catch (error) {
      throw createError(resolveNetworkErrorMessage(actionLabel, path), {
        cause: error,
        route: path
      });
    }

    const payloadMeta = await readPayload(response);

    if (!response.ok) {
      throw createError(resolveResponseErrorMessage(actionLabel, response, payloadMeta), {
        status: response.status,
        route: path,
        responseBody: payloadMeta.rawText,
        payload: payloadMeta.data
      });
    }

    if (!payloadMeta.isJson) {
      throw createError(`${actionLabel}接口返回了非 JSON 响应（${response.status}）`, {
        status: response.status,
        route: path,
        responseBody: payloadMeta.rawText
      });
    }

    return payloadMeta.data || {};
  }

  function getAuthHeader(token) {
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  function getUserMessage(error, fallbackMessage) {
    if (error && typeof error.userMessage === 'string' && error.userMessage.trim()) {
      return error.userMessage.trim();
    }

    return fallbackMessage;
  }

  return {
    API_BASE,
    EVENTS,
    STORAGE_KEYS,
    buildUrl,
    createError,
    getAuthHeader,
    getUserMessage,
    request,
    storage: {
      readJson: readStoredJson,
      readValue: readStoredValue,
      removeValue: removeStoredValue,
      writeJson: writeStoredJson,
      writeValue: writeStoredValue
    }
  };
})();
