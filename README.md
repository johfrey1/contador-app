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
- Proyecto: `contador-app-54f65` (plan gratuito Spark). Usa Firestore e inicio de sesión anónimo.
- Datos: `eventos/{código}/personas/{nombre normalizado}` es una persona contada (`k` categoría, `n` nombre, `t` hora). Como el id es el nombre y las reglas no dejan sobrescribir, nadie se cuenta dos veces desde celulares distintos. Los toques sin nombre de versiones viejas usan un id aleatorio y `n: null`. `eventos/{código}/guardados` guarda los conteos cerrados.
- El conteo propio del celular (`contador:actual`, `contador:historial`) nunca se borra al entrar a un evento: solo se vacía el conteo abierto después de subirlo, y los Guardados subidos quedan marcados con `subido`.
- Si cambias `firestore.rules`, publícalas en Firebase → Firestore Database → Reglas (o `firebase deploy --only firestore:rules`).
- Para actualizar el SDK: cambia la versión de `firebase` en `package.json`, `npm install` y `npm run build:firebase`.

## iPhone
La carpeta `www` se puede publicar como sitio estático (por ejemplo en Vercel, con Root Directory `www`) e instalar desde Safari con **Agregar a pantalla de inicio**.

Más detalles de instalación, actualización y respaldo en [LEEME.md](LEEME.md).
