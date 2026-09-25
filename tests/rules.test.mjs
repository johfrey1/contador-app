// Pruebas de las reglas de seguridad de Firestore contra el emulador.
// Ejecutar: npm run test:rules   (necesita Java y firebase-tools)
import { test, before, after, beforeEach, describe } from "node:test";
import { readFileSync } from "node:fs";
import { initializeTestEnvironment, assertFails, assertSucceeds } from "@firebase/rules-unit-testing";
import {
  doc, collection, getDoc, getDocs, setDoc, updateDoc, deleteDoc, writeBatch, Timestamp, query, limit
} from "firebase/firestore";

let env;
const H = 3600 * 1000;
const now = () => Date.now();

before(async () => {
  env = await initializeTestEnvironment({
    projectId: "contador-app-54f65",
    firestore: { rules: readFileSync(new URL("../firestore.rules", import.meta.url), "utf8"), host: "127.0.0.1", port: 8080 }
  });
});
after(async () => { await env.cleanup(); });
beforeEach(async () => { await env.clearFirestore(); });

const db = uid => env.authenticatedContext(uid).firestore();
const anon = () => env.unauthenticatedContext().firestore();

const saved = (extra = {}) => ({
  nombre: "Culto", hombres: 1, mujeres: 2, adolHombres: 0, adolMujeres: 1, jovenes: 0, total: 4,
  fecha: 1700000000000, inicio: null, asistentes: [{ k: "h", n: "Ana Pérez", t: 1 }], ...extra
});
const person = (uid, extra = {}) => ({ k: "h", n: "Ana Pérez", t: now(), por: uid, quitado: null, quitadoPor: null, ...extra });

function createEvent(fs, uid, eid = "E1", cid = "C1") {
  const b = writeBatch(fs);
  b.set(doc(fs, "eventos", eid), { dueno: uid, actual: cid, creado: now(), actualizado: now() });
  b.set(doc(fs, "eventos", eid, "conteos", cid), { creado: now(), por: uid, anterior: null, motivo: "inicio" });
  b.set(doc(fs, "eventos", eid, "miembros", uid), { desde: now(), invitacion: null });
  return b.commit();
}
function invite(fs, uid, code = "ABCDEFGH", eid = "E1", venceMs = now() + 24 * H) {
  return setDoc(doc(fs, "invitaciones", code), {
    evento: eid, creadoPor: uid, creado: now(), vence: Timestamp.fromMillis(venceMs), usadoPor: null, usadoEn: null
  });
}
function join(fs, uid, code = "ABCDEFGH", eid = "E1") {
  const b = writeBatch(fs);
  b.update(doc(fs, "invitaciones", code), { usadoPor: uid, usadoEn: now() });
  b.set(doc(fs, "eventos", eid, "miembros", uid), { desde: now(), invitacion: code });
  return b.commit();
}
// Prepara datos saltándose las reglas
const seed = fn => env.withSecurityRulesDisabled(ctx => fn(ctx.firestore()));

