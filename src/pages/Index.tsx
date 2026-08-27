import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  Clock3,
  Droplets,
  Leaf,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Sprout,
  UserRound,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Stage = "landing" | "quiz" | "processing" | "result";
type Answer = string;

const questions = [
  { id: "tempo", eyebrow: "Seu momento", title: "Há quanto tempo você percebe a queda?", options: ["Há menos de 3 meses", "Entre 3 e 12 meses", "Há mais de 1 ano"], icon: Clock3 },
  { id: "tipo", eyebrow: "Como está o seu cabelo?", title: "Como está o seu cabelo?", options: ["Com queda intensa, com fios inteiros", "Afinamento do cabelo e percebe perda de densidade", "Falhas em áreas específicas"], icon: Sprout },
  { id: "couro", eyebrow: "Sinais que você percebe no seu cabelo", title: "Sinais que você percebe no seu cabelo?", options: ["Oleosidade, coceira, descamação ou dor no couro cabeludo", "Só descamação", "Não percebo nada disso"], icon: Droplets },
  { id: "regiao", eyebrow: "Onde você percebe mais mudança no seu cabelo", title: "Onde você percebe mais mudança no seu cabelo?", options: ["Falhas nas entradas", "Couro cabeludo mais exposto no topo da cabeça", "Perda de densidade no cabelo todo"], icon: UserRound },
  { id: "hormonal", eyebrow: "Seu contexto", title: "Passou por alguma mudança recente na sua vida?", options: ["Estresse ou mudança hormonal", "Pós-parto", "Alimentação restrita ou emagrecimento rápido", "Não passei por nada assim"], icon: Leaf },
  { id: "exames", eyebrow: "Seu histórico", title: "Fez exames recentes para saber como está sua tireoide, taxas de vitaminas e minerais?", options: ["Sim", "Não"], icon: ShieldCheck },
  { id: "tentativas", eyebrow: "Sua jornada", title: "Você já procurou ajuda ou realizou algum tratamento?", options: ["Sim, usando shampoo e tônicos por conta própria", "Já usei medicamento, como finasterida e minoxidil", "Ainda não tentei"], icon: Sparkles },
  { id: "idade", eyebrow: "Para fechar", title: "Qual é a sua faixa etária?", options: ["Até 29 anos", "30 a 44 anos", "45 anos ou mais"], icon: UserRound },
] as const;

