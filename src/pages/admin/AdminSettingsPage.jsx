
import { useEffect, useState } from "react";
import { authApi, getErrorMessage } from "../../lib/api";
import {
  UserRound,
  Bell,
  BrainCircuit,
  SlidersHorizontal,
  Save,
  ShieldCheck,
  Check,
  Sparkles,
  Info,
} from "lucide-react";

const settingSections = [
  { id: "profile", label: "Profile", icon: UserRound },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "ai", label: "AI & Automation", icon: BrainCircuit },
  {
    id: "support",
    label: "Support Preferences",
    icon: SlidersHorizontal,
  },
];

function SettingToggle({ checked, onChange, disabled = false }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${
        checked ? "bg-[#6B2D3C]" : "bg-[#D6CEC5]"
      } ${disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
    >
      <span
        className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

function ToggleRow({
  title,
  description,
  checked,
  onChange,
  disabled = false,
}) {
  return (
    <div className="flex items-start justify-between gap-5 py-5">
      <div className="min-w-0">
        <h4 className="text-sm font-medium text-[#2B2B2B]">
          {title}
        </h4>

        <p className="mt-1 text-xs leading-5 text-[#82756B]">
          {description}
        </p>
      </div>

      <SettingToggle
        checked={checked}
        onChange={onChange}
        disabled={disabled}
      />
    </div>
  );
}

function SettingsCard({ title, description, children }) {
  return (
    <section className="overflow-hidden rounded-2xl border border-[#2B2B2B]/10 bg-white shadow-sm">
      <div className="border-b border-[#2B2B2B]/10 px-5 py-5 sm:px-6">
        <h2 className="font-serif text-xl font-semibold text-[#2B2B2B]">
          {title}
        </h2>

        {description && (
          <p className="mt-1.5 text-xs leading-5 text-[#82756B]">
            {description}
          </p>
        )}
      </div>

      <div className="px-5 sm:px-6">{children}</div>
    </section>
  );
}

function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-[#2B2B2B]">
        {label}
      </span>

      <div className="mt-2">{children}</div>

      {hint && (
        <span className="mt-1.5 block text-[11px] leading-5 text-[#82756B]">
          {hint}
        </span>
      )}
    </label>
  );
}

const inputClass =
  "h-11 w-full rounded-lg border border-[#2B2B2B]/15 bg-white px-3 text-sm text-[#2B2B2B] outline-none transition placeholder:text-[#A39A92] focus:border-[#6B2D3C] focus:ring-2 focus:ring-[#6B2D3C]/10";

export default function AdminSettingsPage() {
  const [activeSection, setActiveSection] = useState("profile");

  const [profile, setProfile] = useState({
    name: "BookLeaf Admin",
    email: "admin@bookleaf.example",
    role: "Support Administrator",
    timezone: "Asia/Kolkata",
  });

  const [notifications, setNotifications] = useState({
    urgentTickets: true,
    unassignedTickets: true,
    statusChanges: true,
    dailySummary: false,
    aiReviewRequired: true,
  });

  const [aiSettings, setAiSettings] = useState({
    enabled: true,
    classifyTickets: true,
    suggestPriority: true,
    draftResponses: true,
    requireReview: true,
  });

  const [supportSettings, setSupportSettings] = useState({
    defaultPriority: "medium",
    overdueHours: "24",
    defaultAssignment: "unassigned",
    includeTicketId: true,
    showKnowledgeHints: true,
  });

  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function loadSettings() {
      try {
        const stored = window.localStorage.getItem("bookleaf-admin-settings");
        if (stored && active) {
          const parsed = JSON.parse(stored);
          if (parsed.notifications) setNotifications((current) => ({ ...current, ...parsed.notifications }));
          if (parsed.aiSettings) setAiSettings((current) => ({ ...current, ...parsed.aiSettings }));
          if (parsed.supportSettings) setSupportSettings((current) => ({ ...current, ...parsed.supportSettings }));
          if (parsed.profile) setProfile((current) => ({ ...current, ...parsed.profile }));
        }
        const response = await authApi.me();
        if (!active) return;
        const payload = response.data?.data ?? response.data ?? {};
        const user = payload.user ?? payload;
        setProfile((current) => ({
          ...current,
          name: user.name ?? user.full_name ?? current.name,
          email: user.email ?? current.email,
          role: user.role ?? current.role,
        }));
      } catch (err) {
        if (active && err?.response?.status !== 401 && err?.response?.status !== 403) {
          setError(getErrorMessage(err, "Unable to load admin account details."));
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    loadSettings();
    return () => { active = false; };
  }, []);

  function updateObject(setter, key, value) {
    setter((current) => ({ ...current, [key]: value }));
    setSaved(false);
  }

  function handleSave() {
    setSaving(true);
    setError("");
    try {
      window.localStorage.setItem("bookleaf-admin-settings", JSON.stringify({
        profile,
        notifications,
        aiSettings,
        supportSettings,
      }));
      setSaved(true);
      window.setTimeout(() => setSaved(false), 3000);
    } catch {
      setError("Unable to save preferences in this browser.");
    } finally {
      setSaving(false);
    }
  }

  const activeTitle =
    settingSections.find((section) => section.id === activeSection)?.label ??
    "Settings";

  return (
    <div className="space-y-8">
      {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {loading && <div className="rounded-xl border border-[#2B2B2B]/10 bg-white px-4 py-3 text-sm text-[#82756B]">Loading admin account…</div>}
      {}
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-3 flex items-center gap-2 text-xs text-[#82756B]">
            <span>Admin</span>
            <span>/</span>
            <span>Resources</span>
          </div>

          <h1 className="font-serif text-3xl font-semibold tracking-tight text-[#2B2B2B] sm:text-4xl">
            Settings
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#82756B]">
            Manage your admin preferences, support workflow, and AI
            assistance options.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex h-11 items-center justify-center gap-2 self-start rounded-xl bg-[#6B2D3C] px-5 text-sm font-semibold text-white transition hover:bg-[#542330] sm:self-auto"
        >
          {saved ? <Check size={16} /> : <Save size={16} />}
          {saving ? "Saving…" : saved ? "Saved in this browser" : "Save changes"}
        </button>
      </section>

      {}
      <div className="flex items-start gap-3 rounded-xl border border-[#C9A227]/30 bg-[#C9A227]/[0.08] p-4">
        <Info size={17} className="mt-0.5 shrink-0 text-[#8A6B10]" />

       <p className="text-xs leading-5 text-[#655B54]">
  <span className="font-semibold">Saved locally:</span> These preferences are stored in this browser only. They do not affect the database and are not saved to the server.
</p>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        {}
        <aside className="rounded-2xl border border-[#2B2B2B]/10 bg-white p-3">
          <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-[#82756B]">
            Preferences
          </p>

          <nav className="space-y-1">
            {settingSections.map((section) => {
              const Icon = section.icon;
              const active = activeSection === section.id;

              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => setActiveSection(section.id)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-xs font-medium transition ${
                    active
                      ? "bg-[#6B2D3C] text-white"
                      : "text-[#655B54] hover:bg-[#F5EFE6] hover:text-[#6B2D3C]"
                  }`}
                >
                  <Icon size={16} />
                  {section.label}
                </button>
              );
            })}
          </nav>

          <div className="mt-5 rounded-xl bg-[#FAF7F2] p-4">
            <ShieldCheck size={20} className="text-[#3D6B4F]" />

            <p className="mt-3 text-xs font-semibold text-[#2B2B2B]">
              Account security
            </p>

            <p className="mt-1 text-[11px] leading-5 text-[#82756B]">
              Admin permissions must be enforced by the backend.
            </p>
          </div>
        </aside>

        {}
        <div className="min-w-0 space-y-6">
          <div>
            <h2 className="font-serif text-2xl font-semibold text-[#2B2B2B]">
              {activeTitle}
            </h2>

            <p className="mt-1 text-xs text-[#82756B]">
              Update your {activeTitle.toLowerCase()} preferences.
            </p>
          </div>

          {}
          {activeSection === "profile" && (
            <>
              <SettingsCard
                title="Admin profile"
                description="Your identity within the BookLeaf support workspace."
              >
                <div className="flex flex-col gap-5 border-b border-[#2B2B2B]/10 py-5 sm:flex-row sm:items-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#6B2D3C] font-serif text-2xl font-semibold text-white">
                    {profile.name
                      .split(" ")
                      .map((part) => part[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>

                  <div>
                    <p className="font-serif text-lg font-semibold text-[#2B2B2B]">
                      {profile.name}
                    </p>

                    <p className="mt-1 text-xs text-[#82756B]">
                      {profile.email}
                    </p>

                    <span className="mt-2 inline-flex rounded-full bg-[#3D6B4F]/10 px-2.5 py-1 text-[10px] font-medium text-[#3D6B4F]">
                      {profile.role}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-5 py-6 sm:grid-cols-2">
                  <Field label="Full name">
                    <input
                      value={profile.name}
                      onChange={(event) =>
                        updateObject(setProfile, "name", event.target.value)
                      }
                      className={inputClass}
                    />
                  </Field>

                  <Field label="Email address">
                    <input
                      type="email"
                      value={profile.email}
                      onChange={(event) =>
                        updateObject(setProfile, "email", event.target.value)
                      }
                      className={inputClass}
                    />
                  </Field>

                  <Field label="Role">
                    <input
                      value={profile.role}
                      readOnly
                      className={`${inputClass} bg-[#FAF7F2]`}
                    />
                  </Field>

                  <Field label="Timezone">
                    <select
                      value={profile.timezone}
                      onChange={(event) =>
                        updateObject(
                          setProfile,
                          "timezone",
                          event.target.value
                        )
                      }
                      className={inputClass}
                    >
                      <option value="Asia/Kolkata">
                        India Standard Time
                      </option>
                      <option value="UTC">UTC</option>
                      <option value="Europe/London">
                        Europe/London
                      </option>
                      <option value="America/New_York">
                        America/New_York
                      </option>
                    </select>
                  </Field>
                </div>
              </SettingsCard>

              <SettingsCard
                title="Security"
                description="Security actions require backend support."
              >
                <div className="flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#2B2B2B]">
                      Password and authentication
                    </p>

                    <p className="mt-1 text-xs leading-5 text-[#82756B]">
                      Password changes and session management should use
                      authenticated backend endpoints.
                    </p>
                  </div>

                  <span className="shrink-0 rounded-lg border border-[#2B2B2B]/10 px-3 py-2 text-[10px] text-[#82756B]">
                    Backend required
                  </span>
                </div>
              </SettingsCard>
            </>
          )}

          {}
          {activeSection === "notifications" && (
            <SettingsCard
              title="Notification preferences"
              description="Choose which support events should notify the admin."
            >
              {[
                {
                  key: "urgentTickets",
                  title: "Urgent tickets",
                  description:
                    "Receive notifications when an urgent ticket is created.",
                },
                {
                  key: "unassignedTickets",
                  title: "Unassigned tickets",
                  description:
                    "Get notified about incoming tickets without an owner.",
                },
                {
                  key: "statusChanges",
                  title: "Ticket status changes",
                  description:
                    "Receive updates when the status of a ticket changes.",
                },
                {
                  key: "dailySummary",
                  title: "Daily support summary",
                  description:
                    "Receive a summary of ticket volume and outstanding work.",
                },
                {
                  key: "aiReviewRequired",
                  title: "AI drafts awaiting review",
                  description:
                    "Get notified when an AI-generated response needs approval.",
                },
              ].map((item, index) => (
                <div
                  key={item.key}
                  className={
                    index !== 4
                      ? "border-b border-[#2B2B2B]/10"
                      : ""
                  }
                >
                  <ToggleRow
                    title={item.title}
                    description={item.description}
                    checked={notifications[item.key]}
                    onChange={(value) =>
                      updateObject(setNotifications, item.key, value)
                    }
                  />
                </div>
              ))}
            </SettingsCard>
          )}

          {}
          {activeSection === "ai" && (
            <>
              <SettingsCard
                title="AI assistance"
                description="Control the AI features used to support ticket handling."
              >
                <div className="flex items-start gap-3 border-b border-[#2B2B2B]/10 py-5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#6B2D3C]/10 text-[#6B2D3C]">
                    <Sparkles size={19} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-[#2B2B2B]">
                      AI support assistant
                    </h3>

                    <p className="mt-1 text-xs leading-5 text-[#82756B]">
                      Enable AI-assisted classification and response
                      preparation.
                    </p>
                  </div>

                  <SettingToggle
                    checked={aiSettings.enabled}
                    onChange={(value) =>
                      updateObject(setAiSettings, "enabled", value)
                    }
                  />
                </div>

                {[
                  {
                    key: "classifyTickets",
                    title: "Automatic ticket classification",
                    description:
                      "Suggest the relevant support category from the ticket content.",
                  },
                  {
                    key: "suggestPriority",
                    title: "Priority suggestions",
                    description:
                      "Suggest urgency based on the issue and potential impact.",
                  },
                  {
                    key: "draftResponses",
                    title: "AI response drafts",
                    description:
                      "Prepare suggested responses using the knowledge base and ticket context.",
                  },
                  {
                    key: "requireReview",
                    title: "Require admin review",
                    description:
                      "Require an admin to review and approve every AI-generated response.",
                  },
                ].map((item, index) => (
                  <div
                    key={item.key}
                    className={
                      index !== 3
                        ? "border-b border-[#2B2B2B]/10"
                        : ""
                    }
                  >
                    <ToggleRow
                      title={item.title}
                      description={item.description}
                      checked={aiSettings[item.key]}
                      disabled={!aiSettings.enabled}
                      onChange={(value) =>
                        updateObject(setAiSettings, item.key, value)
                      }
                    />
                  </div>
                ))}
              </SettingsCard>

              <div className="rounded-xl border border-[#C9A227]/30 bg-[#C9A227]/[0.08] p-4">
                <div className="flex items-start gap-3">
                  <Info
                    size={17}
                    className="mt-0.5 shrink-0 text-[#8A6B10]"
                  />

                  <div>
                    <p className="text-xs font-semibold text-[#2B2B2B]">
                      AI safety and configuration
                    </p>

                    <p className="mt-1 text-xs leading-5 text-[#82756B]">
                      These switches currently control the interface only.
                      Enforce the selected behavior on the backend, keep
                      API keys server-side, ground drafts in relevant
                      knowledge-base content, and require human approval
                      before sending a response.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          {}
          {activeSection === "support" && (
            <>
              <SettingsCard
                title="Ticket defaults"
                description="Choose default values for newly created support tickets."
              >
                <div className="grid grid-cols-1 gap-5 py-6 sm:grid-cols-2">
                  <Field
                    label="Default priority"
                    hint="Used when no priority has been determined."
                  >
                    <select
                      value={supportSettings.defaultPriority}
                      onChange={(event) =>
                        updateObject(
                          setSupportSettings,
                          "defaultPriority",
                          event.target.value
                        )
                      }
                      className={inputClass}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </Field>

                  <Field
                    label="Overdue threshold"
                    hint="Hours before a ticket is flagged for review."
                  >
                    <select
                      value={supportSettings.overdueHours}
                      onChange={(event) =>
                        updateObject(
                          setSupportSettings,
                          "overdueHours",
                          event.target.value
                        )
                      }
                      className={inputClass}
                    >
                      <option value="12">12 hours</option>
                      <option value="24">24 hours</option>
                      <option value="48">48 hours</option>
                      <option value="72">72 hours</option>
                    </select>
                  </Field>

                  <Field
                    label="Default assignment"
                    hint="Choose how incoming tickets should be handled."
                  >
                    <select
                      value={supportSettings.defaultAssignment}
                      onChange={(event) =>
                        updateObject(
                          setSupportSettings,
                          "defaultAssignment",
                          event.target.value
                        )
                      }
                      className={inputClass}
                    >
                      <option value="unassigned">
                        Leave unassigned
                      </option>
                      <option value="me">Assign to current admin</option>
                    </select>
                  </Field>
                </div>
              </SettingsCard>

              <SettingsCard
                title="Support interface"
                description="Configure helpful information displayed during ticket review."
              >
                <div className="border-b border-[#2B2B2B]/10">
                  <ToggleRow
                    title="Include ticket reference in responses"
                    description="Keep ticket identifiers visible for easier follow-up."
                    checked={supportSettings.includeTicketId}
                    onChange={(value) =>
                      updateObject(
                        setSupportSettings,
                        "includeTicketId",
                        value
                      )
                    }
                  />
                </div>

                <ToggleRow
                  title="Show knowledge-base hints"
                  description="Display relevant support guidance while reviewing tickets."
                  checked={supportSettings.showKnowledgeHints}
                  onChange={(value) =>
                    updateObject(
                      setSupportSettings,
                      "showKnowledgeHints",
                      value
                    )
                  }
                />
              </SettingsCard>
            </>
          )}

          {}
          <div className="flex flex-col gap-3 rounded-2xl border border-[#2B2B2B]/10 bg-white p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="text-xs leading-5 text-[#82756B]">
              Review your changes before saving your preferences.
            </p>

            <button
              type="button"
              onClick={handleSave}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#6B2D3C] px-4 text-xs font-semibold text-white transition hover:bg-[#542330]"
            >
              {saved ? <Check size={15} /> : <Save size={15} />}
              {saving ? "Saving…" : saved ? "Saved in this browser" : "Save changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}