import { MessageCircle } from "lucide-react";
import { directWhatsAppUrl, trackDirectWhatsAppClick } from "@/lib/whatsapp";

export const WhatsAppFloatingButton = () => (
  <a
    href={directWhatsAppUrl}
    target="_blank"
    rel="noreferrer"
    onClick={() => trackDirectWhatsAppClick("botao_flutuante")}
    className="whatsapp-floating"
    aria-label="Fale com a Dra. pelo WhatsApp"
  >
    <MessageCircle size={24} fill="currentColor" />
    <span>Fale com a Dra.</span>
  </a>
);
