const DEMO_AUTH_STORAGE_KEY = "demo-auth-session";

export type DemoAccount = {
  email: string;
  password: string;
  full_name: string;
  role: "student" | "admin";
  index_number: string;
  current_level: number;
  department_id: number | null;
  is_activated: boolean;
};

const DEMO_ACCOUNTS: Record<string, DemoAccount> = {
  "student@htu.edu.gh": {
    email: "student@htu.edu.gh",
    password: "DemoStudent123!",
    full_name: "Demo Student",
    role: "student",
    index_number: "DEMO-STUDENT",
    current_level: 300,
    department_id: 1,
    is_activated: true,
  },
  "admin@htu.edu.gh": {
    email: "admin@htu.edu.gh",
    password: "DemoAdmin123!",
    full_name: "Demo Admin",
    role: "admin",
    index_number: "DEMO-ADMIN",
    current_level: 400,
    department_id: 1,
    is_activated: true,
  },
};

export function isDemoEmail(email?: string | null) {
  return typeof email === "string" && email.trim().toLowerCase() in DEMO_ACCOUNTS;
}

export function getDemoAccount(email?: string | null) {
  if (!email) return null;
  return DEMO_ACCOUNTS[email.trim().toLowerCase()] ?? null;
}

export function isDemoPassword(email?: string | null, password?: string) {
  const account = getDemoAccount(email);
  return Boolean(account && password && account.password === password);
}

export function setDemoSession(email: string) {
  const account = getDemoAccount(email);
  if (!account) return null;

  const session = {
    access_token: `demo-${email.replace(/[^a-z0-9]/gi, "-")}`,
    refresh_token: `demo-${crypto.randomUUID()}`,
    expires_at: Date.now() + 1000 * 60 * 60 * 8,
    user: {
      id: crypto.randomUUID(),
      email: account.email,
      user_metadata: {
        full_name: account.full_name,
        name: account.full_name,
      },
    },
    demoAccount: account,
  };

  localStorage.setItem(DEMO_AUTH_STORAGE_KEY, JSON.stringify(session));
  return session;
}

export function getStoredDemoSession() {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem(DEMO_AUTH_STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    window.localStorage.removeItem(DEMO_AUTH_STORAGE_KEY);
    return null;
  }
}

export function clearDemoSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(DEMO_AUTH_STORAGE_KEY);
}