const Index = () => {
  const [stage, setStage] = useState<Stage>("landing");
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const CurrentIcon = questions[step].icon;
  const leadStorageKey = "tricolofio_quiz_lead_id";

  const startQuiz = () => {
    setAnswers({});
    setStep(0);
    setStage("quiz");
    try {
      localStorage.removeItem(leadStorageKey);
    } catch {
      /* localStorage may be unavailable */
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const updateLead = (
    status: "concluido" | "whatsapp_clicado",
    leadAnswers: Record<string, Answer>,
    leadResult?: string,
  ) => {
    let leadId: string | null = null;

    try {
      leadId = localStorage.getItem(leadStorageKey);
    } catch {
      return;
    }

    if (!leadId) return;

    void Promise.resolve(
      supabase
        .from("quiz_leads")
        .update({
          status,
          respostas: leadAnswers,
          ...(leadResult ? { resultado: leadResult } : {}),
        })
        .eq("id", leadId),
    ).catch(() => undefined);
  };

  const trackQuizStart = (firstAnswer: Answer) => {
    let existingLeadId: string | null = null;

    try {
      existingLeadId = localStorage.getItem(leadStorageKey);
    } catch {
      return;
    }

    if (existingLeadId) return;

    const leadId = crypto.randomUUID();

    try {
      localStorage.setItem(leadStorageKey, leadId);
    } catch {
      return;
    }

    const params = new URLSearchParams(window.location.search);

    void Promise.resolve(
      supabase.from("quiz_leads").insert({
        id: leadId,
        status: "iniciado",
        respostas: { tempo: firstAnswer },
        utm_source: params.get("utm_source"),
        utm_medium: params.get("utm_medium"),
        utm_campaign: params.get("utm_campaign"),
        user_agent: navigator.userAgent,
      }),
    ).catch(() => undefined);
  };

  const result = useMemo(() => {
    if (
      answers.hormonal === "Estresse ou mudança hormonal" ||
      answers.hormonal === "Pós-parto"
    ) {
      return {
        title: "Padrão compatível com eflúvio telógeno",
        description:
          "Seu perfil reúne sinais frequentemente associados a períodos de estresse ou alterações do organismo. Esse tipo de queda costuma ser difuso e pode aparecer algum tempo depois do gatilho.",
        accent: "fatores do organismo",
      };
    }

    if (
      answers.regiao === "Falhas nas entradas" ||
      answers.tipo === "Falhas em áreas específicas"
    ) {
      return {
        title: "Padrão de atenção concentrada",
        description:
          "As respostas indicam uma mudança mais localizada. Uma avaliação cuidadosa ajuda a entender o que está acontecendo e quais fatores podem estar envolvidos.",
        accent: "áreas específicas",
      };
    }

    return {
      title: "Padrão compatível com afinamento difuso",
      description:
        "Seu perfil sugere uma redução gradual de densidade, um padrão comum que pode estar associado a diferentes fatores. Investigar cedo ajuda a cuidar com mais clareza.",
      accent: "afinamento gradual",
    };
  }, [answers]);

  const markWhatsAppClicked = () =>
    updateLead("whatsapp_clicado", answers, result.title);

  const choose = (answer: string) => {
    const current = questions[step];

    if (step === 0) trackQuizStart(answer);

    const nextAnswers = { ...answers, [current.id]: answer };
    setAnswers(nextAnswers);

    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      setStage("processing");
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goBack = () => {
    if (step > 0) {
      setStep(step - 1);
    } else {
      setStage("landing");
    }
  };

  useEffect(() => {
    if (stage !== "processing") return;

    const timer = window.setTimeout(() => {
      updateLead("concluido", answers, result.title);
      setStage("result");
    }, 2400);

    return () => window.clearTimeout(timer);
  }, [stage]);

  const whatsappMessage = `Olá! Fiz minha avaliação capilar no site do Tricolofio.

Este é um resumo do que se passa comigo:

• Há quanto tempo percebo a queda: ${answers.tempo || "não informado"}
• Como está o meu cabelo: ${answers.tipo || "não informado"}
• Sinais que percebo: ${answers.couro || "não informado"}
• Onde percebo mais mudança: ${answers.regiao || "não informado"}
• Mudança recente na minha vida: ${answers.hormonal || "não informado"}
• Exames recentes: ${answers.exames || "não informado"}
• Ajuda ou tratamentos anteriores: ${answers.tentativas || "não informado"}
• Faixa etária: ${answers.idade || "não informado"}

Resultado educativo: ${result.title}.
${result.description}

Gostaria de agendar minha consulta.`;

  const whatsappUrl = `https://wa.me/5561993971572?text=${encodeURIComponent(
    whatsappMessage,
  )}`;

  return (
    <main className="min-h-screen bg-[#fbfaf6] text-[#183c35] selection:bg-[#dcece2]">
      <header className="absolute left-0 right-0 top-0 z-10 mx-auto flex max-w-6xl items-center justify-between px-5 py-6 lg:px-10">
        <div className="brand-mark">
          <img src="/logo-tricolofio.png" alt="Tricolofio Tricologia" />
        </div>
        {stage === "quiz" && (
          <span className="text-xs font-semibold uppercase tracking-[.16em] text-[#67837a]">
            Avaliação gratuita
          </span>
        )}
      </header>

      {stage === "landing" && (
        <section className="hero-shell mx-auto grid min-h-screen max-w-6xl items-center gap-10 px-5 pb-12 pt-28 lg:grid-cols-[1.05fr_.95fr] lg:px-10 lg:pt-20">
          <div className="relative z-[1] max-w-xl animate-rise">
            <div className="eyebrow">
              <span className="eyebrow-dot" /> Tricologia com acolhimento
            </div>
            <h1 className="mt-6 text-[2.9rem] font-medium leading-[1.04] tracking-[-.055em] sm:text-6xl lg:text-[5.25rem]">
              Sua queda de cabelo tem uma <em>causa.</em>
            </h1>
            <p className="mt-7 max-w-lg text-lg leading-8 text-[#5b746d]">
              Descubra o que o seu padrão pode estar sinalizando em uma
              avaliação capilar gratuita, feita em cerca de 2 minutos.
            </p>
            <button
              onClick={startQuiz}
              className="primary-button mt-9 w-full sm:w-auto"
            >
              Fazer minha avaliação gratuita <ArrowRight size={19} />
            </button>
            <div className="mt-8 flex items-center gap-3 text-sm text-[#67837a]">
              <div className="avatar-stack">
                <span>F</span>
                <span>M</span>
                <span>A</span>
              </div>
              <span>
                <strong className="text-[#315e53]">+2.400 avaliações</strong>
                <br />
                realizadas com cuidado
              </span>
            </div>
          </div>

          <div className="hero-visual animate-float">
            <div className="organic-ring" />
            <div className="photo-card">
              <img
                src="/menina-tricologia.png"
                alt="Profissional de tricologia usando jaleco branco"
              />
              <div className="photo-caption">
                <span className="caption-icon">
                  <Sparkles size={14} />
                </span>
                <span>
                  <strong>
                    Cuidado que começa
                    <br />
                    com escuta.
                  </strong>
                </span>
              </div>
            </div>
            <div className="leaf-note">
              <Leaf size={17} />
              <span>
                Um olhar para
                <br />
                <strong>o todo.</strong>
              </span>
            </div>
          </div>

          <div className="hero-footer lg:col-span-2">
            <span>Uma primeira clareza para o seu próximo passo</span>
            <span className="scroll-line" />
          </div>
        </section>
      )}

      {stage === "quiz" && (
        <section className="quiz-shell mx-auto flex min-h-screen max-w-3xl flex-col px-5 pb-10 pt-28 lg:px-10">
          <div className="mb-10 flex items-center gap-4">
            <button onClick={goBack} className="icon-button" aria-label="Voltar">
              <ArrowLeft size={18} />
            </button>
            <div className="flex-1">
              <div className="mb-2 flex justify-between text-xs font-bold uppercase tracking-[.13em] text-[#6b8880]">
                <span>
                  Pergunta {step + 1} de {questions.length}
                </span>
                <span>{Math.round(((step + 1) / questions.length) * 100)}%</span>
              </div>
              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{
                    width: `${((step + 1) / questions.length) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>

          <div key={step} className="animate-rise flex flex-1 flex-col">
            <div className="question-icon">
              <CurrentIcon size={25} />
            </div>
            <span className="eyebrow mt-7">{questions[step].eyebrow}</span>
            <h2 className="mt-4 max-w-2xl text-4xl font-medium leading-[1.08] tracking-[-.045em] sm:text-5xl">
              {questions[step].title}
            </h2>
            <p className="mt-4 text-[#71877f]">
              Escolha a opção que mais se aproxima do que você percebe.
            </p>
            <div className="mt-10 grid gap-3">
              {questions[step].options.map((option, i) => (
                <button
                  key={option}
                  onClick={() => choose(option)}
                  className="option-button"
                >
                  <span className="option-number">0{i + 1}</span>
                  <span>{option}</span>
                  <ChevronRight className="ml-auto text-[#99b0a8]" size={19} />
                </button>
              ))}
            </div>
            <p className="mt-auto pt-12 text-center text-xs text-[#91a59f]">
              Suas respostas são usadas somente para montar sua orientação
              inicial.
            </p>
          </div>
        </section>
      )}

      {stage === "processing" && (
        <section className="flex min-h-screen items-center justify-center px-5 pt-16">
          <div className="max-w-md text-center animate-rise">
            <div className="loader-orbit mx-auto">
              <div className="loader-core">
                <Leaf size={25} />
              </div>
            </div>
            <span className="eyebrow mt-9">Só mais um instante</span>
            <h2 className="mt-5 text-4xl font-medium leading-tight tracking-[-.04em]">
              Estamos montando um olhar <em>para você.</em>
            </h2>
            <p className="mt-5 leading-7 text-[#71877f]">
              Cruzando suas respostas com padrões capilares e preparando sua
              orientação inicial.
            </p>
            <div className="processing-steps mt-10">
              <span className="active">
                <Check size={13} /> Respostas recebidas
              </span>
              <span>
                <Sparkles size={13} /> Organizando seu perfil
              </span>
            </div>
          </div>
        </section>
      )}

      {stage === "result" && (
        <section className="result-shell mx-auto min-h-screen max-w-5xl px-5 pb-16 pt-28 lg:px-10">
          <div className="animate-rise">
            <div className="result-top">
              <div>
                <span className="eyebrow">
                  <span className="eyebrow-dot" /> Sua leitura inicial
                </span>
                <h2 className="mt-5 max-w-2xl text-4xl font-medium leading-[1.07] tracking-[-.05em] sm:text-6xl">
                  Existe um caminho mais claro para cuidar de você.
                </h2>
              </div>
              <div className="result-badge">
                <Sparkles size={17} /> Perfil educativo
              </div>
            </div>

            <div className="result-grid mt-12">
              <div className="profile-card">
                <span className="card-label">Seu perfil sugere</span>
                <h3>{result.title}</h3>
                <p>{result.description}</p>
                <div className="profile-tags">
                  <span>{result.accent}</span>
                  <span>avaliação individual</span>
                </div>
              </div>

              <div className="timeline-card">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="card-label">Sem acompanhamento</span>
                    <h3>Como observar a evolução</h3>
                  </div>
                  <span className="timeline-period">12 — 24 meses</span>
                </div>
                <div className="timeline-chart">
                  <div className="chart-axis">
                    <span>densidade percebida</span>
                    <span>tempo</span>
                  </div>
                  <svg
                    viewBox="0 0 500 165"
                    role="img"
                    aria-label="Linha ilustrativa de evolução da densidade percebida"
                  >
                    <path
                      d="M0 34 C90 35 120 54 180 65 S280 86 335 110 S420 132 500 144"
                      fill="none"
                      stroke="#c47c5e"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                    <path
                      d="M0 34 C90 35 120 54 180 65 S280 86 335 110 S420 132 500 144 L500 165 L0 165Z"
                      fill="#f1dcd0"
                      opacity=".45"
                    />
                    <circle cx="0" cy="34" r="5" fill="#c47c5e" />
                    <circle cx="500" cy="144" r="5" fill="#c47c5e" />
                  </svg>
                  <div className="chart-labels">
                    <span>agora</span>
                    <span>12 meses</span>
                    <span>24 meses</span>
                  </div>
                </div>
                <p className="mt-5 text-xs leading-5 text-[#83978f]">
                  Uma representação educativa, não uma previsão ou diagnóstico.
                  Cada pessoa responde de uma forma.
                </p>
              </div>
            </div>

            <div className="cta-card mt-5">
              <div className="cta-copy">
                <span className="cta-spark">
                  <MessageCircle size={20} />
                </span>
                <div>
                  <h3>Sua avaliação completa está pronta.</h3>
                  <p>
                    Converse com nossa equipe para entender as causas prováveis
                    e os próximos passos para o seu caso.
                  </p>
                </div>
              </div>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                onClick={markWhatsAppClicked}
                className="whatsapp-button"
              >
                <MessageCircle size={21} fill="currentColor" /> Receber no
                WhatsApp <ArrowRight size={17} />
              </a>
            </div>

            <p className="disclaimer">
              <ShieldCheck size={14} /> Esta é uma categorização educativa e não
              substitui uma avaliação profissional.
            </p>
            <button onClick={startQuiz} className="restart-link">
              Refazer avaliação
            </button>
          </div>
        </section>
      )}
    </main>
  );
};

export default Index;