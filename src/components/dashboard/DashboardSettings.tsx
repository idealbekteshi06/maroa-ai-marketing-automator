import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const tabs = ["Profile", "Billing", "Notifications"];

export default function DashboardSettings() {
  const [activeTab, setActiveTab] = useState("Profile");

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <div className="flex gap-1 rounded-xl bg-muted p-1">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "Profile" && (
        <div className="space-y-4 rounded-2xl bg-card p-6">
          <div><Label>Business name</Label><Input defaultValue="Bloom Bakery" /></div>
          <div><Label>Email</Label><Input defaultValue="sarah@bloombakery.com" /></div>
          <div><Label>Location</Label><Input defaultValue="Austin, TX" /></div>
          <div><Label>Industry</Label><Input defaultValue="Bakery" /></div>
          <Button>Save changes</Button>

          <div className="mt-8 rounded-2xl border border-destructive/20 p-6">
            <h3 className="font-semibold text-destructive">Danger zone</h3>
            <p className="mt-1 text-sm text-muted-foreground">Permanently delete your account and all data.</p>
            <Button variant="destructive" size="sm" className="mt-4">Delete account</Button>
          </div>
        </div>
      )}

      {activeTab === "Billing" && (
        <div className="rounded-2xl bg-card p-6">
          <h3 className="font-semibold text-card-foreground">Current Plan</h3>
          <div className="mt-4 flex items-center justify-between rounded-xl bg-muted p-4">
            <div>
              <p className="font-medium text-foreground">Growth Plan</p>
              <p className="text-sm text-muted-foreground">$49/month · Next billing: April 23, 2026</p>
            </div>
            <Button variant="outline" size="sm">Change plan</Button>
          </div>
        </div>
      )}

      {activeTab === "Notifications" && (
        <div className="space-y-4 rounded-2xl bg-card p-6">
          {["Weekly performance report", "Content ready for approval", "Ad campaign updates", "Competitor insights"].map((n) => (
            <div key={n} className="flex items-center justify-between">
              <span className="text-sm text-card-foreground">{n}</span>
              <label className="relative inline-flex cursor-pointer items-center">
                <input type="checkbox" defaultChecked className="peer sr-only" />
                <div className="h-6 w-11 rounded-full bg-muted peer-checked:bg-primary after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-background after:transition-all peer-checked:after:translate-x-full" />
              </label>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
