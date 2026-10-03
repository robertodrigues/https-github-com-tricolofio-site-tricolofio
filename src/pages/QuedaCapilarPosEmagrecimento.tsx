import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, ChevronRight, Droplets, Instagram, MessageCircle, ShieldCheck, Sparkles, Sprout, UserRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Stage = "landing" | "quiz" | "processing" | "result";

const questions = [
  { id: "quando", title: "Quando você começou a perceber a queda?", options: ["Nas últimas semanas", "Há alguns meses", "Há mais de um ano", "Não sei dizer"], icon: Sparkles },
  { id: "mudanca", title: "O que mais chamou sua atenção no cabelo?", options: ["Cai muito ao lavar ou pentear", "Perdeu volume", "Está ficando mais fino", "Percebi falhas em uma região específica"], icon: UserRound },
  { id: "peso", title: "Você passou por uma mudança importante de peso recentemente?", options: ["Sim, nos últimos 3 meses", "Sim, entre 3 e 12 meses", "Sim, há mais de um ano", "Não passei por essa mudança"], icon: Sprout },
  { id: "alimentacao", title: "Como tem sido sua alimentação nesse período?", options: ["Tenho comido menos que antes", "Tenho dificuldade para consumir proteínas", "Minha alimentação mudou pouco", "Não sei avaliar"], icon: Sprout },
  { id: "couro", title: "Você percebe algum sinal no couro cabeludo?", options: ["Oleosidade excessiva", "Descamação ou coceira", "Dor ou sensibilidade", "Nenhum desses sinais"], icon: Droplets },
  { id: "regiao", title: "Onde você percebe mais mudanças?", options: ["No cabelo inteiro", "No topo da cabeça", "Na região frontal", "Em uma área localizada"], icon: UserRound },
  { id: "antes", title: "Antes dessa mudança, você já tinha queda ou afinamento?", options: ["Não", "Sim, uma queda leve", "Sim, um afinamento progressivo", "Não sei dizer"], icon: ShieldCheck },
] as const;

