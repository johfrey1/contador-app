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

## Respaldo automático en la nube
- Al instalar o actualizar la app, todo lo que ya había en el celular (conteo abierto y Guardados, también los de versiones viejas) se sube solo a Firebase. No hay que hacer nada.
- Después, cada cambio se respalda solo. Sin internet se guarda en el celular y se sube cuando vuelve la señal. Arriba dice "Guardado en el celular y en la nube" cuando ya está respaldado.
- Nada se borra de la nube: "Poner en cero" guarda una copia, y "Quitar de Guardados" solo se permite cuando ese conteo ya está respaldado.

## Contar con varios celulares a la vez
Toca **Compartir** (junto a "Guardado…"). Aparecen dos opciones: **Generar código** e **Ingresar código**.
1. En el celular que tiene el conteo abierto toca **Generar código**. Ese mismo conteo pasa a ser compartido y sus Guardados también se suben.
2. Aparece un código de 8 letras, por ejemplo `WGJN-KP8W`. Toca **Compartir código** y mándalo por WhatsApp.
   - **Cada código sirve para un solo celular** y vence en un día. Para otro celular toca **Nuevo código**.
3. En el otro celular: **Compartir** → **Ingresar código** → escribe el código → **Unirse**. Si ese celular tenía un conteo abierto, pregunta si quieres sumarlo (las personas repetidas no se cuentan dos veces).
4. Cada persona que registres en cualquier celular aparece en todos al instante.
- Una persona solo se cuenta una vez por conteo, aunque la registren desde dos celulares.
- **Deshacer** quita la última persona registrada en ese celular. Quitar a alguien no la borra: queda marcado quién la quitó y cuándo.
- **Cerrar y guardar** lo guarda en **Guardados** de todos y empieza un conteo nuevo para todos. Las personas del conteo cerrado quedan guardadas.
- **Salir del evento** vuelve al conteo propio del celular. Para volver a entrar hace falta un código nuevo.

### Revocar lo compartido
Quien compartió el conteo ve, en **Compartir**, la lista de **celulares conectados** (con el nombre que pusieron al unirse).
- **Revocar** junto a un celular: deja de ver y sumar al conteo al instante y vuelve a su conteo propio. Lo que ya registró se queda. Para volver necesita un código nuevo.
- **Anular este código**: el código que aún no se usó deja de servir.
- **Dejar de compartir con todos**: revoca a todos los celulares y anula el código pendiente. El conteo sigue en tu celular.
- Quien invitó a un celular también puede revocarlo. Al que compartió el conteo nadie lo puede revocar.
- Nada se borra: queda registrado quién revocó a quién y cuándo.
- Solo los celulares que entraron con un código pueden ver o cambiar el conteo compartido.

## Actualizar
Cambia `www/index.html`, sube el cambio y descarga el nuevo APK. Instálalo encima: los datos se conservan porque la firma (`keystore/debug.keystore`, guardada en el secret `DEBUG_KEYSTORE_BASE64`) es siempre la misma. **No borres esa carpeta ni el secret.**

## iPhone (sin App Store)
La misma carpeta `www` funciona como app instalable en iPhone.
1. En Vercel: **Add New → Project**, importa este repositorio y en **Root Directory** elige `www`. Framework: **Other**. Deploy.
2. En el iPhone abre la URL en **Safari** → botón **Compartir** → **Agregar a pantalla de inicio**.
3. Ábrela una vez con internet. Desde ahí funciona sin conexión y guarda en el iPhone.
- Usa siempre el ícono de la pantalla de inicio (no la pestaña de Safari): ahí los datos quedan en el almacenamiento de la app.
- Haz respaldo seguido con **Guardados → Enviar respaldo**.