describe("respaldo automático de cada celular", () => {
  test("el dueño crea y lee su respaldo", async () => {
    const fs = db("u1");
    await assertSucceeds(setDoc(doc(fs, "respaldos/u1"), { actualizado: now(), plataforma: "android", version: "2" }));
    await assertSucceeds(setDoc(doc(fs, "respaldos/u1/guardados/1"), saved()));
    await assertSucceeds(getDoc(doc(fs, "respaldos/u1/guardados/1")));
    await assertSucceeds(setDoc(doc(fs, "respaldos/u1/estado/actual"), { conteo: { h: 1, taps: ["h"] }, actualizado: now() }));
  });
  test("otro celular no puede leer ni escribir el respaldo ajeno", async () => {
    await seed(fs => setDoc(doc(fs, "respaldos/u1/guardados/1"), saved()));
    const fs = db("u2");
    await assertFails(getDoc(doc(fs, "respaldos/u1/guardados/1")));
    await assertFails(getDocs(collection(fs, "respaldos/u1/guardados")));
    await assertFails(setDoc(doc(fs, "respaldos/u1/guardados/2"), saved()));
    await assertFails(setDoc(doc(fs, "respaldos/u1"), { actualizado: now() }));
  });
  test("sin sesión no se accede a nada", async () => {
    await assertFails(getDoc(doc(anon(), "respaldos/u1")));
    await assertFails(setDoc(doc(anon(), "respaldos/u1"), { actualizado: now() }));
  });
  test("un guardado respaldado no se puede cambiar ni borrar; reenviarlo igual sí", async () => {
    const fs = db("u1");
    await assertSucceeds(setDoc(doc(fs, "respaldos/u1/guardados/1"), saved()));
    await assertSucceeds(setDoc(doc(fs, "respaldos/u1/guardados/1"), saved()));
    await assertFails(setDoc(doc(fs, "respaldos/u1/guardados/1"), saved({ total: 99 })));
    await assertFails(updateDoc(doc(fs, "respaldos/u1/guardados/1"), { nombre: "otro" }));
    await assertFails(deleteDoc(doc(fs, "respaldos/u1/guardados/1")));
  });
  test("los conteos puestos en cero también quedan y no se borran", async () => {
    const fs = db("u1");
    await assertSucceeds(setDoc(doc(fs, "respaldos/u1/descartados/9"), saved({ nombre: "" })));
    await assertFails(deleteDoc(doc(fs, "respaldos/u1/descartados/9")));
  });
  test("no se aceptan datos mal formados", async () => {
    const fs = db("u1");
    await assertFails(setDoc(doc(fs, "respaldos/u1/guardados/1"), saved({ total: -1 })));
    await assertFails(setDoc(doc(fs, "respaldos/u1/guardados/1"), saved({ hombres: 1.5 })));
    await assertFails(setDoc(doc(fs, "respaldos/u1/guardados/1"), saved({ extra: 1 })));
    await assertFails(setDoc(doc(fs, "respaldos/u1/guardados/1"), saved({ nombre: "x".repeat(61) })));
    await assertFails(setDoc(doc(fs, "respaldos/u1/otra/1"), saved()));
    await assertFails(setDoc(doc(fs, "respaldos/u1/estado/otro"), { conteo: {}, actualizado: now() }));
  });
  test("el estado abierto no se puede borrar", async () => {
    const fs = db("u1");
    await setDoc(doc(fs, "respaldos/u1/estado/actual"), { conteo: {}, actualizado: now() });
    await assertFails(deleteDoc(doc(fs, "respaldos/u1/estado/actual")));
    await assertFails(deleteDoc(doc(fs, "respaldos/u1")));
  });
});

describe("crear evento", () => {
  test("el dueño crea evento, conteo y su membresía en una tanda", async () => {
    await assertSucceeds(createEvent(db("u1"), "u1"));
    await assertSucceeds(getDoc(doc(db("u1"), "eventos/E1")));
  });
  test("no se puede crear el evento sin conteo o sin membresía", async () => {
    const fs = db("u1");
    const b = writeBatch(fs);
    b.set(doc(fs, "eventos/E1"), { dueno: "u1", actual: "C1", creado: now(), actualizado: now() });
    b.set(doc(fs, "eventos/E1/miembros/u1"), { desde: now(), invitacion: null });
    await assertFails(b.commit());
    await assertFails(setDoc(doc(fs, "eventos/E2"), { dueno: "u1", actual: "C1", creado: now(), actualizado: now() }));
  });
  test("no se puede crear un evento a nombre de otro", async () => {
    const fs = db("u1");
    const b = writeBatch(fs);
    b.set(doc(fs, "eventos/E1"), { dueno: "u2", actual: "C1", creado: now(), actualizado: now() });
    b.set(doc(fs, "eventos/E1/conteos/C1"), { creado: now(), por: "u1", anterior: null, motivo: "inicio" });
    b.set(doc(fs, "eventos/E1/miembros/u1"), { desde: now(), invitacion: null });
    await assertFails(b.commit());
  });
  test("nadie se hace miembro de un evento ajeno diciendo ser dueño", async () => {
    await createEvent(db("u1"), "u1");
    await assertFails(setDoc(doc(db("u2"), "eventos/E1/miembros/u2"), { desde: now(), invitacion: null }));
    await assertFails(setDoc(doc(db("u2"), "eventos/E1/miembros/u1"), { desde: now(), invitacion: null }));
  });
  test("los eventos no se pueden listar ni borrar", async () => {
    await createEvent(db("u1"), "u1");
    await assertFails(getDocs(collection(db("u1"), "eventos")));
    await assertFails(deleteDoc(doc(db("u1"), "eventos/E1")));
    await assertFails(deleteDoc(doc(db("u1"), "eventos/E1/miembros/u1")));
  });
});

