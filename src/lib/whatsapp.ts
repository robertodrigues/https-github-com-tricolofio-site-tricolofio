import { supabase } from "@/integrations/supabase/client";

export const WHATSAPP_NUMBER = "5561982520582";
export const DIRECT_WHATSAPP_MESSAGE = "Olá! Vim pelo site da Tricolofio e gostaria de agendar uma consulta.";

const getAttribution = () => {
  const current = new URLSearchParams(window.location.search);
  const stored = JSON.parse(sessionStorage.getItem("tricolofio_utm_attribution") || "{}");
  const values = {
    utm_source: current.get("utm_source") || stored.utm_source || null,
    utm_medium: current.get("utm_medium") || stored.utm_medium || null,
    utm_campaign: current.get("utm_campaign") || stored.utm_campaign || null,
    utm_term: current.get("utm_term") || stored.utm_term || null,
    utm_content: current.get("utm_content") || stored.utm_content || null,
    gclid: current.get("gclid") || stored.gclid || null,
  };
  sessionStorage.setItem("tricolofio_utm_attribution", JSON.stringify(values));
  return values;
};

export const directWhatsAppUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(DIRECT_WHATSAPP_MESSAGE)}`;

export const trackDirectWhatsAppClick = (origem: "botao_flutuante" | "rodape") => {
  const attribution = getAttribution();
  void supabase.from("cliques_whatsapp_direto").insert({
    origem,
    pagina: window.location.pathname,
    ...attribution,
    landing_page: window.location.href,
    user_agent: navigator.userAgent,
  }).then(() => undefined);
};
