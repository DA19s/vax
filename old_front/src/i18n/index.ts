import { useSettings } from "@/context/SettingsContext";

// Minimal dictionary-based i18n. Extend with more keys as needed.
const dict = {
  fr: {
    welcome: "Bienvenue, {role}",
    create_campaign: "Créer une campagne",
    add_health_center: "Ajouter un centre de santé",
    new_appointment: "Nouveau rendez-vous",
    view_profile: "Voir profil",
    logout: "Déconnexion",
  },
  en: {
    welcome: "Welcome, {role}",
    create_campaign: "Create campaign",
    add_health_center: "Add a health center",
    new_appointment: "New appointment",
    view_profile: "View profile",
    logout: "Logout",
  },
} as const;

type Lang = keyof typeof dict;
type TKey = keyof typeof dict["fr"];
type Vars = Record<string, string | number>;

export function useT() {
  const { settings } = useSettings();
  const lang: Lang = (settings?.language as Lang) || "fr";

  return (key: TKey, vars: Vars = {}): string => {
    // Widen to string to avoid literal type narrowing issues
    const frDict = dict.fr as Record<string, string>;
    const curDict = dict[lang] as unknown as Record<string, string>;
    const fallback = frDict[key as string] ?? String(key);
    let template: string = curDict[key as string] ?? fallback;
    for (const [k, v] of Object.entries(vars)) {
      template = template.replace(`{${k}}`, String(v));
    }
    return template;
  };
}
