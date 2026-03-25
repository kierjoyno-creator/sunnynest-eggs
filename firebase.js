import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import {
  addDoc,
  collection,
  getFirestore,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";
import firebaseConfig from "./firebase-config.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export async function saveEggAlert(email) {
  return addDoc(collection(db, "eggAlerts"), {
    email,
    source: "sunnynest-eggs-web",
    createdAt: serverTimestamp(),
  });
}

export async function createEggOrder(order) {
  return addDoc(collection(db, "eggOrders"), {
    ...order,
    source: "sunnynest-eggs-web",
    status: "new",
    createdAt: serverTimestamp(),
  });
}
