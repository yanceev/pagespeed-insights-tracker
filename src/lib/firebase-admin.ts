import { readFileSync } from "fs";
import {
  initializeApp,
  getApps,
  cert,
  type ServiceAccount,
} from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

export const METRICS_COLLECTION = "psiSites";

function resolveProjectId(): string | undefined {
  return (
    process.env.FIREBASE_PROJECT_ID ||
    process.env.GOOGLE_CLOUD_PROJECT ||
    process.env.GCLOUD_PROJECT
  );
}

function assertFirebaseConfig(projectId: string | undefined): string {
  const hasServiceAccountKey = Boolean(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  const hasCredentialsFile = Boolean(process.env.GOOGLE_APPLICATION_CREDENTIALS);

  if (!projectId && !hasServiceAccountKey && !hasCredentialsFile) {
    throw new Error(
      "Firebase is not configured. Add FIREBASE_PROJECT_ID=wizy-psi-tracker to .env and either " +
        "GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json or FIREBASE_SERVICE_ACCOUNT_KEY={...json...}"
    );
  }

  if (!projectId) {
    throw new Error(
      "FIREBASE_PROJECT_ID is missing from .env (use your Firebase project id, e.g. wizy-psi-tracker)."
    );
  }

  return projectId;
}

function parseServiceAccount(
  raw: ServiceAccount & { project_id?: string },
  fallbackProjectId: string
): ServiceAccount {
  return {
    ...raw,
    projectId: raw.projectId ?? raw.project_id ?? fallbackProjectId,
  };
}

function loadServiceAccount(projectId: string): ServiceAccount {
  const inlineJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (inlineJson) {
    return parseServiceAccount(
      JSON.parse(inlineJson) as ServiceAccount & { project_id?: string },
      projectId
    );
  }

  const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (!credentialsPath) {
    throw new Error(
      "Set GOOGLE_APPLICATION_CREDENTIALS to your service account JSON path, or FIREBASE_SERVICE_ACCOUNT_KEY."
    );
  }

  try {
    const raw = JSON.parse(readFileSync(credentialsPath, "utf8")) as ServiceAccount & {
      project_id?: string;
    };
    return parseServiceAccount(raw, projectId);
  } catch (e) {
    const hint =
      e instanceof Error && "code" in e && e.code === "ENOENT"
        ? ` File not found: ${credentialsPath}`
        : "";
    throw new Error(`Could not read service account at GOOGLE_APPLICATION_CREDENTIALS.${hint}`);
  }
}

export function getAdminApp() {
  if (getApps().length > 0) return getApps()[0]!;

  const projectId = assertFirebaseConfig(resolveProjectId());
  const serviceAccount = loadServiceAccount(projectId);

  return initializeApp({
    credential: cert(serviceAccount),
    projectId: serviceAccount.projectId ?? projectId,
  });
}

export function getDb() {
  getAdminApp();
  return getFirestore();
}

export function metricsCollection(siteId: string) {
  return getDb()
    .collection(METRICS_COLLECTION)
    .doc(siteId)
    .collection("metrics");
}
