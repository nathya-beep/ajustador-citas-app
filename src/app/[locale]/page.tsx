import Link from "next/link";
import { getDictionary, isValidLocale, defaultLocale, type Locale } from "@/lib/i18n";
import { brand } from "@/lib/brand";
import { ContactButton } from "./ContactButton";

const Shield = () => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" /></svg>
);
const Check = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
);
const Clock = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
);
const icons = [
  <svg key="1" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="14" rx="2" /><path d="M8 21h8M12 18v3" /><path d="m7 10 3 3 5-5" /></svg>,
  <svg key="2" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>,
  <svg key="3" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></svg>,
  <svg key="4" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M9 15l2 2 4-4" /></svg>,
  <svg key="5" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="m9 12 2 2 4-4" /></svg>,
  <svg key="6" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M2 12h20M12 2a15 15 0 0 1 0 20 15 15 0 0 1 0-20z" /></svg>,
];

export default function LandingPage({ params }: { params: { locale: string } }) {
  const locale: Locale = isValidLocale(params.locale) ? params.locale : defaultLocale;
  const t = getDictionary(locale);
  const tel = `tel:${brand.phoneHref}`;
  const response = locale === "es" ? brand.responseEs : brand.responseEn;
  const services = [1, 2, 3, 4, 5, 6].map((i) => ({
    ic: icons[i - 1],
    title: t[`serv${i}t` as keyof typeof t] as string,
    desc: t[`serv${i}d` as keyof typeof t] as string,
  }));
  const steps = [1, 2, 3, 4].map((i) => ({
    title: t[`step${i}t` as keyof typeof t] as string,
    desc: t[`step${i}d` as keyof typeof t] as string,
  }));
  const faqs = [1, 2, 3, 4, 5].map((i) => ({
    q: t[`faq${i}q` as keyof typeof t] as string,
    a: t[`faq${i}a` as keyof typeof t] as string,
  }));

  return (
    <>
      <header className="topbar">
        <div className="topbar-in">
          <div className="logo"><span className="badge"><Shield /></span> {brand.name}</div>
          <nav className="topnav">
            <div className="lang-toggle">
              <Link href="/es" className={locale === "es" ? "on" : ""}>ES</Link>
              <Link href="/en" className={locale === "en" ? "on" : ""}>EN</Link>
            </div>
            <ContactButton locale={locale} className="btn btn-ghost btn-sm" label={t.contactCta} />
            <Link className="btn btn-ink btn-sm" href="/admin/login">{t.navPanel}</Link>
          </nav>
        </div>
      </header>

      {/* HERO */}
      <div className="hero">
        <div className="hero-in">
          <div>
            <span className="eyebrow">{t.heroEyebrow}</span>
            <h1>{t.heroTitlePre} <em>{t.heroTitleEm}</em></h1>
            <p className="sub">{t.heroLead}</p>
            <div className="hero-cta">
              <Link className="btn btn-primary" href={`/${locale}/schedule`}>{t.heroCta}</Link>
              <ContactButton locale={locale} className="btn btn-outline-light" label={t.contactCta} />
            </div>
            <div className="tel-note"><Clock /> <span>{t.heroResponsePre} <b>{response}</b> {t.heroResponsePost}</span></div>
            <div className="trustbar">
              <div className="ti"><b>{brand.years}</b><span>{t.tbYears}</span></div>
              <div className="ti"><b>{brand.inspections}</b><span>{t.tbInsp}</span></div>
              <div className="ti"><b>{brand.license}</b><span>{t.tbLicense}</span></div>
              <div className="ti"><b>ES / EN</b><span>{t.tbBilingual}</span></div>
            </div>
          </div>

          <div className="hero-card">
            <div className="hc-top"><b>{t.schedTitle}</b><span className="stamp">{locale === "es" ? "Sin costo" : "No cost"}</span></div>
            <div className="hc-body">
              <h3>{locale === "es" ? "Agenda en 3 pasos" : "Book in 3 steps"}</h3>
              <p>{t.schedSubtitle}</p>
              <ul className="hc-steps">
                <li><span className="num">1</span><span>{t.schedStep1.replace("1 · ", "")}</span></li>
                <li><span className="num">2</span><span>{t.schedStep2.replace("2 · ", "")}</span></li>
                <li><span className="num">3</span><span>{t.schedStep3.replace("3 · ", "")}</span></li>
              </ul>
              <Link className="btn btn-primary btn-block" href={`/${locale}/schedule`}>{t.heroCta}</Link>
              <div className="resp-note"><Check /> <span>{t.schedResponseNote}</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* SERVICIOS */}
      <section className="blk">
        <div className="wrap">
          <span className="eyebrow2">{t.servEyebrow}</span>
          <h2>{t.servTitle}</h2>
          <p className="lead">{t.servLead}</p>
          <div className="cards3">
            {services.map((s, i) => (
              <div className="feat" key={i}>
                <div className="ic">{s.ic}</div>
                <h4>{s.title}</h4>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROCESO */}
      <section className="blk banda">
        <div className="wrap">
          <span className="eyebrow2">{t.stepsEyebrow}</span>
          <h2>{t.stepsTitle}</h2>
          <p className="lead">{t.stepsLead}</p>
          <div className="pasos">
            {steps.map((s, i) => (
              <div className="paso" key={i}>
                <div className="n">{i + 1}</div>
                <h4>{s.title}</h4>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIOS */}
      <section className="blk">
        <div className="wrap">
          <span className="eyebrow2">{t.testEyebrow}</span>
          <h2>{t.testTitle}</h2>
          <p className="lead">{t.testLead}</p>
          <div className="tcards">
            <div className="tcard">
              <div className="stars">★★★★★</div>
              <blockquote>{t.test1q}</blockquote>
              <div className="who"><div className="av">MG</div><div><b>{t.test1n}</b><span>{t.test1r}</span></div></div>
            </div>
            <div className="tcard">
              <div className="stars">★★★★★</div>
              <blockquote>{t.test2q}</blockquote>
              <div className="who"><div className="av">JM</div><div><b>{t.test2n}</b><span>{t.test2r}</span></div></div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="blk alt">
        <div className="wrap" style={{ maxWidth: 760 }}>
          <span className="eyebrow2">{t.faqEyebrow}</span>
          <h2>{t.faqTitle}</h2>
          <div style={{ marginTop: 34 }}>
            {faqs.map((f, i) => (
              <details className="faq-item" key={i}>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="blk">
        <div className="wrap">
          <div className="cta-final">
            <h2>{t.ctaTitle}</h2>
            <p>{t.ctaSub}</p>
            <Link className="btn btn-primary" href={`/${locale}/schedule`}>{t.ctaBtn}</Link>
          </div>
        </div>
      </section>

      <footer>
        <div className="wrap foot-in">
          <div>
            <div className="logo"><span className="badge"><Shield /></span> {brand.name}</div>
            <p className="foot-legal">{t.footerTagline}</p>
            <p className="foot-legal">{t.footerLicense}: {brand.license} · {brand.phone}</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <a href={tel} style={{ fontSize: 16, fontWeight: 700 }}>{brand.phone}</a><br />
            <Link href="/admin/login" style={{ fontSize: 13 }}>{t.footerPanel}</Link>
          </div>
        </div>
      </footer>
    </>
  );
}
