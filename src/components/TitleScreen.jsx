import { ACHIEVEMENTS } from "../data/achievements.js";
import { CEDOLE } from "../data/biomes.js";
import { RELIC_DEFS } from "../data/items.js";
import { TOKENS } from "../data/tokens.js";
import { C, FONT, FONT_TITLE } from "../data/theme.js";

const META_CARDS = [
  { key:"trophies", mark:"I", label:"TROFEI", accent:C.gold },
  { key:"relics", mark:"R", label:"RELIQUIE", accent:"#c060ff" },
  { key:"stats", mark:"%", label:"STATS", accent:C.cyan },
  { key:"tokens", mark:"P", label:"PEDINE", accent:"#e58a68" },
];

export function TitleScreen({
  onStart,
  activeCedola,
  onRemoveCedola,
  achievements,
  discoveredRelics,
  discoveredTokens,
  allTimeStats,
  onOpenTrophies,
  onOpenReliquie,
  onOpenStats,
  onOpenPedine,
  onOpenSettings,
}) {
  const cedola = CEDOLE.find(c => c.id === activeCedola);
  const counts = {
    trophies: [Object.keys(achievements || {}).length, ACHIEVEMENTS.length],
    relics: [(discoveredRelics || []).length, Object.keys(RELIC_DEFS).length],
    stats: [allTimeStats?.totalWins || 0, allTimeStats?.totalRuns || 0],
    tokens: [(discoveredTokens || []).length, Object.keys(TOKENS).length],
  };
  const actions = {
    trophies:onOpenTrophies,
    relics:onOpenReliquie,
    stats:onOpenStats,
    tokens:onOpenPedine,
  };

  return (
    <main className="title-machine" aria-label="Grattini — schermata iniziale">
      <style>{`
        .title-machine {
          --ink:#080a0b; --paper:#f3e7bc; --red:${C.red}; --gold:${C.gold}; --cyan:${C.cyan};
          position:relative; isolation:isolate; width:100%; min-height:100%;
          overflow:auto; display:grid; grid-template-rows:auto 1fr auto;
          font-family:${FONT}; color:${C.text}; background:#070909;
        }
        .title-machine::before {
          content:""; position:absolute; inset:0; z-index:-2; pointer-events:none;
          background:repeating-linear-gradient(0deg, #080b0b 0 12px, #0d1211 12px 16px);
        }
        .title-topline {
          min-height:34px; display:flex; align-items:center; justify-content:space-between; gap:16px;
          padding:5px clamp(10px,2.4vw,32px); color:var(--paper); background:#101513;
          border-bottom:2px solid var(--gold); font-size:12px; letter-spacing:2px;
          box-shadow:0 3px 0 #000;
        }
        .title-open { color:#070909; background:${C.green}; padding:2px 8px; font-weight:bold; }
        .title-serial { color:${C.dim}; white-space:nowrap; }
        .title-floor {
          width:min(1280px,100%); margin:0 auto; padding:clamp(12px,3vh,30px) clamp(12px,3vw,42px);
          display:grid; grid-template-columns:minmax(0,1.35fr) minmax(310px,.65fr); gap:clamp(18px,3vw,42px);
          align-items:center; align-content:center;
        }
        .title-hero { min-width:0; display:flex; flex-direction:column; align-items:flex-start; }
        .title-kicker {
          display:flex; align-items:center; gap:10px; color:var(--cyan); font-size:12px;
          letter-spacing:4px; margin:0 0 10px; text-transform:uppercase;
        }
        .title-kicker::before { content:"T"; display:grid; place-items:center; width:30px; height:30px;
          border:2px solid var(--cyan); color:var(--paper); background:#071313; font:24px/1 ${FONT_TITLE};
          box-shadow:3px 3px 0 #000; }
        .title-sign {
          position:relative; width:100%; padding:clamp(15px,2.7vw,32px) clamp(12px,2.4vw,28px) clamp(12px,2vw,24px);
          background:#b8232c; border:4px solid var(--paper); outline:4px solid #27130c;
          box-shadow:8px 8px 0 #000; overflow:hidden;
        }
        .title-sign::before { content:""; position:absolute; inset:7px; border:2px dashed rgba(255,238,190,.45); pointer-events:none; }
        .title-sign::after { content:""; position:absolute; left:0; right:0; bottom:0; height:12px;
          background:repeating-linear-gradient(90deg,var(--gold) 0 16px,#17100a 16px 24px); }
        .title-word {
          position:relative; margin:0; color:var(--paper); font-family:${FONT_TITLE}; font-weight:400;
          font-size:clamp(62px,10vw,138px); line-height:.72; letter-spacing:clamp(1px,.8vw,10px);
          text-transform:uppercase; text-shadow:4px 0 0 #111b1a, 0 5px 0 #111b1a; white-space:nowrap;
        }
        .title-word::after { content:"GRATTINI"; position:absolute; inset:0; color:transparent;
          -webkit-text-stroke:1px var(--gold); transform:translate(2px,-2px); opacity:.8; pointer-events:none; }
        .title-edition { position:relative; margin:clamp(12px,2vh,22px) 0 4px; color:var(--gold);
          font-size:clamp(11px,1.2vw,15px); letter-spacing:clamp(2px,.6vw,7px); }
        .title-promise { max-width:650px; margin:18px 0 0; color:var(--paper); font-size:clamp(14px,1.3vw,18px); line-height:1.35; }
        .title-promise strong { color:var(--gold); font-weight:normal; }
        .title-start {
          position:relative; margin-top:clamp(18px,3vh,30px); min-width:min(100%,360px); min-height:58px;
          padding:12px 24px; border:3px solid var(--paper); background:var(--gold); color:#11130f;
          font:22px/1 ${FONT_TITLE}; letter-spacing:3px; text-transform:uppercase; cursor:pointer;
          box-shadow:5px 5px 0 #000; transition:transform 100ms steps(1),box-shadow 100ms steps(1);
        }
        .title-start:hover,.title-start:focus-visible { background:var(--paper); outline:2px solid var(--red); outline-offset:3px; }
        .title-start:active { transform:translate(4px,4px); box-shadow:1px 1px 0 #000; }
        .title-warning { margin:12px 0 0; color:${C.dim}; font-size:12px; letter-spacing:1px; line-height:1.45; }
        .title-ledger { align-self:stretch; display:grid; grid-template-rows:auto 1fr auto; min-width:0;
          background:#0c1110; border-left:4px solid var(--gold); border-right:1px solid #35413d;
          box-shadow:6px 6px 0 #000; }
        .title-ledger-head { padding:9px 12px; color:#10110d; background:var(--paper); border-bottom:3px solid var(--red);
          font:18px/1 ${FONT_TITLE}; letter-spacing:3px; display:flex; justify-content:space-between; }
        .title-ledger-head small { font:10px/1 ${FONT}; letter-spacing:1px; align-self:center; }
        .title-meta { display:grid; grid-template-columns:1fr 1fr; gap:1px; padding:1px; background:#35413d; }
        .title-meta-button { min-height:112px; border:0; padding:12px; color:var(--accent); background:#0b0f0e;
          font-family:${FONT}; cursor:pointer; text-align:left; position:relative; }
        .title-meta-button:hover,.title-meta-button:focus-visible { background:#151d1a; outline:2px solid var(--accent); outline-offset:-3px; }
        .title-meta-top { display:flex; align-items:flex-start; justify-content:space-between; gap:8px; }
        .title-meta-mark { display:grid; place-items:center; width:34px; height:34px; border:2px solid var(--accent);
          background:#070908; font:24px/1 ${FONT_TITLE}; box-shadow:3px 3px 0 #000; }
        .title-meta-count { font-size:12px; color:var(--paper); }
        .title-meta-label { display:block; margin-top:14px; font:16px/1 ${FONT_TITLE}; letter-spacing:2px; }
        .title-meter { display:flex; height:6px; margin-top:8px; border:1px solid var(--accent); background:#050706; overflow:hidden; }
        .title-meter > span { display:block; height:100%; background:var(--accent); }
        .title-settings { width:100%; padding:9px 12px; border:0; border-top:1px solid #35413d; background:#080b0a;
          color:${C.dim}; font:11px ${FONT}; letter-spacing:2px; text-align:left; cursor:pointer; }
        .title-settings:hover,.title-settings:focus-visible { color:var(--paper); background:#111816; outline:none; }
        .title-cedola { padding:10px 12px 12px; color:var(--paper); background:#17140a; border-top:2px dashed var(--gold); }
        .title-cedola-label { color:var(--gold); font-size:10px; letter-spacing:2px; }
        .title-cedola-name { margin:4px 0; font-size:14px; }
        .title-cedola-rule { color:${C.dim}; font-size:11px; line-height:1.35; }
        .title-cedola-remove { margin-top:7px; border:1px solid var(--red); padding:4px 8px; background:#090505;
          color:var(--red); font:11px ${FONT}; cursor:pointer; }
        .title-footer { min-height:30px; padding:6px 12px; display:flex; justify-content:center; align-items:center;
          color:${C.dim}; background:#070908; border-top:1px solid #35413d; font-size:11px; letter-spacing:2px; text-align:center; }
        @media (max-width:760px) {
          .title-floor { grid-template-columns:1fr; align-items:start; align-content:start; gap:14px; padding:12px; }
          .title-hero { align-items:center; text-align:center; }
          .title-kicker { margin-bottom:8px; }
          .title-sign { max-width:620px; }
          .title-word { font-size:clamp(52px,17vw,104px); }
          .title-promise { margin-top:12px; }
          .title-start { margin-top:14px; min-height:52px; font-size:19px; }
          .title-warning { margin-top:8px; }
          .title-ledger { width:100%; }
          .title-meta-button { min-height:78px; padding:8px 10px; }
          .title-meta-mark { width:28px; height:28px; font-size:20px; }
          .title-meta-label { margin-top:8px; font-size:14px; }
        }
        @media (max-height:560px) and (min-width:641px) {
          .title-topline,.title-footer { display:none; }
          .title-floor { grid-template-columns:minmax(0,1.25fr) minmax(300px,.75fr); padding:10px 18px; gap:22px; }
          .title-sign { padding:14px 18px 12px; }
          .title-word { font-size:clamp(58px,9vw,94px); }
          .title-promise { margin-top:10px; font-size:14px; }
          .title-start { margin-top:12px; min-height:48px; font-size:18px; }
          .title-warning { margin-top:7px; font-size:10px; }
          .title-meta-button { min-height:84px; padding:8px; }
          .title-meta-label { margin-top:7px; }
        }
        @media (max-width:640px) and (max-height:500px) {
          .title-machine { grid-template-rows:1fr; }
          .title-topline,.title-footer,.title-promise,.title-warning { display:none; }
          .title-floor { grid-template-columns:1.15fr .85fr; padding:8px; gap:10px; align-items:center; }
          .title-kicker { font-size:10px; letter-spacing:2px; }
          .title-kicker::before { width:24px; height:24px; font-size:18px; }
          .title-sign { padding:12px 8px 8px; border-width:3px; outline-width:2px; }
          .title-word { font-size:clamp(38px,11vw,66px); text-shadow:2px 0 #111b1a,0 3px #111b1a; }
          .title-edition { margin-top:8px; font-size:9px; letter-spacing:2px; }
          .title-start { margin-top:12px; min-width:100%; min-height:44px; padding:8px; font-size:15px; }
          .title-ledger-head { padding:6px 8px; font-size:13px; }
          .title-meta-button { min-height:60px; padding:5px; }
          .title-meta-mark { width:22px; height:22px; font-size:15px; box-shadow:2px 2px #000; }
          .title-meta-count { font-size:9px; }
          .title-meta-label { margin-top:5px; font-size:11px; letter-spacing:1px; }
          .title-meter { height:4px; margin-top:4px; }
          .title-cedola { padding:5px 7px; }
          .title-cedola-rule { display:none; }
        }
      `}</style>

      <header className="title-topline">
        <span className="title-open">APERTO H24</span>
        <span>RICEVITORIA DELLA FORTUNA</span>
        <span className="title-serial">LIC. N. 1997-V3</span>
      </header>

      <div className="title-floor">
        <section className="title-hero">
          <div className="title-kicker">Tabacchi clandestini</div>
          <div className="title-sign">
            <h1 className="title-word">Grattini</h1>
            <div className="title-edition">TABACCHI EDITION · VERSIONE 3</div>
          </div>
          <p className="title-promise">Un roguelike di <strong>grattate, unghie e fortuna</strong>.</p>
          <button className="title-start" onClick={onStart}>Inizia la run</button>
          <p className="title-warning">5 unghie · 4 biomi · 1 destino<br/>Gratta con saggezza. Le unghie non ricrescono.</p>
        </section>

        <aside className="title-ledger" aria-label="Metaprogressione">
          <div className="title-ledger-head"><span>ARCHIVIO</span><small>TOCCA PER APRIRE</small></div>
          <div className="title-meta">
            {META_CARDS.map(card => {
              const count = counts[card.key];
              const pct = Math.min(100, count[1] ? count[0] / count[1] * 100 : 0);
              const lossPct = card.key === "stats" && count[1] ? 100 - pct : 0;
              const countLabel = card.key === "stats" ? `${Math.round(pct)}% VINTE` : `${count[0]} / ${count[1]}`;
              const accent = card.key === "stats" && count[1] && lossPct > pct ? C.red : card.accent;
              return (
                <button key={card.key} className="title-meta-button" style={{"--accent":accent}} onClick={actions[card.key]}>
                  <span className="title-meta-top">
                    <span className="title-meta-mark" aria-hidden>{card.mark}</span>
                    <span className="title-meta-count">{countLabel}</span>
                  </span>
                  <span className="title-meta-label">{card.label}</span>
                  <span className="title-meter" aria-hidden>
                    <span style={{width:`${pct}%`, background:card.key === "stats" ? C.cyan : undefined}} />
                    {card.key === "stats" && <span style={{width:`${lossPct}%`, background:C.red}} />}
                  </span>
                </button>
              );
            })}
          </div>
          <button className="title-settings" onClick={onOpenSettings}>⚙ IMPOSTAZIONI · AZZERA PROGRESSI</button>
          {cedola && (
            <div className="title-cedola">
              <div className="title-cedola-label">CEDOLA ATTIVA</div>
              <div className="title-cedola-name">{cedola.name}</div>
              <div className="title-cedola-rule">+ {cedola.pro} / − {cedola.contro}</div>
              <button className="title-cedola-remove" onClick={onRemoveCedola}>RIMUOVI CEDOLA</button>
            </div>
          )}
        </aside>
      </div>

      <footer className="title-footer">SPAZIO O INVIO PER COMINCIARE · PROGRESSI SALVATI IN LOCALE</footer>
    </main>
  );
}
