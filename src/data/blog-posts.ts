interface BlogPostData {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  date: string;
  category: string;
  tags: string[];
  coverImage?: string;
}

export const blogPosts: BlogPostData[] = [
  {
    slug: "5-errores-gestion-asistencia-dojo",
    title: "5 errores que cometen los dojos al gestionar la asistencia",
    excerpt:
      "Hojas de papel, Excel interminables y recuentos a ojo: descubre los cinco errores mas habituales en el control de asistencia y como solucionarlos con herramientas digitales.",
    author: "Joel Castro",
    date: "2026-05-15",
    category: "gestion",
    tags: ["asistencia", "gestion", "productividad"],
    content: `<p>Gestionar la asistencia de un dojo parece sencillo hasta que deja de serlo. Al principio bastan una libreta y buena memoria, pero a medida que el club crece, los errores se acumulan y acaban afectando a la experiencia de alumnos e instructores. Estos son los cinco fallos que vemos con mayor frecuencia.</p>

<h2>1. Listas en papel que se pierden o se deterioran</h2>
<p>El cl&aacute;sico folio grapado junto a la puerta del tatami cumple su funci&oacute;n durante una semana, pero rara vez sobrevive al mes. Las hojas se manchan, se traspapelan o, sencillamente, nadie recuerda d&oacute;nde quedaron. Cuando llega el momento de revisar la asistencia de un alumno concreto, la informaci&oacute;n ya no existe. Una herramienta digital elimina este riesgo porque el registro queda almacenado en la nube de forma autom&aacute;tica.</p>

<h2>2. No analizar tendencias de asistencia</h2>
<p>Saber cu&aacute;ntos alumnos vinieron un martes concreto es &uacute;til; saber que los martes de enero la asistencia cae un 30&nbsp;% es revelador. Sin embargo, muchos dojos nunca cruzan los datos. Identificar patrones permite ajustar horarios, reforzar clases populares y anticipar bajas estacionales. Plataformas como EntrenaDojo generan estas estad&iacute;sticas de forma autom&aacute;tica, sin necesidad de exportar nada a una hoja de c&aacute;lculo.</p>

<h2>3. No hacer seguimiento de alumnos ausentes</h2>
<p>Un alumno que falta dos semanas seguidas sin avisar es un alumno en riesgo de abandono. Si nadie lo detecta, el club pierde un miembro sin haber tenido la oportunidad de actuar. Un sistema de alertas que notifique las ausencias prolongadas permite al instructor enviar un mensaje a tiempo, mostrando inter&eacute;s genuino y recuperando la motivaci&oacute;n del practicante.</p>

<h2>4. Desconocer el tama&ntilde;o real de cada clase</h2>
<p>Muchos responsables de dojo estiman el aforo de sus clases &laquo;a ojo&raquo;. Esto lleva a problemas pr&aacute;cticos: clases demasiado llenas donde la calidad baja, o franjas horarias infrautilizadas que podr&iacute;an suprimirse. Contar con datos reales de ocupaci&oacute;n facilita la toma de decisiones sobre horarios, espacios y necesidad de instructores adicionales.</p>

<h2>5. Mezclar asistencia y cobros en el mismo registro</h2>
<p>Anotar en la misma columna si un alumno vino y si ha pagado la mensualidad genera confusi&oacute;n y errores contables. Son dos procesos distintos que deben gestionarse por separado. EntrenaDojo mantiene la asistencia y la facturaci&oacute;n en m&oacute;dulos independientes pero conectados, de modo que puedes cruzar la informaci&oacute;n sin mezclarla.</p>

<h3>Conclusi&oacute;n</h3>
<p>La asistencia es mucho m&aacute;s que un simple recuento: es el term&oacute;metro de la salud de tu dojo. Corregir estos cinco errores no requiere una gran inversi&oacute;n, sino la voluntad de pasar de m&eacute;todos manuales a una soluci&oacute;n digital pensada espec&iacute;ficamente para clubes de artes marciales.</p>`,
  },
  {
    slug: "configurar-progresion-cinturones-club",
    title: "C&oacute;mo configurar la progresi&oacute;n de cinturones en tu club",
    excerpt:
      "Aprende a definir requisitos claros de tiempo, clases y t&eacute;cnicas para cada nivel de cintur&oacute;n, y a gestionar el proceso de promoci&oacute;n de forma transparente.",
    author: "Joel Castro",
    date: "2026-04-28",
    category: "cinturones",
    tags: ["cinturones", "progresion", "configuracion"],
    content: `<p>La progresi&oacute;n de cinturones es el eje vertebrador de la mayor&iacute;a de artes marciales. Define el camino del alumno, marca objetivos tangibles y refuerza la motivaci&oacute;n a largo plazo. Sin embargo, muchos clubes gestionan este proceso de forma desestructurada: los criterios viven en la cabeza del instructor y los alumnos desconocen qu&eacute; se espera de ellos. Veamos c&oacute;mo configurar un sistema claro y justo.</p>

<h2>Define los requisitos de cada nivel</h2>
<p>El primer paso es documentar qu&eacute; necesita un alumno para presentarse al examen de cada cintur&oacute;n. Los criterios m&aacute;s habituales son:</p>
<ul>
  <li><strong>Tiempo m&iacute;nimo en el grado anterior:</strong> por ejemplo, seis meses como cintur&oacute;n amarillo antes de optar al naranja.</li>
  <li><strong>N&uacute;mero de clases asistidas:</strong> un m&iacute;nimo de 40 sesiones desde la &uacute;ltima promoci&oacute;n garantiza pr&aacute;ctica suficiente.</li>
  <li><strong>T&eacute;cnicas requeridas:</strong> un listado concreto de katas, combinaciones o proyecciones que el alumno debe dominar.</li>
</ul>
<p>Plasmar estos criterios por escrito elimina la subjetividad y permite que cualquier instructor del club aplique el mismo est&aacute;ndar.</p>

<h2>Gestiona los candidatos a examen</h2>
<p>Una vez definidos los requisitos, necesitas un mecanismo para identificar qui&eacute;n los cumple. Revisar manualmente el historial de cada alumno consume horas. En EntrenaDojo, el sistema cruza autom&aacute;ticamente la asistencia acumulada, el tiempo en el grado y las t&eacute;cnicas marcadas como superadas, y te muestra una lista de candidatos elegibles. Solo tienes que confirmar qui&eacute;n se presenta.</p>

<h2>Registra el resultado y actualiza el perfil</h2>
<p>Tras el examen, el resultado debe quedar registrado de inmediato. Si el alumno aprueba, su perfil se actualiza al nuevo grado y el contador de requisitos se reinicia para el siguiente nivel. Si no aprueba, conviene anotar las &aacute;reas de mejora para orientar su entrenamiento durante las pr&oacute;ximas semanas.</p>

<h2>Comunica el progreso al alumno</h2>
<p>La transparencia es clave para la retenci&oacute;n. Cuando el alumno puede consultar en cualquier momento cu&aacute;ntas clases le faltan o qu&eacute; t&eacute;cnicas necesita perfeccionar, su compromiso aumenta. Esta visibilidad tambi&eacute;n reduce las preguntas repetitivas al instructor, liberando tiempo para lo que realmente importa: ense&ntilde;ar.</p>

<h3>Un sistema que crece contigo</h3>
<p>Cada arte marcial tiene sus particularidades. Un club de judo no gestiona los grados igual que uno de taekwondo o de jiu-jitsu brasile&ntilde;o. Por eso es fundamental que la herramienta que elijas permita personalizar los niveles, los colores, los nombres y los criterios de forma flexible. EntrenaDojo est&aacute; dise&ntilde;ado precisamente para adaptarse a la estructura de grados de cualquier disciplina, sin forzarte a encajar en un molde gen&eacute;rico.</p>

<p>Invertir una tarde en configurar correctamente la progresi&oacute;n de cinturones te ahorrar&aacute; meses de confusi&oacute;n y har&aacute; que tus alumnos sientan que su esfuerzo tiene un camino claro hacia adelante.</p>`,
  },
  {
    slug: "pagos-dojo-efectivo-bizum-stripe",
    title: "Pagos en el dojo: efectivo, Bizum o Stripe &mdash; qu&eacute; funciona mejor",
    excerpt:
      "Comparamos los tres m&eacute;todos de cobro m&aacute;s utilizados en clubes de artes marciales en Espa&ntilde;a: efectivo, Bizum y Stripe. Ventajas, inconvenientes y cu&aacute;l elegir.",
    author: "Joel Castro",
    date: "2026-04-10",
    category: "pagos",
    tags: ["pagos", "stripe", "bizum", "efectivo", "finanzas"],
    content: `<p>Cobrar las cuotas es una de las tareas menos glamurosas de dirigir un dojo, pero tambi&eacute;n una de las m&aacute;s cr&iacute;ticas. Un sistema de cobro mal planteado genera morosidad, conversaciones inc&oacute;modas y horas perdidas persiguiendo pagos. Analicemos las tres opciones m&aacute;s habituales en clubes espa&ntilde;oles.</p>

<h2>Efectivo: simple pero opaco</h2>
<p>El pago en met&aacute;lico sigue siendo com&uacute;n en dojos peque&ntilde;os. Su principal ventaja es la inmediatez: el alumno paga, el instructor cobra, fin de la historia. Pero los inconvenientes son notables:</p>
<ul>
  <li>No queda un registro autom&aacute;tico; hay que anotarlo manualmente.</li>
  <li>Es dif&iacute;cil demostrar que un pago se realiz&oacute; si surge una discrepancia.</li>
  <li>Obliga al instructor a manejar cambio, guardar dinero y desplazarse al banco.</li>
</ul>
<p>Para un club con diez alumnos puede ser suficiente. Para cualquier cosa por encima de eso, se convierte en una fuente constante de fricci&oacute;n.</p>

<h2>Bizum: popular pero informal</h2>
<p>En Espa&ntilde;a, Bizum se ha convertido en el medio de pago preferido para transacciones entre particulares. Muchos dojos lo adoptan porque los alumnos ya lo usan a diario. Las ventajas son evidentes: es instant&aacute;neo, sin comisiones para el usuario y casi universal. Sin embargo, presenta limitaciones importantes para un negocio:</p>
<ul>
  <li>No genera facturas ni recibos formales.</li>
  <li>No permite domiciliar cobros recurrentes de forma autom&aacute;tica.</li>
  <li>El l&iacute;mite de recepci&oacute;n mensual puede ser un problema en clubes medianos.</li>
  <li>Conciliar decenas de transferencias individuales cada mes es tedioso.</li>
</ul>

<h2>Stripe: automatizado y profesional</h2>
<p>Stripe es una pasarela de pago pensada para negocios. Permite configurar suscripciones recurrentes, emitir recibos autom&aacute;ticos, gestionar reembolsos y ver toda la informaci&oacute;n financiera en un panel centralizado. Las comisiones (en torno al 1,5&nbsp;% + 0,25&nbsp;&euro; por transacci&oacute;n en Europa) son el precio de la automatizaci&oacute;n. Para la mayor&iacute;a de los clubes, el tiempo ahorrado compensa con creces ese coste.</p>

<h2>Entonces, &iquest;cu&aacute;l elegir?</h2>
<p>La respuesta corta: no tienes por qu&eacute; elegir solo uno. Muchos dojos combinan m&eacute;todos seg&uacute;n el perfil del alumno. Lo importante es que el sistema de gesti&oacute;n registre todos los pagos en un &uacute;nico lugar, independientemente del canal. EntrenaDojo permite registrar cobros en efectivo, anotar pagos por Bizum y conectar con Stripe para cuotas recurrentes automatizadas, todo desde el mismo panel.</p>

<h3>El verdadero coste de no automatizar</h3>
<p>Si dedicas tres horas al mes a perseguir cobros, revisar transferencias y cuadrar cuentas, eso supone 36 horas al a&ntilde;o. Tiempo que podr&iacute;as invertir en preparar clases, formarte o simplemente descansar. Automatizar los pagos no es un lujo; es una decisi&oacute;n de productividad que impacta directamente en la sostenibilidad de tu dojo.</p>`,
  },
  {
    slug: "qr-check-in-control-asistencia",
    title: "QR check-in: la manera m&aacute;s f&aacute;cil de controlar la asistencia",
    excerpt:
      "Descubre c&oacute;mo funciona el check-in por c&oacute;digo QR, por qu&eacute; supera a la lista en papel y qu&eacute; ventajas aporta a instructores y alumnos.",
    author: "Joel Castro",
    date: "2026-03-22",
    category: "asistencia",
    tags: ["qr", "check-in", "asistencia", "tecnologia"],
    content: `<p>Pasar lista al inicio de cada clase es un ritual que consume m&aacute;s tiempo del que parece. Entre que el instructor localiza la hoja, busca los nombres, anota las faltas y responde a los &laquo;&iquest;me has apuntado?&raquo;, pueden pasar cinco minutos que deber&iacute;an dedicarse al entrenamiento. El check-in por c&oacute;digo QR elimina toda esa fricci&oacute;n.</p>

<h2>&iquest;C&oacute;mo funciona?</h2>
<p>El concepto es sencillo:</p>
<ul>
  <li>El dojo imprime o muestra en pantalla un c&oacute;digo QR &uacute;nico para cada clase o franja horaria.</li>
  <li>El alumno llega, abre la c&aacute;mara de su m&oacute;vil y escanea el c&oacute;digo.</li>
  <li>La asistencia queda registrada autom&aacute;ticamente en el sistema, asociada al alumno, la clase y la fecha.</li>
</ul>
<p>No hace falta descargar ninguna aplicaci&oacute;n adicional: la c&aacute;mara nativa del tel&eacute;fono es suficiente. El proceso dura menos de cinco segundos por persona.</p>

<h2>Ventajas frente al m&eacute;todo tradicional</h2>
<p>La mejora m&aacute;s evidente es el ahorro de tiempo, pero hay beneficios menos obvios que marcan una gran diferencia a largo plazo:</p>
<ul>
  <li><strong>Sin errores de transcripci&oacute;n:</strong> no hay nombres mal escritos ni marcas ambiguas en una hoja arrugada.</li>
  <li><strong>Registro instant&aacute;neo:</strong> el dato est&aacute; disponible en tiempo real. El instructor puede consultar desde su m&oacute;vil cu&aacute;ntos alumnos han llegado incluso antes de salir al tatami.</li>
  <li><strong>Hist&oacute;rico completo:</strong> cada asistencia alimenta el perfil del alumno. Al final del mes, las estad&iacute;sticas se generan solas: porcentaje de asistencia, clases favoritas, rachas de entrenamiento.</li>
  <li><strong>Sin interrupciones tard&iacute;as:</strong> el alumno que llega con la clase empezada escanea el c&oacute;digo y se incorpora sin molestar. No necesita que el instructor interrumpa la explicaci&oacute;n para anotarlo.</li>
</ul>

<h2>&iquest;Y si un alumno no tiene m&oacute;vil?</h2>
<p>En la pr&aacute;ctica, es poco habitual, pero puede ocurrir con alumnos muy j&oacute;venes. En esos casos, el instructor o un compa&ntilde;ero puede registrar la asistencia manualmente desde el panel de EntrenaDojo. El sistema es flexible: el QR es la v&iacute;a principal, pero no la &uacute;nica.</p>

<h2>Seguridad y privacidad</h2>
<p>Una preocupaci&oacute;n razonable es si alguien podr&iacute;a compartir el c&oacute;digo y registrar asistencia sin estar presente. Para evitarlo, los c&oacute;digos pueden configurarse con validez temporal limitada o vincularse a la geolocalizaci&oacute;n del dojo, de modo que solo funcionen dentro del recinto.</p>

<h3>Del papel al dato</h3>
<p>Adoptar el check-in por QR no es solo una cuesti&oacute;n de modernidad. Es el paso que convierte la asistencia en informaci&oacute;n &uacute;til: datos que alimentan la progresi&oacute;n de cinturones, que detectan alumnos en riesgo de abandono y que permiten al instructor tomar decisiones basadas en hechos, no en impresiones. Es una de esas mejoras peque&ntilde;as que, una vez implementadas, te hacen preguntarte c&oacute;mo pod&iacute;as funcionar sin ella.</p>`,
  },
  {
    slug: "dojo-necesita-pagina-web-publica",
    title: "Por qu&eacute; tu dojo necesita una p&aacute;gina web p&uacute;blica",
    excerpt:
      "Los padres y futuros alumnos buscan en Google antes de visitar un dojo. Si tu club no aparece o no tiene una p&aacute;gina clara, est&aacute;s perdiendo inscripciones.",
    author: "Joel Castro",
    date: "2026-03-05",
    category: "tecnologia",
    tags: ["seo", "pagina-web", "presencia-online", "marketing"],
    content: `<p>Vivimos en una &eacute;poca en la que la primera impresi&oacute;n de un negocio se produce en una pantalla, no en la puerta. Esto aplica tambi&eacute;n a los dojos y clubes de artes marciales. Un padre que busca &laquo;clases de karate cerca de m&iacute;&raquo; espera encontrar resultados con horarios, precios orientativos y algo de informaci&oacute;n sobre el instructor. Si tu club no aparece, ese padre ir&aacute; al que s&iacute; lo hace.</p>

<h2>El problema de no tener presencia online</h2>
<p>Muchos dojos conf&iacute;an exclusivamente en el boca a boca. Es un canal valioso, pero insuficiente como &uacute;nica fuente de nuevos alumnos. Sin una p&aacute;gina web:</p>
<ul>
  <li>No apareces en las b&uacute;squedas de Google cuando alguien busca artes marciales en tu zona.</li>
  <li>Los interesados no pueden consultar horarios ni tarifas fuera del horario de atenci&oacute;n.</li>
  <li>No transmites la imagen profesional que los padres necesitan para confiar en que sus hijos estar&aacute;n en buenas manos.</li>
  <li>Dependes de redes sociales donde el algoritmo decide qui&eacute;n ve tu contenido.</li>
</ul>

<h2>Qu&eacute; debe incluir la p&aacute;gina de un dojo</h2>
<p>No necesitas un sitio web complejo. Una p&aacute;gina bien estructurada con la informaci&oacute;n esencial es m&aacute;s efectiva que un dise&ntilde;o espectacular sin contenido &uacute;til. Lo imprescindible:</p>
<ul>
  <li><strong>Nombre del club y disciplinas:</strong> que quede claro qu&eacute; se ense&ntilde;a.</li>
  <li><strong>Horarios actualizados:</strong> el dato que m&aacute;s buscan los visitantes. Si est&aacute;n desactualizados, generas desconfianza.</li>
  <li><strong>Ubicaci&oacute;n con mapa:</strong> facilita que te encuentren f&iacute;sicamente.</li>
  <li><strong>Informaci&oacute;n del instructor:</strong> experiencia, certificaciones, trayectoria. Genera credibilidad.</li>
  <li><strong>Forma de contacto:</strong> un formulario, un n&uacute;mero de tel&eacute;fono o un enlace a WhatsApp.</li>
</ul>

<h2>El factor Google</h2>
<p>Cuando tu dojo tiene una p&aacute;gina web con contenido relevante, Google puede indexarla y mostrarla en resultados locales. Esto significa aparecer cuando alguien busca &laquo;judo en Sevilla&raquo; o &laquo;taekwondo infantil en Vallecas&raquo;. Sin p&aacute;gina web propia, solo existes en Google si alguien ha creado una ficha de Google Business por ti, y a&uacute;n as&iacute;, la informaci&oacute;n ser&aacute; m&iacute;nima.</p>

<h2>La soluci&oacute;n: una p&aacute;gina integrada en tu herramienta de gesti&oacute;n</h2>
<p>Contratar un dise&ntilde;ador web o aprender a usar un constructor de p&aacute;ginas puede resultar caro o consumir un tiempo que no tienes. Por eso EntrenaDojo incluye una p&aacute;gina p&uacute;blica gratuita para cada club registrado. Se genera autom&aacute;ticamente a partir de la informaci&oacute;n que ya has introducido en el sistema: nombre, disciplinas, horarios y ubicaci&oacute;n. No necesitas conocimientos t&eacute;cnicos ni pagar un dominio adicional.</p>

<h3>Visibilidad es crecimiento</h3>
<p>Un dojo sin presencia online es un dojo invisible para la mayor&iacute;a de potenciales alumnos. La buena noticia es que dar ese paso no tiene por qu&eacute; ser complicado ni costoso. Con una p&aacute;gina clara, actualizada y bien posicionada en buscadores, tu club empieza a trabajar las 24 horas del d&iacute;a, atrayendo a personas que de otro modo nunca habr&iacute;an sabido que existes.</p>`,
  },
];
