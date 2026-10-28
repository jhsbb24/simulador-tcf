# 🍁 Simulador TCF Canada

Una aplicación web para preparar el **TCF Canada** con la meta de llegar a **NCLC 8** en las 4 competencias.
Es **un solo archivo** (`index.html`): no necesita servidor, ni cuentas, ni internet (salvo para abrir fuck-tcf).
Funciona en iPhone (Safari) y en computadora (Mac, Windows).

La interfaz está en español y todo el contenido de examen (consignas, temas, ejemplos) está en francés.

| Módulo | Qué hace |
|---|---|
| ✍️ **Expresión escrita** | Las 3 tareas (60 min): cronómetro, contador de palabras y botón «Copiar para corrección» para pegar en Claude. |
| 🎙️ **Expresión oral** | Las 3 tareas (12 min): cronómetro con preparación, preguntas del examinador, ayuda y **grabación de tu voz**. |
| 🃏 **Tarjetas** | 115 tarjetas español → francés con repetición espaciada, en 7 categorías de gramática. |
| 🎧 **Comprensión** | Enlace a fuck-tcf, listas 1-40 de CO y CE, registro de resultados y «Mis temas». |
| 📈 **Progreso** | Las 4 competencias con la meta NCLC 8, gráficas, racha, sugerencia semanal y respaldo. |

---

## 1. Publicar la app con GitHub Pages (paso a paso)

GitHub Pages convierte este repositorio en una página web con su propia dirección. Solo hay que hacerlo una vez.

### Paso 0 · Que los archivos estén en la rama `main`

GitHub Pages publicará lo que haya en la rama **main**. Si estos archivos están en otra rama (por ejemplo, en un *pull request*):

1. Entra a tu repositorio en github.com.
2. Abre la pestaña **Pull requests** y entra al pull request con estos cambios.
3. Pulsa **Merge pull request** y luego **Confirm merge**.

Comprueba que en la página principal del repositorio (rama `main`) ves el archivo `index.html`.

### Paso 1 · Activar Pages

1. En tu repositorio, pulsa **Settings** (⚙️ Configuración), arriba a la derecha.
2. En el menú de la izquierda, busca la sección **Code and automation** y pulsa **Pages**.
3. En **Build and deployment** → **Source**, elige **Deploy from a branch**.
4. En **Branch**, elige **main** y, al lado, la carpeta **/ (root)**.
5. Pulsa **Save**.

### Paso 2 · Esperar y abrir

1. Espera 1 o 2 minutos. Puedes ver el avance en la pestaña **Actions** (un círculo amarillo que se vuelve ✅ verde).
2. Vuelve a **Settings → Pages**: arriba aparecerá «Your site is live at…» con tu dirección. Será algo así:

   **https://jhsbb24.github.io/simulador-tcf/**

3. Abre esa dirección en el iPhone (Safari) y en la Mac.

> 💡 **Nota:** con una cuenta gratuita de GitHub, Pages solo funciona si el repositorio es **público**. Puedes cambiarlo en **Settings → General → Danger Zone → Change visibility**. Tus datos personales **no** se publican: viven solo en tu navegador (ver sección 3).

> 📱 **En el iPhone:** en Safari, pulsa el botón **Compartir** (cuadrado con flecha) → **Añadir a pantalla de inicio**. Así tendrás un ícono como si fuera una app.

### ¿Hice un cambio y no lo veo?

Cada vez que cambias algo en `main`, GitHub vuelve a publicar la página en 1-2 minutos. Si no ves el cambio, recarga la página (en la Mac: `Cmd + Shift + R`).

---

## 2. Cómo usar cada módulo

### ✍️ Módulo 1 · Expresión escrita (60 minutos)

- **Práctica (una tarea):** elige la Tâche 1, 2 o 3. Sale un tema al azar; puedes pulsar **🔄 Otro tema** o elegir un **eje temático** (Travail, Logement, Environnement…). Pulsa **▶ Empezar** para iniciar el cronómetro.
  - Tâche 1 · mensaje (describir, contar, explicar) · **60-120 palabras** · 10 min
  - Tâche 2 · relato o compte rendu con tu opinión · **120-150 palabras** · 20 min
  - Tâche 3 · dos documentos con opiniones opuestas: los resumes y das tu opinión · **120-180 palabras** · 30 min
