// Punto de entrada del SDK de Firebase. Se empaqueta en www/vendor/firebase.js
// con `npm run build:firebase` para que la app funcione sin internet ni CDN.
export { initializeApp } from "firebase/app";
export { initializeAuth, indexedDBLocalPersistence, browserLocalPersistence, signInAnonymously, onAuthStateChanged } from "firebase/auth";
export {
  initializeFirestore, persistentLocalCache, persistentMultipleTabManager,
  doc, collection, query, orderBy, limit, getDoc, getDocFromServer, setDoc, deleteDoc, onSnapshot, writeBatch, increment
} from "firebase/firestore";
