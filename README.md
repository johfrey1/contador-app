# Contador de asistentes

App para contar asistentes (hombres, mujeres, jóvenes) con guardado local en el celular. Es una PWA empaquetada como APK de Android con [Capacitor](https://capacitorjs.com/).

## Funciones
- Conteo por categoría con un toque.
- Guardado en el almacenamiento interno de la app (no se pierde al borrar datos del navegador).
- Respaldo en CSV desde **Guardados → Enviar respaldo** (WhatsApp, Drive, Excel).
- Funciona sin conexión.

## Estructura
```
www/                      App web (index.html, service worker, manifest, íconos)
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

## iPhone
La carpeta `www` se puede publicar como sitio estático (por ejemplo en Vercel, con Root Directory `www`) e instalar desde Safari con **Agregar a pantalla de inicio**.

Más detalles de instalación, actualización y respaldo en [LEEME.md](LEEME.md).
