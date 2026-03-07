// src/pages/Passager/Messages.jsx
import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import HeaderPrivate from "../../components/HeaderPrivate";

// Messages rapides prédéfinis — covoiturage
const QUICK_REPLIES = [
  { label: "🚗 En route",            text: "Je suis en route !" },
  { label: "📍 Au point RV",         text: "Je suis arrivé au point de rendez-vous." },
  { label: "⏳ Légèrement en retard", text: "Je serai légèrement en retard, merci de patienter." },
  { label: "✅ C'est confirmé",       text: "C'est confirmé, à tout à l'heure !" },
  { label: "👍 Merci",               text: "Merci beaucoup pour le trajet !" },
  { label: "❓ Où êtes-vous ?",       text: "Bonjour, où êtes-vous actuellement ?" },
  { label: "🅿️ Point de départ ?",   text: "Quel est exactement votre point de départ ?" },
  { label: "🔔 Rappel trajet",        text: "Rappel : notre trajet est prévu bientôt, à tout à l'heure !" },
];

export default function Messages() {
  const location = useLocation();
  const [theme] = useState(() => localStorage.getItem("theme") || "light");
  const isDark = theme === "dark";
  const token = localStorage.getItem("token");
  const currentUser = (() => { try { return JSON.parse(localStorage.getItem("user")); } catch { return null; } })();

  useEffect(() => { document.body.dataset.bsTheme = theme; }, [theme]);

  const [conversations, setConversations] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMsg, setNewMsg] = useState("");
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(true);
  const [convError, setConvError] = useState(null);
  // Mobile: "list" = show conversations, "chat" = show selected conversation
  const [mobileView, setMobileView] = useState("list");
  const msgContainerRef = useRef(null);
  const inputRef = useRef(null);

  const fetchConversations = async () => {
    try {
      setLoadingConvs(true);
      const res = await fetch("/messages/conversations", { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) return [];
      const data = await res.json();
      const list = data.conversations || [];
      setConversations(list);
      return list;
    } catch (err) { console.error(err); return []; }
    finally { setLoadingConvs(false); }
  };

  const fetchMessages = async (convId) => {
    try {
      const res = await fetch(`/messages/conversations/${convId}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setMessages(data.messages || []);
      setConversations((prev) => prev.map((c) => c.id === convId ? { ...c, non_lus: 0 } : c));
    } catch (err) { console.error(err); }
    finally { setLoadingMsgs(false); }
  };

  const openConversationWith = async (interlocuteurId, existingList) => {
    try {
      setConvError(null);
      const found = (existingList || conversations).find(
        (c) => String(c.interlocuteur_id) === String(interlocuteurId)
      );
      if (found) { selectConversation(found); return; }

      const res = await fetch("/messages/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ interlocuteur_id: interlocuteurId }),
      });
      const data = await res.json();

      if (!res.ok) { setConvError(data.message || "Impossible d'ouvrir la conversation."); return; }

      let conv = data.conversation;
      if (!conv) {
        const refreshed = await fetchConversations();
        conv = refreshed.find((c) => String(c.interlocuteur_id) === String(interlocuteurId)) ?? null;
        if (conv) selectConversation(conv);
        else setConvError("Conversation créée mais introuvable. Rechargez la page.");
        return;
      }

      setConversations((prev) => {
        if (prev.find((c) => c.id === conv.id)) return prev;
        return [conv, ...prev];
      });
      selectConversation(conv);
    } catch (err) {
      console.error("openConversationWith error:", err);
      setConvError("Erreur réseau. Vérifiez que le serveur est démarré.");
    }
  };

  const selectConversation = (c) => {
    setSelectedConv(c);
    setMobileView("chat");
  };

  const goBackToList = () => {
    setMobileView("list");
    setSelectedConv(null);
  };

  useEffect(() => {
    fetchConversations().then((list) => {
      const navId = location.state?.interlocuteurId;
      if (navId) openConversationWith(navId, list);
    });
  }, []);

  useEffect(() => {
    if (selectedConv) {
      setLoadingMsgs(true);
      fetchMessages(selectedConv.id);
    }
  }, [selectedConv?.id]);

  useEffect(() => {
    if (msgContainerRef.current) {
      msgContainerRef.current.scrollTop = msgContainerRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (!selectedConv) return;
    const interval = setInterval(() => fetchMessages(selectedConv.id), 5000);
    return () => clearInterval(interval);
  }, [selectedConv?.id]);

  const sendMessage = async (text) => {
    const content = text.trim();
    if (!content || !selectedConv || sending) return;
    try {
      setSending(true);
      const res = await fetch(`/messages/conversations/${selectedConv.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ contenu: content }),
      });
      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [...prev, data.message]);
        setNewMsg("");
        setConversations((prev) => prev.map((c) =>
          c.id === selectedConv.id
            ? { ...c, dernier_message: content, dernier_message_le: new Date().toISOString() }
            : c
        ));
      }
    } catch (err) { console.error(err); }
    finally { setSending(false); }
  };

  const handleSend = (e) => { e.preventDefault(); sendMessage(newMsg); };
  const handleQuickReply = (text) => { sendMessage(text); inputRef.current?.focus(); };

  const totalNonLus = conversations.reduce((s, c) => s + Number(c.non_lus || 0), 0);

  const formatTime = (ts) => new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const formatDate = (ts) => {
    const d = new Date(ts);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return formatTime(ts);
    return d.toLocaleDateString("fr-CA", { day: "2-digit", month: "short" });
  };

  const ConvItem = ({ c }) => {
    const initiales = ((c.interlocuteur_prenom?.[0] ?? "") + (c.interlocuteur_nom?.[0] ?? "")).toUpperCase() || "?";
    const isSelected = selectedConv?.id === c.id;
    return (
      <button
        type="button"
        className={`w-100 btn text-start border-0 d-flex align-items-center gap-2 px-3 py-2 ${isSelected ? (isDark ? "bg-success bg-opacity-25" : "bg-success-subtle") : ""}`}
        style={{ borderRadius: 0, borderBottom: `1px solid ${isDark ? "#2d3748" : "#f0f0f0"}` }}
        onClick={() => selectConversation(c)}
      >
        {c.interlocuteur_photo_url ? (
          <img src={c.interlocuteur_photo_url} alt="" className="rounded-circle flex-shrink-0"
            style={{ width: 44, height: 44, objectFit: "cover" }} />
        ) : (
          <div className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white flex-shrink-0"
            style={{ width: 44, height: 44, background: "linear-gradient(135deg,#198754,#20c374)", fontSize: "0.82rem" }}>
            {initiales}
          </div>
        )}
        <div className="flex-grow-1 min-w-0">
          <div className="d-flex justify-content-between align-items-center">
            <span className="fw-semibold text-truncate" style={{ fontSize: "0.88rem" }}>
              {c.interlocuteur_prenom} {c.interlocuteur_nom}
            </span>
            {c.dernier_message_le && (
              <span className={`flex-shrink-0 ms-1 ${isDark ? "text-secondary" : "text-muted"}`} style={{ fontSize: "0.7rem" }}>
                {formatDate(c.dernier_message_le)}
              </span>
            )}
          </div>
          <div className="d-flex justify-content-between align-items-center mt-1">
            <span className={`text-truncate ${isDark ? "text-secondary" : "text-muted"}`} style={{ fontSize: "0.78rem", maxWidth: 180 }}>
              {c.dernier_message || <em>Démarrez la conversation</em>}
            </span>
            {Number(c.non_lus) > 0 && (
              <span className="badge bg-success rounded-pill flex-shrink-0 ms-1" style={{ fontSize: "0.62rem" }}>{c.non_lus}</span>
            )}
          </div>
        </div>
      </button>
    );
  };

  return (
    <div
      className={`d-flex flex-column ${isDark ? "bg-dark text-light" : "bg-light text-dark"}`}
      style={{ height: "100vh", overflow: "hidden" }}
    >
      <HeaderPrivate isDark={isDark} />

      <main className="flex-grow-1 d-flex flex-column overflow-hidden">
        <div
          className="d-flex flex-column flex-grow-1 overflow-hidden py-2 py-md-3"
          style={{ maxWidth: 1000, width: "100%", margin: "0 auto", padding: "0 12px" }}
        >
          {/* Titre — masqué sur mobile quand on est en vue chat */}
          <div className={`mb-2 d-flex align-items-center gap-2 flex-shrink-0 ${mobileView === "chat" ? "d-none d-md-flex" : "d-flex"}`}>
            <h4 className="fw-bold mb-0" style={{ fontSize: "1.1rem" }}>Messagerie</h4>
            {totalNonLus > 0 && (
              <span className="badge bg-danger rounded-pill">{totalNonLus}</span>
            )}
          </div>

          {convError && (
            <div className="alert alert-danger alert-dismissible py-2 mb-2 rounded-3 flex-shrink-0" style={{ fontSize: "0.85rem" }}>
              <i className="bi bi-exclamation-triangle-fill me-2" />{convError}
              <button type="button" className="btn-close" onClick={() => setConvError(null)} />
            </div>
          )}

          <div
            className={`rounded-4 shadow-sm overflow-hidden flex-grow-1 ${isDark ? "bg-dark border border-secondary" : "bg-white"}`}
            style={{ display: "flex", minHeight: 0 }}
          >
            {/* ── Liste conversations ── visible sur desktop TOUJOURS, sur mobile seulement si mobileView=list */}
            <div
              className={`d-flex flex-column border-end ${isDark ? "border-secondary" : ""} ${mobileView === "chat" ? "d-none d-md-flex" : "d-flex"}`}
              style={{ width: "min(290px, 100%)", flexShrink: 0 }}
            >
              <div style={{ height: 3, background: "linear-gradient(90deg,#198754,#20c374)" }} />
              <div className="p-3 border-bottom" style={{ borderColor: isDark ? "#495057" : "#dee2e6" }}>
                <div className="fw-semibold d-flex align-items-center gap-2" style={{ fontSize: "0.88rem" }}>
                  <i className="bi bi-chat-dots-fill text-success" />
                  Conversations
                  {totalNonLus > 0 && (
                    <span className="badge bg-danger rounded-pill ms-auto" style={{ fontSize: "0.65rem" }}>{totalNonLus}</span>
                  )}
                </div>
              </div>
              <div className="flex-grow-1 overflow-auto">
                {loadingConvs ? (
                  <div className="text-center py-4"><div className="spinner-border spinner-border-sm text-success" /></div>
                ) : conversations.length === 0 ? (
                  <div className="text-center py-5 px-3">
                    <i className="bi bi-chat-dots text-success" style={{ fontSize: "2.5rem", opacity: 0.4 }} />
                    <p className={`small mt-2 mb-0 ${isDark ? "text-secondary" : "text-muted"}`}>Aucune conversation</p>
                    <p className={`small ${isDark ? "text-secondary" : "text-muted"}`} style={{ fontSize: "0.75rem" }}>
                      Cliquez sur "Message" depuis une carte de trajet pour démarrer.
                    </p>
                  </div>
                ) : conversations.map((c) => <ConvItem key={c.id} c={c} />)}
              </div>
            </div>

            {/* ── Zone messages ── visible sur desktop TOUJOURS, sur mobile seulement si mobileView=chat */}
            <div
              className={`flex-column flex-grow-1 min-w-0 ${mobileView === "list" ? "d-none d-md-flex" : "d-flex"}`}
            >
              {!selectedConv ? (
                <div className="d-flex flex-column align-items-center justify-content-center h-100 px-4 text-center">
                  <i className="bi bi-chat-text text-success" style={{ fontSize: "3.5rem", opacity: 0.25 }} />
                  <p className={`mt-3 fw-semibold mb-1 ${isDark ? "text-secondary" : "text-muted"}`}>
                    Sélectionnez une conversation
                  </p>
                  <p className={`small ${isDark ? "text-secondary" : "text-muted"}`} style={{ fontSize: "0.8rem" }}>
                    ou cliquez sur <strong>Message</strong> depuis une carte de trajet.
                  </p>
                </div>
              ) : (
                <>
                  {/* Header conversation — avec bouton retour sur mobile */}
                  <div className={`px-3 py-2 border-bottom d-flex align-items-center gap-2 ${isDark ? "border-secondary" : ""}`}
                    style={{ minHeight: 56 }}>
                    {/* Bouton retour — mobile seulement */}
                    <button
                      type="button"
                      className={`btn btn-sm d-md-none rounded-3 me-1 flex-shrink-0 ${isDark ? "btn-outline-light" : "btn-outline-secondary"}`}
                      style={{ padding: "4px 8px" }}
                      onClick={goBackToList}
                    >
                      <i className="bi bi-chevron-left" />
                    </button>

                    {selectedConv.interlocuteur_photo_url ? (
                      <img src={selectedConv.interlocuteur_photo_url} alt="" className="rounded-circle flex-shrink-0"
                        style={{ width: 38, height: 38, objectFit: "cover" }} />
                    ) : (
                      <div className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white flex-shrink-0"
                        style={{ width: 38, height: 38, background: "linear-gradient(135deg,#198754,#20c374)", fontSize: "0.78rem" }}>
                        {((selectedConv.interlocuteur_prenom?.[0] ?? "") + (selectedConv.interlocuteur_nom?.[0] ?? "")).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-grow-1">
                      <div className="fw-bold" style={{ fontSize: "0.92rem" }}>
                        {selectedConv.interlocuteur_prenom} {selectedConv.interlocuteur_nom}
                      </div>
                      <div className={`d-flex align-items-center gap-1 ${isDark ? "text-secondary" : "text-muted"}`} style={{ fontSize: "0.72rem" }}>
                        <span className="rounded-circle bg-success d-inline-block" style={{ width: 6, height: 6 }} />
                        Covoitureur CampusRide
                      </div>
                    </div>
                    {/* Toggle quick replies */}
                    <button
                      type="button"
                      className={`btn btn-sm rounded-3 flex-shrink-0 ${showQuickReplies ? "btn-success" : (isDark ? "btn-outline-light" : "btn-outline-secondary")}`}
                      style={{ fontSize: "0.75rem" }}
                      onClick={() => setShowQuickReplies((v) => !v)}
                      title="Messages rapides"
                    >
                      <i className="bi bi-lightning-fill" />
                      <span className="d-none d-sm-inline ms-1">Rapides</span>
                    </button>
                  </div>

                  {/* Messages list */}
                  <div ref={msgContainerRef} className="flex-grow-1 overflow-auto p-3 d-flex flex-column gap-2" style={{ minHeight: 0 }}>
                    {loadingMsgs ? (
                      <div className="d-flex align-items-center justify-content-center h-100">
                        <div className="spinner-border spinner-border-sm text-success" />
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="d-flex flex-column align-items-center justify-content-center h-100 text-center">
                        <i className="bi bi-chat-heart text-success" style={{ fontSize: "2.5rem", opacity: 0.3 }} />
                        <p className={`small mt-2 mb-0 ${isDark ? "text-secondary" : "text-muted"}`}>
                          Commencez la conversation !
                        </p>
                        <p className={`small ${isDark ? "text-secondary" : "text-muted"}`} style={{ fontSize: "0.75rem" }}>
                          Utilisez les messages rapides ou écrivez votre message.
                        </p>
                      </div>
                    ) : messages.map((m) => {
                      const isMine = m.expediteur_id === currentUser?.id;
                      return (
                        <div key={m.id} className={`d-flex ${isMine ? "justify-content-end" : "justify-content-start"}`}>
                          {!isMine && (
                            m.expediteur_photo_url ? (
                              <img src={m.expediteur_photo_url} alt="" className="rounded-circle me-2 flex-shrink-0 align-self-end"
                                style={{ width: 28, height: 28, objectFit: "cover" }} />
                            ) : (
                              <div className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white me-2 flex-shrink-0 align-self-end"
                                style={{ width: 28, height: 28, background: "linear-gradient(135deg,#198754,#20c374)", fontSize: "0.62rem" }}>
                                {((m.expediteur_prenom?.[0] ?? "") + (m.expediteur_nom?.[0] ?? "")).toUpperCase()}
                              </div>
                            )
                          )}
                          <div style={{ maxWidth: "75%" }}>
                            <div
                              className={`px-3 py-2 ${isMine ? "rounded-4 rounded-end-1 text-white" : "rounded-4 rounded-start-1"} ${!isMine ? (isDark ? "bg-secondary bg-opacity-25" : "bg-light") : ""}`}
                              style={{
                                background: isMine ? "linear-gradient(135deg,#198754,#20c374)" : undefined,
                                fontSize: "0.88rem",
                                lineHeight: 1.45,
                                wordBreak: "break-word",
                              }}
                            >
                              {m.contenu}
                            </div>
                            <div className={`mt-1 d-flex align-items-center gap-1 ${isMine ? "justify-content-end" : ""} ${isDark ? "text-secondary" : "text-muted"}`}
                              style={{ fontSize: "0.62rem" }}>
                              {formatTime(m.envoye_le)}
                              {isMine && (
                                <i className={`bi ${m.lu ? "bi-check2-all text-success" : "bi-check2"}`} style={{ fontSize: "0.75rem" }} />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Quick replies */}
                  {showQuickReplies && (
                    <div
                      className={`px-3 py-2 border-top d-flex gap-2 overflow-auto ${isDark ? "border-secondary" : ""}`}
                      style={{ flexShrink: 0, scrollbarWidth: "none" }}
                    >
                      {QUICK_REPLIES.map((qr) => (
                        <button
                          key={qr.text}
                          type="button"
                          className={`btn btn-sm rounded-pill flex-shrink-0 fw-semibold ${isDark ? "btn-outline-light" : "btn-outline-secondary"}`}
                          style={{ fontSize: "0.75rem", whiteSpace: "nowrap", padding: "4px 12px" }}
                          disabled={sending}
                          onClick={() => handleQuickReply(qr.text)}
                        >
                          {qr.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Input message */}
                  <form
                    onSubmit={handleSend}
                    className={`px-3 py-2 border-top d-flex gap-2 align-items-center ${isDark ? "border-secondary" : ""}`}
                    style={{ flexShrink: 0 }}
                  >
                    <input
                      ref={inputRef}
                      type="text"
                      className={`form-control rounded-pill border-0 ${isDark ? "bg-secondary bg-opacity-25 text-light" : "bg-light"}`}
                      placeholder="Écrivez un message..."
                      value={newMsg}
                      onChange={(e) => setNewMsg(e.target.value)}
                      style={{ fontSize: "0.88rem" }}
                    />
                    <button
                      type="submit"
                      className="btn btn-success rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                      style={{ width: 42, height: 42, background: "linear-gradient(135deg,#198754,#20c374)", border: "none" }}
                      disabled={sending || !newMsg.trim()}
                    >
                      {sending
                        ? <span className="spinner-border spinner-border-sm" style={{ width: 14, height: 14 }} />
                        : <i className="bi bi-send-fill" style={{ fontSize: "0.85rem" }} />
                      }
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
