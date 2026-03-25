const insights = [
  { competitor: "Sweet Crumbs Bakery", insight: "Launched a TikTok series 'Day in the life of a baker' — averaging 12K views per video.", recommendation: "Consider starting a similar behind-the-scenes series on TikTok." },
  { competitor: "Urban Bakes", insight: "Running a 20% off first order ad campaign on Instagram with carousel format.", recommendation: "Test a similar offer with your unique brand voice. Carousel ads perform 2x better." },
  { competitor: "The Flour Shop", insight: "Posting 2x daily on Instagram with heavy use of Reels.", recommendation: "Increase your posting frequency to at least once daily and incorporate more Reels." },
];

export default function DashboardCompetitors() {
  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <p className="text-sm text-muted-foreground">AI-powered insights on what your competitors are doing.</p>
      <div className="space-y-4">
        {insights.map((ins, i) => (
          <div key={i} className="rounded-2xl bg-card p-6">
            <p className="text-xs font-medium text-primary">{ins.competitor}</p>
            <p className="mt-2 text-sm text-card-foreground">{ins.insight}</p>
            <div className="mt-4 rounded-xl bg-primary/5 p-4">
              <p className="text-xs font-medium text-primary">💡 Recommendation</p>
              <p className="mt-1 text-sm text-card-foreground">{ins.recommendation}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