describe("invitaciones de un solo uso", () => {
  beforeEach(async () => { await createEvent(db("u1"), "u1"); });

  test("un miembro crea una invitación y otro celular entra con ella", async () => {
    await assertSucceeds(invite(db("u1"), "u1"));
    await assertSucceeds(getDoc(doc(db("u2"), "invitaciones/ABCDEFGH")));
    await assertSucceeds(join(db("u2"), "u2"));
    await assertSucceeds(getDoc(doc(db("u2"), "eventos/E1")));
  });
  test("la misma invitación no sirve dos veces", async () => {
    await invite(db("u1"), "u1");
    await join(db("u2"), "u2");
    await assertFails(join(db("u3"), "u3"));
    await assertFails(getDoc(doc(db("u3"), "eventos/E1")));
  });
  test("una invitación vencida no sirve", async () => {
    await seed(fs => setDoc(doc(fs, "invitaciones/VENCIDA2"), {
      evento: "E1", creadoPor: "u1", creado: now() - 30 * H, vence: Timestamp.fromMillis(now() - H), usadoPor: null, usadoEn: null
    }));
    await assertFails(join(db("u2"), "u2", "VENCIDA2"));
  });
  test("no se puede crear una invitación que dure más de un día o ya vencida", async () => {
    await assertFails(invite(db("u1"), "u1", "LARGAAAA", "E1", now() + 48 * H));
    await assertFails(invite(db("u1"), "u1", "PASADAAA", "E1", now() - 1000));
  });
  test("quien no es miembro no puede crear invitaciones", async () => {
    await assertFails(invite(db("u9"), "u9"));
  });
  test("una invitación de otro evento no da acceso a este", async () => {
    await createEvent(db("u5"), "u5", "E2", "C9");
    await invite(db("u5"), "u5", "XTRAEVT2", "E2");
    const fs = db("u2"), b = writeBatch(fs);
    b.update(doc(fs, "invitaciones/XTRAEVT2"), { usadoPor: "u2", usadoEn: now() });
    b.set(doc(fs, "eventos/E1/miembros/u2"), { desde: now(), invitacion: "XTRAEVT2" });
    await assertFails(b.commit());
  });
  test("no se entra sin marcar la invitación como usada", async () => {
    await invite(db("u1"), "u1");
    await assertFails(setDoc(doc(db("u2"), "eventos/E1/miembros/u2"), { desde: now(), invitacion: "ABCDEFGH" }));
  });
  test("no se puede marcar la invitación a nombre de otro ni cambiar su evento", async () => {
    await invite(db("u1"), "u1");
    await assertFails(updateDoc(doc(db("u2"), "invitaciones/ABCDEFGH"), { usadoPor: "u3", usadoEn: now() }));
    await assertFails(updateDoc(doc(db("u2"), "invitaciones/ABCDEFGH"), { evento: "E2" }));
    // Marcarla usada sin hacerse miembro tampoco (así nadie "quema" invitaciones ajenas)
    await assertFails(updateDoc(doc(db("u2"), "invitaciones/ABCDEFGH"), { usadoPor: "u2", usadoEn: now() }));
  });
  test("las invitaciones no se pueden listar ni borrar; el código debe tener 8 caracteres válidos", async () => {
    await invite(db("u1"), "u1");
    await assertFails(getDocs(query(collection(db("u2"), "invitaciones"), limit(5))));
    await assertFails(deleteDoc(doc(db("u1"), "invitaciones/ABCDEFGH")));
    await assertFails(invite(db("u1"), "u1", "CORTO"));
    await assertFails(invite(db("u1"), "u1", "ABCDEFG0")); // 0 no está permitido
  });
  test("un código que ya existe no se puede reescribir", async () => {
    await invite(db("u1"), "u1");
    await assertFails(invite(db("u1"), "u1"));
  });
});

