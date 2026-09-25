# Contador de asistentes (APK)

## Generar el APK sin instalar nada en tu PC
1. Sube esta carpeta a GitHub (incluida `.github`). La carpeta `keystore` **no** se sube: la firma va como secret.
   - En tu Mac: `base64 -i keystore/debug.keystore | pbcopy` (copia la firma).
   - En GitHub: **Settings → Secrets and variables → Actions → New repository secret**. Nombre: `DEBUG_KEYSTORE_BASE64`. Pega el valor y guarda.
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

## Contar con varios celulares a la vez
1. En un celular toca el botón de **personas** (arriba a la derecha) → **Crear evento compartido**. Aparece un código de 6 letras, por ejemplo `46A7VF`.
2. Toca **Compartir código** y mándalo por WhatsApp a los demás.
3. En cada otro celular: botón de **personas** → escribe el código → **Unirse**.
4. Listo: cada toque en cualquier celular se suma al mismo total y todos lo ven al instante. El botón de personas se pone verde cuando estás en un evento.
- Para crear o unirse hace falta internet. Después, si se va la señal, sigue contando y lo envía solo cuando vuelve.
- **Cerrar y guardar** guarda el conteo en **Guardados** de todos los celulares y lo pone en cero para todos.
- **Deshacer** quita solo el último toque hecho en ese celular.
- **Salir del evento** vuelve al conteo normal de ese celular; el evento sigue en los demás y puedes volver con el mismo código.

## Actualizar
Cambia `www/index.html`, sube el cambio y descarga el nuevo APK. Instálalo encima: los datos se conservan porque la firma (`keystore/debug.keystore`, guardada en el secret `DEBUG_KEYSTORE_BASE64`) es siempre la misma. **No borres esa carpeta ni el secret.**

## iPhone (sin App Store)
La misma carpeta `www` funciona como app instalable en iPhone.
1. En Vercel: **Add New → Project**, importa este repositorio y en **Root Directory** elige `www`. Framework: **Other**. Deploy.
2. En el iPhone abre la URL en **Safari** → botón **Compartir** → **Agregar a pantalla de inicio**.
3. Ábrela una vez con internet. Desde ahí funciona sin conexión y guarda en el iPhone.
- Usa siempre el ícono de la pantalla de inicio (no la pestaña de Safari): ahí los datos quedan en el almacenamiento de la app.
- Haz respaldo seguido con **Guardados → Enviar respaldo**.