- **Examen completo:** las 3 tareas con **un solo cronómetro de 60 minutos**. Puedes pasar de una tarea a otra con las pestañas.
- El **contador de palabras** se pone **rojo** fuera del rango y **verde** dentro. Cuenta como el examen: es una palabra todo lo que está entre dos espacios («c'est-à-dire» = 1).
- Los botones **é è ê à ç œ « »…** escriben letras francesas (útil en un teclado español).
- Tu texto se guarda solo: si se cierra la página por accidente, al volver recuperas la tarea.
- Al terminar (o cuando se acaba el tiempo), pulsa **📋 Copiar para corrección** y pégalo en Claude. El texto copiado ya incluye las instrucciones para que Claude te dé una nota sobre 20, el nivel NCLC, tus errores y una versión mejorada.
- Después, elige en **«Nivel NCLC que te dio Claude»** el nivel que te dio. Queda guardado en tu progreso.

### 🎙️ Módulo 2 · Expresión oral (12 minutos)

- **Práctica (una tarea)** o **Examen completo** (las 3 tareas seguidas, con 10 segundos entre una y otra).
  - **Tâche 1 · Entretien dirigé (2 min, sin preparación):** te presentas y respondes. Pulsa **Siguiente pregunta ➡** para ver las preguntas del examinador una por una.
  - **Tâche 2 · Exercice en interaction (5 min 30):** 2 min de preparación + 3 min 30 en los que **tú haces las preguntas**. El botón **💡 Ver ayuda** muestra u oculta de 10 a 15 ideas de preguntas. Puedes saltarte la preparación con **⏭ Empezar a hablar ya**.
  - **Tâche 3 · Point de vue (4 min 30, sin preparación):** expresas y defiendes tu opinión. Hay una «estructura sugerida» por si la necesitas.
- **Grabar tu voz:** pulsa **🎙️ Grabar** (la primera vez, el navegador pide permiso para el micrófono) y **⏹ Detener**. Luego puedes **escucharla** y **⬇ Descargarla**. La grabación se detiene sola cuando se acaba el tiempo.
  - ⚠️ Las grabaciones **se borran al cerrar la página**: descárgalas si quieres guardarlas.
  - El micrófono funciona cuando abres la app desde GitHub Pages (dirección `https://`). Si abres el archivo con doble clic, puede que no funcione.
- Al final puedes escribir (o dictar) una **transcripción** y copiarla para que Claude la corrija, y registrar el **nivel NCLC**.

### 🃏 Módulo 3 · Tarjetas de repaso

- Lee la frase en **español**, piensa cómo se dice en **francés** y pulsa **👀 Mostrar respuesta** (verás la versión correcta y una explicación breve).
- Pulsa **✅ Lo sabía** o **❌ No lo sabía**:
  - Las que **no sabías** vuelven dentro de 3 tarjetas y otra vez hoy.
  - Las que **sabías** vuelven en 1, 3, 7, 14 y 30 días.
  - Una tarjeta está **dominada** cuando la aciertas 3 veces seguidas en días distintos.
- Filtra por categoría con los botones de arriba: Pronombre EN (todos los tiempos y doble pronombre) · qui / que / dont / où · donc / dont / dès · Conditionnel, subjonctif e hipótesis (si + imparfait / plus-que-parfait) · Verbos pronominales · Falsos cognados · Conectores NCLC 8.
- En la computadora: **Espacio** = mostrar, **←** = No lo sabía, **→** = Lo sabía.

### 🎧 Módulo 4 · Comprensión con fuck-tcf

- El botón **Abrir fuck-tcf.xyz ↗** abre el sitio en otra pestaña. Esta app **no copia ni guarda** nada del sitio (ni temas, ni textos, ni audios, ni respuestas): solo tus marcas y tus resultados.
- **Listas 1-40** de Compréhension orale y Compréhension écrite: toca un número para marcar el test como hecho.
- **Registrar un resultado:** tipo (CO/CE), número de test, puntaje y máximo (escríbelo como lo muestre el sitio: puntos sobre 699 o aciertos, por ejemplo sobre 39), fecha y una nota sobre tus errores. Al guardar, el test se marca solo en la lista.
- **⭐ Mis temas:** pulsa **➕ Agregar tema**, elige la tarea y pega el texto del tema. Se guardan **solo en tu navegador** (nunca en el repositorio) y entran al sorteo de los módulos 1 y 2 junto a los temas originales, con la etiqueta **⭐ Mío**.

### 📈 Módulo 5 · Progreso

- **Las 4 competencias** (CO, CE, EE, EO), cada una con la meta **NCLC 8** visible y una barra de avance.
  - CO y CE usan la tabla oficial de equivalencias de IRCC (puntos sobre 699): NCLC 8 = **503** en CO y **499** en CE.
  - EE y EO usan el nivel NCLC que registras después de cada corrección (NCLC 8 = 12/20).
- **Gráficas de evolución** de CO y CE con tus resultados (pasa el dedo o el ratón por los puntos; también hay una tabla).
- **Tareas hechas por tipo** (Tâche 1, 2, 3) y un **historial** donde puedes anotar o cambiar el NCLC de cada texto o grabación.
- **🔥 Racha** de días seguidos practicando y **tarjetas dominadas por categoría**.
- **👉 Siguiente paso sugerido:** mira los últimos 7 días y te recomienda lo que menos has practicado (meta semanal: 3 tareas escritas, 3 orales, 2 tests de CO, 2 de CE y 50 repasos de tarjetas).
- **💾 Exportar / Importar respaldo:** ver la sección siguiente.

---

## 3. Tus datos: dónde se guardan y cómo pasarlos del celular a la Mac

- Todo tu progreso se guarda **en el navegador** del dispositivo que usas (localStorage). No se envía a ningún servidor y no se sube al repositorio.
- El celular y la Mac **no se sincronizan solos**. Para pasar tus datos:
  1. En el dispositivo de origen: **Progreso → ⬇️ Exportar respaldo**. Se descarga un archivo `respaldo-tcf-AAAA-MM-DD.json` (en el iPhone queda en la app **Archivos → Descargas**).
  2. Envía ese archivo al otro dispositivo (AirDrop, correo, iCloud Drive…).
  3. En el otro dispositivo: **Progreso → ⬆️ Importar respaldo** y elige el archivo. ⚠️ Esto **reemplaza** los datos que hubiera en ese dispositivo.
- Haz un respaldo **cada semana**: Safari puede borrar los datos de los sitios que no visitas durante un tiempo. La pantalla de inicio te avisa si hace más de 7 días que no exportas.
- El respaldo contiene tus temas personales: guárdalo en tu dispositivo o en tu nube personal y **no lo subas al repositorio** (el archivo `.gitignore` ya evita que se suba por accidente).
- En modo privado de Safari no se puede guardar nada: la app te avisa con un mensaje amarillo.

---

## 4. Sobre el contenido

- **Bancos de temas originales** (escritos para esta app, no copiados de exámenes oficiales ni de otros sitios), cubriendo los ejes que más se repiten en el TCF Canada: travail, logement, environnement, technologie et réseaux sociaux, santé, éducation, famille, loisirs et voyages, consommation, ville vs campagne, immigration et intégration au Canada.
  - Escrita: 33 temas por tarea (3 por eje). La Tâche 3 incluye dos documentos con opiniones opuestas.
  - Oral: 36 entretiens (Tâche 1), 33 situaciones con 12-13 ideas de preguntas (Tâche 2) y 33 preguntas de opinión (Tâche 3).
- **115 tarjetas** de gramática y vocabulario con explicación en español.
- La ortografía y la gramática francesas de todos los temas y tarjetas se revisaron con un corrector gramatical (LanguageTool) y a mano.
- Las tablas NCLC vienen de la equivalencia publicada por IRCC; revisa el sitio oficial de IRCC por si cambian.
- Esta app no está afiliada a France Éducation International, a IRCC ni a fuck-tcf.

**¿Quieres agregar temas permanentes al banco?** Abre `index.html` y busca `BANK.EE1 = [` (o `EE2`, `EE3`, `EO1`, `EO2`, `EO3`). Copia una línea existente, cambia el `id` por uno nuevo (por ejemplo `ee1-34`) y escribe tu tema. Para temas que viste en otros sitios, usa mejor **⭐ Mis temas**, que se quedan solo en tu navegador.

---

## 5. Pruebas automáticas (opcional)

La carpeta `tests/` contiene 26 pruebas automáticas que abren la app en un navegador Chromium y comprueban, entre otras cosas:

- los cronómetros (10:00 de práctica, 60:00 de examen, 2:00 + 3:30 de la Tâche 2 oral, el examen oral completo de 12 min);
- el contador de palabras (rojo/verde en los límites 59, 60, 120 y 121) y los botones de acentos;
- «Copiar para corrección», la recuperación de una tarea tras recargar la página y la grabación de audio;
- la repetición espaciada de las tarjetas (las falladas vuelven antes; dominada tras 3 aciertos en días distintos);
- el seguimiento (gráfica, meta NCLC 8, racha, NCLC de Claude, sugerencia semanal, exportar/importar respaldo, Mis temas);
- que la app siga funcionando si el navegador bloquea localStorage, que no haga peticiones a internet y que no haya desbordamiento horizontal a 320, 390 y 1280 px.

Para ejecutarlas necesitas [Node.js](https://nodejs.org) 18 o superior:

```bash
cd tests
```

```bash
npm install
```

```bash
npx playwright install chromium
```

```bash
npm test
```

Al final verás `✅ 26/26 pruebas superadas`.
