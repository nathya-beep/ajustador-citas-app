export type Locale = "en" | "es";

export const locales: Locale[] = ["en", "es"];
export const defaultLocale: Locale = "es";

export const dictionary = {
  en: {
    // Compat / existentes
    heroTitle: "Fast, reliable insurance inspections",
    heroSubtitle: "Book your inspection appointment online in minutes.",
    scheduleCta: "Schedule an inspection",
    contactFormTitle: "Have a question? Contact us",

    // Navegación
    navBook: "Book",
    navPanel: "Adjuster login",
    navCall: "Call",

    // Hero
    heroEyebrow: "Licensed adjuster · Bilingual EN / ES",
    heroTitlePre: "Your damage inspection,",
    heroTitleEm: "booked today.",
    heroLead:
      "Request a visit from a professional adjuster to document the damage to your property or vehicle and move your claim forward — service in English or Spanish.",
    heroCta: "Book my inspection",
    heroCallLabel: "or call us",
    heroResponsePre: "We reply in under",
    heroResponsePost: "(business hours).",

    // Barra de confianza
    tbYears: "years of experience",
    tbInsp: "inspections completed",
    tbLicense: "state license",
    tbBilingual: "bilingual service",

    // Servicios
    servEyebrow: "What we offer",
    servTitle: "A clear inspection process, start to finish",
    servLead: "We document your damage thoroughly so your claim moves forward without delays.",
    serv1t: "Online booking 24/7",
    serv1d: "Request your inspection any time; get confirmation and follow-up without repeated calls.",
    serv2t: "Guaranteed appointment date",
    serv2d: "We set a real date at least 24 h ahead — no open-ended waiting.",
    serv3t: "Automated reminders",
    serv3d: "We remind you before the visit and follow up so nothing is left unresolved.",
    serv4t: "Documented report",
    serv4d: "A complete record of your damage that backs your claim with the insurer.",
    serv5t: "Professional & licensed",
    serv5d: "Certified adjuster with years of experience handling claims like yours.",
    serv6t: "Bilingual EN / ES service",
    serv6d: "We serve you in your language, with no misunderstandings that complicate your case.",

    // Proceso
    stepsEyebrow: "The process",
    stepsTitle: "From request to inspection, in 4 steps",
    stepsLead: "Simple and transparent. You just book; we handle the rest.",
    step1t: "You request",
    step1d: "Fill out the form with your details and type of damage.",
    step2t: "We contact you",
    step2d: "Within 2 hours we arrange a date and time with you.",
    step3t: "We inspect",
    step3d: "The adjuster visits and documents the damage in detail.",
    step4t: "Your claim advances",
    step4d: "You get the report that backs your case with the insurer.",

    // Testimonios
    testEyebrow: "Clients",
    testTitle: "What people who already booked say",
    testLead: "Real people whose claims moved forward after a professional inspection.",
    test1q:
      "\"After the storm I didn't know where to start. I booked in the morning and they called me the same day. Very professional inspection.\"",
    test1n: "María G.",
    test1r: "Water damage · Miami, FL",
    test2q:
      "\"Everything in English, on time, and the report had everything my insurance asked for. Highly recommend.\"",
    test2n: "John M.",
    test2r: "Roof damage · Fort Lauderdale, FL",

    // FAQ
    faqEyebrow: "Questions",
    faqTitle: "Frequently asked questions",
    faq1q: "How soon will an adjuster contact me?",
    faq1a: "We reply within 2 business hours of your request to arrange your inspection date.",
    faq2q: "Is service in English and Spanish?",
    faq2a: "Yes. All service runs in both languages; set your preference in the form and we'll serve you accordingly.",
    faq3q: "How far ahead should I book?",
    faq3a: "Inspections are scheduled at least 24 hours in advance to guarantee adjuster availability.",
    faq4q: "Is there a cost to request the inspection?",
    faq4a: "Requesting the appointment is free. The adjuster will confirm any service details when contacting you.",
    faq5q: "What if I can't make the scheduled day?",
    faq5a: "You can reschedule or cancel; the system notifies the adjuster and frees the slot automatically.",

    // CTA final
    ctaTitle: "Ready to book your inspection?",
    ctaSub: "Takes 30 seconds. We'll contact you today, in your language.",
    ctaBtn: "Book now",

    // Footer
    footerTagline: "Damage inspections for insurance claims · EN / ES",
    footerPanel: "Adjuster login →",
    footerLicense: "License",

    // Página de agendamiento
    schedTitle: "Book your inspection",
    schedSubtitle: "Pick a date, choose a time, and leave your details. We confirm today.",
    schedStep1: "1 · Pick a date",
    schedStep2: "2 · Choose a time",
    schedStep3: "3 · Your details",
    schedPickDate: "Inspection date",
    schedLoading: "Loading available times…",
    schedNoSlots: "No available times for this date. Try another day.",
    schedFirstName: "First name",
    schedLastName: "Last name",
    schedEmail: "Email",
    schedPhone: "Phone",
    schedConfirm: "Confirm appointment",
    schedSubmitting: "Confirming…",
    schedSuccessTitle: "Your appointment is confirmed!",
    schedSuccessBody: "We've sent you a confirmation. See you at your inspection.",
    schedResponseNote: "Free to book · Your data is protected",
    schedBack: "← Back to home",
    schedSelected: "Selected",
  },
  es: {
    // Compat / existentes
    heroTitle: "Inspecciones de seguros rápidas y confiables",
    heroSubtitle: "Agenda tu cita de inspección en línea en minutos.",
    scheduleCta: "Agendar una inspección",
    contactFormTitle: "¿Tienes una pregunta? Contáctanos",

    // Navegación
    navBook: "Agendar",
    navPanel: "Acceso ajustadores",
    navCall: "Llamar",

    // Hero
    heroEyebrow: "Ajustador con licencia · Bilingüe ES / EN",
    heroTitlePre: "Tu inspección de daños,",
    heroTitleEm: "agendada hoy.",
    heroLead:
      "Solicita la visita de un ajustador profesional para documentar los daños de tu propiedad o vehículo y mover tu reclamo — atención en español o inglés.",
    heroCta: "Agendar mi inspección",
    heroCallLabel: "o llámanos",
    heroResponsePre: "Respondemos en menos de",
    heroResponsePost: "hábiles.",

    // Barra de confianza
    tbYears: "años de experiencia",
    tbInsp: "inspecciones realizadas",
    tbLicense: "licencia estatal",
    tbBilingual: "atención bilingüe",

    // Servicios
    servEyebrow: "Qué ofrecemos",
    servTitle: "Un proceso de inspección claro, de principio a fin",
    servLead: "Documentamos tus daños con rigor para que tu reclamo avance sin demoras.",
    serv1t: "Agenda en línea 24/7",
    serv1d: "Solicita tu inspección a cualquier hora; recibes confirmación y seguimiento sin llamadas repetidas.",
    serv2t: "Cita con fecha garantizada",
    serv2d: "Coordinamos una fecha real con al menos 24 h de antelación; nada de esperas indefinidas.",
    serv3t: "Recordatorios automáticos",
    serv3d: "Te avisamos antes de la visita y damos seguimiento para que nada quede sin resolver.",
    serv4t: "Reporte documentado",
    serv4d: "Registro completo de tus daños que respalda tu reclamo ante la aseguradora.",
    serv5t: "Profesional y con licencia",
    serv5d: "Ajustador certificado con años de experiencia atendiendo reclamos como el tuyo.",
    serv6t: "Atención bilingüe ES / EN",
    serv6d: "Te atendemos en tu idioma, sin malentendidos que compliquen tu caso.",

    // Proceso
    stepsEyebrow: "El proceso",
    stepsTitle: "De la solicitud a la inspección, en 4 pasos",
    stepsLead: "Simple y transparente. Tú solo agendas; nosotros hacemos el resto.",
    step1t: "Solicitas",
    step1d: "Completas el formulario con tus datos y tipo de daño.",
    step2t: "Te contactamos",
    step2d: "En menos de 2 horas coordinamos fecha y hora contigo.",
    step3t: "Inspeccionamos",
    step3d: "El ajustador visita y documenta los daños en detalle.",
    step4t: "Avanza tu reclamo",
    step4d: "Recibes el reporte que respalda tu caso ante la aseguradora.",

    // Testimonios
    testEyebrow: "Clientes",
    testTitle: "Lo que dicen quienes ya agendaron",
    testLead: "Personas reales cuyos reclamos avanzaron tras una inspección profesional.",
    test1q:
      "\"Después de la tormenta no sabía por dónde empezar. Agendé por la mañana y ese mismo día me llamaron. La inspección fue muy profesional.\"",
    test1n: "María G.",
    test1r: "Daños por agua · Miami, FL",
    test2q:
      "\"Everything in English, on time, and the report had everything my insurance asked for. Highly recommend.\"",
    test2n: "John M.",
    test2r: "Roof damage · Fort Lauderdale, FL",

    // FAQ
    faqEyebrow: "Dudas",
    faqTitle: "Preguntas frecuentes",
    faq1q: "¿Cuánto tarda en contactarme un ajustador?",
    faq1a: "Respondemos en menos de 2 horas hábiles desde que envías la solicitud para coordinar la fecha de tu inspección.",
    faq2q: "¿La atención es en inglés y español?",
    faq2a: "Sí. Toda la atención funciona en ambos idiomas; indica tu preferencia y así te atenderemos.",
    faq3q: "¿Con cuánta antelación debo agendar?",
    faq3a: "Las inspecciones se programan con al menos 24 horas de antelación para garantizar disponibilidad del ajustador.",
    faq4q: "¿Tiene costo solicitar la inspección?",
    faq4a: "Solicitar la cita es sin costo. El ajustador confirmará contigo cualquier detalle del servicio al contactarte.",
    faq5q: "¿Qué pasa si no puedo asistir el día agendado?",
    faq5a: "Puedes reprogramar o cancelar; el sistema notifica al ajustador y libera el horario automáticamente.",

    // CTA final
    ctaTitle: "¿Listo para agendar tu inspección?",
    ctaSub: "Tarda 30 segundos. Te contactamos hoy mismo, en tu idioma.",
    ctaBtn: "Agendar ahora",

    // Footer
    footerTagline: "Inspecciones de daños para reclamos de seguro · ES / EN",
    footerPanel: "Acceso ajustadores →",
    footerLicense: "Licencia",

    // Página de agendamiento
    schedTitle: "Agenda tu inspección",
    schedSubtitle: "Elige una fecha, escoge una hora y déjanos tus datos. Confirmamos hoy.",
    schedStep1: "1 · Elige la fecha",
    schedStep2: "2 · Escoge la hora",
    schedStep3: "3 · Tus datos",
    schedPickDate: "Fecha de inspección",
    schedLoading: "Cargando horarios disponibles…",
    schedNoSlots: "No hay horarios disponibles para esta fecha. Prueba otro día.",
    schedFirstName: "Nombre",
    schedLastName: "Apellido",
    schedEmail: "Correo",
    schedPhone: "Teléfono",
    schedConfirm: "Confirmar cita",
    schedSubmitting: "Confirmando…",
    schedSuccessTitle: "¡Tu cita está confirmada!",
    schedSuccessBody: "Te enviamos una confirmación. Nos vemos en tu inspección.",
    schedResponseNote: "Agendar es gratis · Tus datos están protegidos",
    schedBack: "← Volver al inicio",
    schedSelected: "Seleccionado",
  },
} as const;

export function getDictionary(locale: Locale) {
  return dictionary[locale] ?? dictionary[defaultLocale];
}

export function isValidLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}
