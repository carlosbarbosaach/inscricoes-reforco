import {
  cert,
  getApp,
  getApps,
  initializeApp,
} from "firebase-admin/app";

import {
  Firestore,
  getFirestore,
} from "firebase-admin/firestore";

let firestore: Firestore | null = null;

export function getAdminDb(): Firestore {
  if (firestore) {
    return firestore;
  }

  const projectId =
    process.env.FIREBASE_PROJECT_ID;

  const clientEmail =
    process.env.FIREBASE_CLIENT_EMAIL;

  const privateKey =
    process.env.FIREBASE_PRIVATE_KEY?.replace(
      /\\n/g,
      "\n"
    );

  if (
    !projectId ||
    !clientEmail ||
    !privateKey
  ) {
    throw new Error(
      "Firebase Admin: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL ou FIREBASE_PRIVATE_KEY não configurados."
    );
  }

  const app =
    getApps().length > 0
      ? getApp()
      : initializeApp({
          credential: cert({
            projectId,
            clientEmail,
            privateKey,
          }),
        });

  firestore = getFirestore(app);

  return firestore;
}