const QuedaCapilarPosEmagrecimento = () => {
  const [stage, setStage] = useState<Stage>("landing");
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const leadKey = "tricolofio_queda_capilar_lead_id";
  const current = questions[step];
  const Icon = current?.icon;

  const start = () => {
    setAnswers({});
    setStep(0);
    setStage("quiz");
    localStorage.removeItem(leadKey);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const saveStart = (answer: string) => {
    const id = crypto.randomUUID();
    localStorage.setItem(leadKey, id);
    const params = new URLSearchParams(window.location.search);
    void supabase.from("quiz_leads").insert({
      id,
      variante_quiz: "queda-capilar-pos-emagrecimento",
      status: "iniciado",
      respostas: { quando: answer },
      utm_source: params.get("utm_source"),
      utm_medium: params.get("utm_medium"),
      utm_campaign: params.get("utm_campaign"),
      utm_term: params.get("utm_term"),
      utm_content: params.get("utm_content"),
      gclid: params.get("gclid"),
      landing_page: window.location.href,
      user_agent: navigator.userAgent,
    }).then(() => undefined);
  };

  const updateLead = (status: "concluido" | "whatsapp_clicado", resultado: string) => {
    const id = localStorage.getItem(leadKey);
    if (!id) return;
    void supabase.from("quiz_leads").update({ status, resultado, respostas: answers, variante_quiz: "queda-capilar-pos-emagrecimento" }).eq("id", id);
  };

  const choose = (answer: string) => {
    if (step === 0) saveStart(answer);
    const next = { ...answers, [current.id]: answer };
    setAnswers(next);
    if (step === questions.length - 1) setStage("processing");
    else setStep(step + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const result = useMemo(() => {
    const specific = answers.mudanca === "Percebi falhas em uma região específica" || answers.regiao === "Em uma área localizada" || answers.antes === "Sim, um afinamento progressivo";
    const persistent = answers.quando === "Há mais de um ano" || answers.mudanca === "Perdeu volume" || answers.mudanca === "Está ficando mais fino";
    const title = specific ? "Padrão que merece investigação específica" : persistent ? "Queda que merece acompanhamento" : "Alteração capilar após uma mudança recente";
    const descriptions: Record<string, string> = {
      "Padrão que merece investigação específica": "Suas respostas indicam uma alteração localizada ou progressiva que merece uma avaliação individualizada. Diferentes fatores podem influenciar o crescimento e a densidade dos fios, por isso observar o padrão é um primeiro passo importante.",
      "Queda que merece acompanhamento": "Suas respostas indicam uma alteração que permanece ao longo do tempo ou veio acompanhada de perda de volume. Uma avaliação profissional pode ajudar a entender o comportamento dos fios e direcionar os próximos passos.",
      "Alteração capilar após uma mudança recente": "Suas respostas mostram uma alteração percebida após mudanças recentes na rotina, no peso ou na alimentação. Uma avaliação capilar pode ajudar a observar o ciclo dos fios e identificar os fatores envolvidos.",
    };
    return { title, description: `${descriptions[title]}\n\nEsta é uma orientação educativa inicial e não substitui uma consulta ou avaliação profissional.` };
  }, [answers]);

  useEffect(() => {
    if (stage !== "processing") return;
    const timer = window.setTimeout(() => {
      updateLead("concluido", result.title);
      setStage("result");
    }, 1800);
    return () => window.clearTimeout(timer);
  }, [stage, result.title]);

  const whatsapp = `https://wa.me/5561982520582?text=${encodeURIComponent(`Olá! Fiz a avaliação educativa sobre queda capilar após uma mudança recente.\n\nResultado: ${result.title}\n\n${result.description}\n\nGostaria de agendar minha avaliação.`)}`;
  const back = () => step > 0 ? setStep(step - 1) : setStage("landing");

  return <main className="min-h-screen bg-[#fbfaf6] text-[#183c35]">
    <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-6 lg:px-10"><a href="/"><img className="w-[150px] rounded-lg" src="/logo-tricolofio.png" alt="Tricolofio Tricologia" /></a>{stage === "quiz" && <span className="text-xs font-semibold uppercase tracking-[.16em] text-[#67837a]">Avaliação Educativa</span>}</header>
    {stage === "landing" && <section className="hero-shell mx-auto grid min-h-[calc(100vh-90px)] max-w-6xl items-center gap-10 px-5 pb-12 pt-12 lg:grid-cols-[1.05fr_.95fr] lg:px-10"><div className="relative z-[1] max-w-xl animate-rise"><div className="eyebrow"><span className="eyebrow-dot" /> Avaliação educativa</div><h1 className="mt-6 text-[2.9rem] font-medium leading-[1.04] tracking-[-.055em] sm:text-6xl">Entenda melhor a sua <em>queda capilar</em> após uma mudança recente.</h1><p className="mt-7 max-w-lg text-lg leading-8 text-[#5b746d]">Faça uma avaliação educativa gratuita para observar mudanças na densidade, no volume e no ciclo dos fios.</p><button onClick={start} className="primary-button mt-9 w-full sm:w-auto">Fazer minha avaliação educativa <ArrowRight size={19} /></button></div><div className="hero-visual animate-float"><div className="organic-ring" /><div className="photo-card"><img src="/menina-tricologia.png" alt="Profissional de tricologia" /><div className="photo-caption"><span><strong>Biomédica Esteta Tricologista CRBM16081<br />Especialista em Estímulo de Crescimento Capilar e de Sobrancelhas.</strong></span></div></div><a href="https://www.instagram.com/edilaine_albuquerque" target="_blank" rel="noreferrer" className="leaf-note" aria-label="Instagram de Edilaine Albuquerque"><Instagram size={17} /><span>@edilaine_albuquerque</span></a></div></section>}
    {stage === "quiz" && <section className="quiz-shell mx-auto flex min-h-screen max-w-3xl flex-col px-5 pb-10 pt-8 lg:px-10"><div className="mb-10 flex items-center gap-4"><button onClick={back} className="icon-button" aria-label="Voltar"><ArrowLeft size={18} /></button><div className="flex-1"><div className="mb-2 flex justify-between text-xs font-bold uppercase tracking-[.13em] text-[#6b8880]"><span>Pergunta {step + 1} de {questions.length}</span><span>{Math.round(((step + 1) / questions.length) * 100)}%</span></div><div className="progress-track"><div className="progress-fill" style={{ width: `${((step + 1) / questions.length) * 100}%` }} /></div></div></div><div key={step} className="animate-rise flex flex-1 flex-col"><div className="question-icon"><Icon size={25} /></div><h2 className="mt-7 max-w-2xl text-3xl font-medium leading-[1.08] tracking-[-.045em] sm:text-5xl">{current.title}</h2><div className="mt-10 grid gap-3">{current.options.map((option, i) => <button key={option} onClick={() => choose(option)} className="option-button"><span className="option-number">{String(i + 1).padStart(2, "0")}</span><span>{option}</span><ChevronRight className="ml-auto text-[#99b0a8]" size={19} /></button>)}</div><p className="mt-auto pt-12 text-center text-xs text-[#91a59f]">Suas respostas são usadas somente para montar sua orientação inicial.</p></div></section>}
    {stage === "processing" && <section className="flex min-h-screen items-center justify-center px-5"><div className="max-w-md text-center animate-rise"><div className="loader-orbit mx-auto"><div className="loader-core"><Sparkles size={25} /></div></div><h2 className="mt-8 text-4xl font-medium">Organizando sua orientação educativa.</h2></div></section>}
    {stage === "result" && <section className="result-shell mx-auto min-h-screen max-w-5xl px-5 pb-16 pt-12 lg:px-10"><div className="animate-rise"><span className="eyebrow"><span className="eyebrow-dot" /> Sua leitura inicial</span><h2 className="mt-5 max-w-2xl text-4xl font-medium leading-[1.07] tracking-[-.05em] sm:text-6xl">Um olhar educativo para o seu momento.</h2><div className="profile-card mt-12"><span className="card-label">Seu perfil sugere</span><h3>{result.title}</h3><p className="whitespace-pre-line">{result.description}</p></div><div className="cta-card mt-5"><div className="cta-copy"><span className="cta-spark"><MessageCircle size={20} /></span><div><h3>Converse com nossa equipe.</h3><p>A avaliação completa ajuda a entender seus próximos passos.</p></div></div><a href={whatsapp} target="_blank" rel="noreferrer" onClick={() => updateLead("whatsapp_clicado", result.title)} className="whatsapp-button"><MessageCircle size={21} fill="currentColor" /> Receber no WhatsApp <ArrowRight size={17} /></a></div><button onClick={start} className="restart-link">Refazer avaliação</button></div></section>}
    <footer className="site-footer"><div className="footer-inner"><div className="footer-brand"><img src="/logo-tricolofio.png" alt="Tricolofio Tricologia" /><p>Cuidado especializado para você se sentir bem com o seu cabelo.</p><p className="footer-technical">Edilaine Albuquerque — Biomédica Esteta Tricologista — CRBM 16081</p><a href="https://www.instagram.com/edilaine_albuquerque" target="_blank" rel="noreferrer" className="footer-social"><Instagram size={17} /> @edilaine_albuquerque</a></div><div className="footer-column"><span>Explore</span><a href="/">Início</a><button onClick={start}>Avaliação Educativa</button><a href={whatsapp} target="_blank" rel="noreferrer">Fale conosco</a></div><div className="footer-column"><span>Atendimento</span><p>Quadra QR 2 Módulo 1 Sala 104 - Candangolândia,<br />Brasília - DF, 71725-211</p><a href="tel:+5561982520582">(61) 9 8252-0582</a><a href="mailto:contato@tricolofio.com.br">contato@tricolofio.com.br</a></div></div><div className="footer-bottom"><span>© {new Date().getFullYear()} Tricolofio Tricologia.</span><div className="footer-legal-links"><a href="/politica-de-privacidade">Política de Privacidade</a><a href="/termos-de-uso">Termos de Uso</a></div></div></footer>
  </main>;
};

export default QuedaCapilarPosEmagrecimento;
