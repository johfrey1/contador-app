// Punto de entrada del SDK de Firebase. Se empaqueta en www/vendor/firebase.js
// con `npm run build:firebase` para que la app funcione sin internet ni CDN.
export { initializeApp } from "firebase/app";
export {
  initializeAuth, indexedDBLocalPersistence, browserLocalPersistence, signInAnonymously, onAuthStateChanged, connectAuthEmulator
} from "firebase/auth";
export {
  initializeFirestore, persistentLocalCache, persistentMultipleTabManager, connectFirestoreEmulator, Timestamp,
  doc, collection, query, orderBy, limit, getDocFromServer, getDocsFromServer, setDoc, updateDoc, onSnapshot, writeBatch
} from "firebase/firestore";
