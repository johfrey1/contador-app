# Contador de asistentes

App para contar asistentes (hombres, mujeres, jóvenes) con guardado local en el celular. Es una PWA empaquetada como APK de Android con [Capacitor](https://capacitorjs.com/).

## Funciones
- Conteo por categoría con un toque.
- Guardado en el almacenamiento interno de la app (no se pierde al borrar datos del navegador).
- Respaldo en CSV desde **Guardados → Enviar respaldo** (WhatsApp, Drive, Excel).
- Funciona sin conexión.
- **Conteo compartido entre celulares** en tiempo real (Firebase): un celular crea un evento, los demás se unen con el código de 6 letras y todos suman al mismo conteo. Al crear o unirse, el conteo abierto y los Guardados del celular se suben al evento. Sin internet sigue contando y sincroniza al volver la señal.

## Estructura
```
www/                      App web (index.html, service worker, manifest, íconos)
www/vendor/firebase.js    SDK de Firebase empaquetado (se genera con `npm run build:firebase`)
src/firebase.js           Qué partes del SDK de Firebase se empaquetan
firestore.rules           Reglas de seguridad de Firestore (proyecto contador-app-54f65)
capacitor.config.json     Configuración de Capacitor (appId: com.john.contador)
.github/workflows/        Compilación automática del APK
LEEME.md                  Guía de instalación paso a paso
```

## Compilar el APK
Cada push a `main` ejecuta el workflow **Construir APK** en GitHub Actions. También se puede lanzar a mano con **Run workflow**. Al terminar, descarga el artefacto **contador-apk**, que trae `contador.apk`.

Para compilar localmente (requiere Node 22, JDK 21 y Android SDK):
```bash
npm install
npx cap add android
npx cap sync android
cd android && ./gradlew assembleDebug
```

## Sincronización (Firebase)
Proyecto `contador-app-54f65` (plan gratuito Spark), con Firestore e inicio de sesión anónimo. Cada celular tiene un usuario anónimo que se conserva al actualizar la app.

**Nada se borra**: las reglas no permiten `delete` en ninguna colección. Quitar, poner en cero y archivar solo marcan.

| Ruta | Qué es | Quién |
|---|---|---|
| `respaldos/{uid}/guardados/{id}` | Copia de cada Guardado del celular (no se modifica) | Solo ese celular |
| `respaldos/{uid}/descartados/{id}` | Conteos puestos en cero o pasados a un evento | Solo ese celular |
| `respaldos/{uid}/estado/actual` | Conteo abierto del celular | Solo ese celular |
| `invitaciones/{código}` | Código de 8 caracteres, un solo uso, vence en ~1 día | Se lee con el código exacto |
| `eventos/{id}` | Evento compartido (`actual` = conteo en curso) | Solo miembros |
| `eventos/{id}/miembros/{uid}` | Celulares que entraron con un código (`nombre`, `invitadoPor`, `revocado`, `revocadoPor`) | Solo miembros activos; cada celular lee el suyo |
| `eventos/{id}/conteos/{cid}/personas/{nombre}` | Persona contada; el id es el nombre normalizado, así no se repite | Solo miembros |
| `eventos/{id}/guardados/{id}` | Conteos cerrados (se archivan, no se borran) | Solo miembros |

- Al cerrar o poner en cero se crea otro conteo y el evento apunta a él; el anterior queda intacto.
- Revocar: el dueño (o quien invitó a ese celular) marca `revocado` en la membresía; el celular pierde el acceso en el acto y vuelve a entrar solo con un código nuevo. Un código sin usar se anula marcando `revocado`.
- El celular respalda automáticamente al abrir la app, tras cada cambio y al volver la conexión. Un Guardado local solo se puede quitar de la lista si ya está respaldado.
- Pruebas de las reglas (49 casos, necesita Java): `npm run test:rules`.
- Probar la app contra los emuladores: `firebase emulators:start --only auth,firestore` y abrir `http://localhost:PUERTO/?emulador`.
- Si cambias `firestore.rules`, publícalas en Firebase → Firestore Database → Reglas (o `firebase deploy --only firestore:rules`).
- Para actualizar el SDK: cambia la versión de `firebase` en `package.json`, `npm install` y `npm run build:firebase`.

## iPhone
La carpeta `www` se puede publicar como sitio estático (por ejemplo en Vercel, con Root Directory `www`) e instalar desde Safari con **Agregar a pantalla de inicio**.

Más detalles de instalación, actualización y respaldo en [LEEME.md](LEEME.md).
