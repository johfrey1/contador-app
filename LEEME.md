# Contador de asistentes (APK)

## Generar el APK sin instalar nada en tu PC
1. Crea un repositorio **privado** en GitHub y sube todo el contenido de esta carpeta (incluida `.github` y `keystore`).
2. Entra a la pestaña **Actions**. El flujo "Construir APK" arranca solo (o dale **Run workflow**).
3. Cuando termine (unos 5 min), abre la ejecución y descarga **contador-apk** (viene en .zip; adentro está `contador.apk`).

## Instalar en el Galaxy A17
1. Pasa `contador.apk` al celular (Drive, WhatsApp a ti mismo o cable).
2. Ábrelo. Android pedirá permitir "Instalar apps desconocidas" para esa app (Drive / Mis archivos). Acepta.
3. Toca **Instalar**.

## Dónde se guarda
- Cada toque se guarda en el almacenamiento interno de la app (no en el navegador). Borrar caché o datos de Chrome **no** lo afecta.
- Se pierde solo si desinstalas la app o borras sus datos en Ajustes → Aplicaciones → Contador.
- Android incluye esos datos en la copia de seguridad de Google del teléfono.
- En **Guardados → Enviar respaldo** mandas un CSV a WhatsApp o Drive (se abre en Excel).

## Actualizar
Cambia `www/index.html`, sube el cambio y descarga el nuevo APK. Instálalo encima: los datos se conservan porque la firma (`keystore/debug.keystore`) es siempre la misma. **No borres esa carpeta.**

## iPhone (sin App Store)
La misma carpeta `www` funciona como app instalable en iPhone.
1. En Vercel: **Add New → Project**, importa este repositorio y en **Root Directory** elige `www`. Framework: **Other**. Deploy.
2. En el iPhone abre la URL en **Safari** → botón **Compartir** → **Agregar a pantalla de inicio**.
3. Ábrela una vez con internet. Desde ahí funciona sin conexión y guarda en el iPhone.
- Usa siempre el ícono de la pantalla de inicio (no la pestaña de Safari): ahí los datos quedan en el almacenamiento de la app.
- Haz respaldo seguido con **Guardados → Enviar respaldo**.
