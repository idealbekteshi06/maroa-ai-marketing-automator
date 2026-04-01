const tools = [
  { name: "Claude AI", color: "#D97757", icon: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full"><path d="M4.709 15.955l4.397-2.85-.769-1.358-5.398 3.237c-.905.543-.654 1.898.384 1.898h5.58v-1.569H5.247a.193.193 0 01-.096-.36l-.442.002zm7.28-11.7a.19.19 0 01.362.002l2.397 7.408h1.636L13.587 3.09c-.291-.9-1.567-.9-1.858 0L8.93 11.665h1.636l1.423-7.41zM19.291 15.955a.193.193 0 01-.096.36h-3.656v1.568h5.58c1.038 0 1.289-1.355.384-1.898l-5.398-3.237-.769 1.358 3.955 1.849z"/></svg>
  )},
  { name: "Flux AI", color: "#000000", icon: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
  )},
  { name: "n8n", color: "#EA4B71", icon: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full"><path d="M12.8 5.6c-1.1 0-2 .9-2 2v2.8H7.2V7.6c0-3.1 2.5-5.6 5.6-5.6s5.6 2.5 5.6 5.6v2.8h-3.6V7.6c0-1.1-.9-2-2-2zm-5.6 8v2.8c0 1.1.9 2 2 2s2-.9 2-2v-2.8h3.6v2.8c0 3.1-2.5 5.6-5.6 5.6s-5.6-2.5-5.6-5.6v-2.8h3.6z"/></svg>
  )},
  { name: "Replicate", color: "#262626", icon: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full"><rect x="4" y="2" width="4" height="20" rx="1"/><rect x="10" y="5" width="4" height="14" rx="1"/><rect x="16" y="8" width="4" height="8" rx="1"/></svg>
  )},
  { name: "Supabase", color: "#3ECF8E", icon: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full"><path d="M13.32 21.94c-.35.46-1.08.16-1.07-.42l.16-7.13H4.66c-.53 0-.82-.63-.49-1.04L10.68 2.06c.35-.46 1.08-.16 1.07.42l-.16 7.13h7.75c.53 0 .82.63.49 1.04L13.32 21.94z"/></svg>
  )},
  { name: "Stripe", color: "#635BFF", icon: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full"><path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-7.076-2.19l-.893 5.575C4.746 22.75 7.616 24 11.21 24c2.6 0 4.717-.678 6.22-1.918 1.635-1.348 2.46-3.293 2.46-5.724.014-4.357-2.527-5.876-5.914-7.208z"/></svg>
  )},
  { name: "Resend", color: "#000000", icon: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full"><path d="M2 4h10c3.314 0 6 2.686 6 6s-2.686 6-6 6H6v4H2V4zm4 8h6c1.105 0 2-.895 2-2s-.895-2-2-2H6v4zm10 4l4 4V16h-4z"/></svg>
  )},
  { name: "Pexels", color: "#05A081", icon: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full"><path d="M7 3h5.5C15.537 3 18 5.463 18 8.5S15.537 14 12.5 14H10v7H7V3zm3 4v4h2.5C13.88 11 15 9.88 15 8.5S13.88 6 12.5 6H10z"/></svg>
  )},
];

export function PoweredBy() {
  const doubled = [...tools, ...tools];

  return (
    <section className="border-t border-border py-10" style={{ backgroundColor: '#F7F8FA' }}>
      <div className="container mb-6">
        <h2 className="text-center text-lg font-semibold text-foreground">
          Powered by the world's best AI tools
        </h2>
        <p className="text-center text-sm text-muted-foreground mt-1">
          We combine the most powerful tools available to automate your marketing
        </p>
      </div>
      <div className="relative overflow-hidden">
        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-16 z-10 pointer-events-none" style={{ background: 'linear-gradient(to right, #F7F8FA, transparent)' }} />
        <div className="absolute right-0 top-0 bottom-0 w-16 z-10 pointer-events-none" style={{ background: 'linear-gradient(to left, #F7F8FA, transparent)' }} />

        <div className="flex animate-ticker whitespace-nowrap">
          {doubled.map((t, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5 mx-8 shrink-0">
              <div className="w-9 h-9 grayscale opacity-50" style={{ color: t.color }}>
                {t.icon}
              </div>
              <span className="text-[11px] font-medium text-muted-foreground">{t.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