describe("personas del conteo", () => {
  beforeEach(async () => { await createEvent(db("u1"), "u1"); await invite(db("u1"), "u1"); await join(db("u2"), "u2"); });
  const P = (fs, id = "ana perez", c = "C1") => doc(fs, "eventos/E1/conteos", c, "personas", id);

  test("un miembro registra una persona y los demás la ven", async () => {
    await assertSucceeds(setDoc(P(db("u2")), person("u2")));
    await assertSucceeds(getDocs(collection(db("u1"), "eventos/E1/conteos/C1/personas")));
  });
  test("quien no es miembro no ve ni registra personas", async () => {
    await setDoc(P(db("u2")), person("u2"));
    await assertFails(getDocs(collection(db("u9"), "eventos/E1/conteos/C1/personas")));
    await assertFails(getDoc(P(db("u9"))));
    await assertFails(setDoc(P(db("u9"), "otro nombre"), person("u9")));
  });
  test("la misma persona no se cuenta dos veces aunque sea desde otro celular", async () => {
    await setDoc(P(db("u1")), person("u1"));
    await assertFails(setDoc(P(db("u2")), person("u2", { k: "m" })));
    await assertFails(setDoc(P(db("u1")), person("u1")));
  });
  test("nadie puede borrar una persona; quitarla la marca con quién y cuándo", async () => {
    await setDoc(P(db("u1")), person("u1"));
    await assertFails(deleteDoc(P(db("u1"))));
    await assertFails(deleteDoc(P(db("u2"))));
    await assertSucceeds(updateDoc(P(db("u2")), { quitado: now(), quitadoPor: "u2" }));
    await assertFails(updateDoc(P(db("u2")), { quitado: now(), quitadoPor: "u2" })); // ya quitada
  });
  test("no se puede quitar a nombre de otro ni cambiar el nombre al quitar", async () => {
    await setDoc(P(db("u1")), person("u1"));
    await assertFails(updateDoc(P(db("u2")), { quitado: now(), quitadoPor: "u1" }));
    await assertFails(updateDoc(P(db("u2")), { quitado: now(), quitadoPor: "u2", n: "Otro" }));
    await assertFails(updateDoc(P(db("u2")), { k: "m" }));
  });
  test("una persona quitada se puede volver a registrar", async () => {
    await setDoc(P(db("u1")), person("u1"));
    await updateDoc(P(db("u1")), { quitado: now(), quitadoPor: "u1" });
    await assertSucceeds(setDoc(P(db("u2")), person("u2", { k: "m" })));
  });
  test("no se puede registrar a nombre de otro celular ni con datos inválidos", async () => {
    await assertFails(setDoc(P(db("u2")), person("u1")));
    await assertFails(setDoc(P(db("u2")), person("u2", { k: "x" })));
    await assertFails(setDoc(P(db("u2")), person("u2", { n: "x".repeat(81) })));
    await assertFails(setDoc(P(db("u2")), person("u2", { t: "hoy" })));
    await assertFails(setDoc(P(db("u2")), person("u2", { quitado: now(), quitadoPor: "u2" })));
    await assertFails(setDoc(P(db("u2")), { ...person("u2"), extra: true }));
    await assertFails(setDoc(P(db("u2"), "x".repeat(101)), person("u2")));
  });
  test("una persona sin nombre (toques de versiones viejas) se acepta", async () => {
    await assertSucceeds(setDoc(P(db("u1"), "_abc123"), person("u1", { n: null, k: "j" })));
  });
  test("no se registra en un conteo que no es el actual", async () => {
    await seed(fs => setDoc(doc(fs, "eventos/E1/conteos/C0"), { creado: 1, por: "u1", anterior: null, motivo: "inicio" }));
    await assertFails(setDoc(P(db("u1"), "ana perez", "C0"), person("u1")));
  });
});

