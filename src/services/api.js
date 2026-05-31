const BASE_URL = import.meta.env.VITE_API_URL || "https://interniq-backend-z43c.onrender.com/";

/** Origin for PDFs/static (backend). Set VITE_STATIC_ORIGIN if API URL origin is not where /certificates is served. */
export function getServerOrigin() {
  const override = import.meta.env.VITE_STATIC_ORIGIN?.replace(/\/$/, "");
  if (override) return override;
  try {
    const u = new URL(BASE_URL);
    // PDFs are never served by the Vite dev port — avoid wrong links if .env points at 5173
    if (u.port === "5173" || u.port === "5174") {
      return "http://localhost:5000";
    }
    return u.origin;
  } catch {
    return "http://localhost:5000";
  }
}

/**
 * Full URL for static files (certificates) on the backend.
 * In dev, use same-origin paths so Vite can proxy `/certificates` → backend (fixes PDF viewer / CORP issues).
 */
export function staticFileUrl(pathFromRoot) {
  if (!pathFromRoot) return "";
  if (pathFromRoot.startsWith("http")) return pathFromRoot;
  const base = pathFromRoot.startsWith("/") ? pathFromRoot : `/${pathFromRoot}`;
  if (import.meta.env.DEV) {
    return base;
  }
  return `${getServerOrigin()}${base}`;
}

/** PDF link with safe cache-bust (invalid dates won’t produce ?t=NaN) */
export function certificateOpenUrl(certificateUrl, updatedAt) {
  const base = staticFileUrl(certificateUrl);
  if (!base) return "";
  let ts = Date.now();
  if (updatedAt != null) {
    const n = new Date(updatedAt).getTime();
    if (!Number.isNaN(n)) ts = n;
  }
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}t=${ts}`;
}

export function studyMaterialOpenUrl(fileUrl, updatedAt) {
  return certificateOpenUrl(fileUrl, updatedAt);
}

export const request = async (endpoint, method = "GET", body) => {
  const token = localStorage.getItem("token");
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  const headers = {
    Authorization: token ? `Bearer ${token}` : "",
  };

  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers,
    body: body
      ? isFormData
        ? body
        : JSON.stringify(body)
      : undefined,
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Something went wrong");
  }

  return data;
};