describe("cerrar, poner en cero y borrar guardados", () => {
  beforeEach(async () => { await createEvent(db("u1"), "u1"); await invite(db("u1"), "u1"); await join(db("u2"), "u2"); });
  const close = (fs, uid, next = "C2", motivo = "cierre", anterior = "C1", guardado = true) => {
    const b = writeBatch(fs);
    if (guardado) b.set(doc(fs, "eventos/E1/guardados/G1"), saved({ conteo: anterior, por: uid, origen: "cierre", archivado: null, archivadoPor: null }));
    b.set(doc(fs, "eventos/E1/conteos", next), { creado: now(), por: uid, anterior, motivo });
    b.update(doc(fs, "eventos/E1"), { actual: next, actualizado: now() });
    return b.commit();
  };

  test("cerrar guarda el conteo y empieza otro sin borrar a las personas", async () => {
    await setDoc(doc(db("u2"), "eventos/E1/conteos/C1/personas/ana perez"), person("u2"));
    await assertSucceeds(close(db("u2"), "u2"));
    const ev = await getDoc(doc(db("u1"), "eventos/E1"));
    if (ev.data().actual !== "C2") throw new Error("no cambió el conteo");
    const old = await getDocs(collection(db("u1"), "eventos/E1/conteos/C1/personas"));
    if (old.size !== 1) throw new Error("se perdieron personas del conteo cerrado");
    // La misma persona puede venir al siguiente conteo
    await assertSucceeds(setDoc(doc(db("u1"), "eventos/E1/conteos/C2/personas/ana perez"), person("u1")));
    // Y ya no se puede registrar en el conteo cerrado
    await assertFails(setDoc(doc(db("u1"), "eventos/E1/conteos/C1/personas/luis gomez"), person("u1", { n: "Luis Gómez" })));
  });
  test("poner en cero empieza otro conteo y el anterior queda", async () => {
    await assertSucceeds(close(db("u1"), "u1", "C2", "cero", "C1", false));
  });
  test("no se puede saltar a un conteo que no sigue al actual", async () => {
    await assertFails(close(db("u1"), "u1", "C2", "cierre", "OTRO"));
    await assertFails(updateDoc(doc(db("u1"), "eventos/E1"), { actual: "C1", actualizado: now() }));
    await assertFails(updateDoc(doc(db("u1"), "eventos/E1"), { dueno: "u1", actualizado: now() }));
  });
  test("quien no es miembro no puede cerrar", async () => {
    await assertFails(close(db("u9"), "u9"));
  });
  test("un guardado no se borra ni se modifica; solo se archiva una vez", async () => {
    await close(db("u1"), "u1");
    const G = fs => doc(fs, "eventos/E1/guardados/G1");
    await assertFails(deleteDoc(G(db("u2"))));
    await assertFails(updateDoc(G(db("u2")), { total: 1000 }));
    await assertFails(updateDoc(G(db("u2")), { archivado: now(), archivadoPor: "u1" }));
    await assertSucceeds(updateDoc(G(db("u2")), { archivado: now(), archivadoPor: "u2" }));
    await assertFails(updateDoc(G(db("u1")), { archivado: null, archivadoPor: null }));
    const g = await getDoc(G(db("u1")));
    if (g.data().total !== 4) throw new Error("el guardado cambió");
  });
  test("subir guardados del celular al evento, y reenviarlos igual no falla", async () => {
    const data = saved({ conteo: null, por: "u2", origen: "celular", archivado: null, archivadoPor: null });
    await assertSucceeds(setDoc(doc(db("u2"), "eventos/E1/guardados/L-u2-1"), data));
    await assertSucceeds(setDoc(doc(db("u2"), "eventos/E1/guardados/L-u2-1"), data));
    await assertFails(setDoc(doc(db("u2"), "eventos/E1/guardados/L-u2-2"), { ...data, por: "u1" }));
    await assertFails(setDoc(doc(db("u9"), "eventos/E1/guardados/L-u9-1"), { ...data, por: "u9" }));
  });
  test("los conteos y membresías no se modifican ni se borran", async () => {
    await assertFails(updateDoc(doc(db("u1"), "eventos/E1/conteos/C1"), { motivo: "cero" }));
    await assertFails(deleteDoc(doc(db("u1"), "eventos/E1/conteos/C1")));
    await assertFails(updateDoc(doc(db("u2"), "eventos/E1/miembros/u2"), { desde: 1 }));
  });
});

describe("volumen", () => {
  test("subir un conteo grande en tandas de 100 personas", async () => {
    await createEvent(db("u1"), "u1");
    const fs = db("u1");
    for (let i = 0; i < 3; i++) {
      const b = writeBatch(fs);
      for (let j = 0; j < 100; j++) b.set(doc(fs, "eventos/E1/conteos/C1/personas", "persona " + i + "-" + j), person("u1", { n: "Persona " + i + "-" + j }));
      await assertSucceeds(b.commit());
    }
    const all = await getDocs(collection(fs, "eventos/E1/conteos/C1/personas"));
    if (all.size !== 300) throw new Error("faltan personas: " + all.size);
  });
  test("crear el evento con las personas del conteo abierto en la misma tanda", async () => {
    const fs = db("u1"), b = writeBatch(fs);
    b.set(doc(fs, "eventos/E1"), { dueno: "u1", actual: "C1", creado: now(), actualizado: now() });
    b.set(doc(fs, "eventos/E1/conteos/C1"), { creado: now(), por: "u1", anterior: null, motivo: "inicio" });
    b.set(doc(fs, "eventos/E1/miembros/u1"), { desde: now(), invitacion: null });
    for (let j = 0; j < 50; j++) b.set(doc(fs, "eventos/E1/conteos/C1/personas", "p" + j), person("u1", { n: "P " + j }));
    await assertSucceeds(b.commit());
  });
});
