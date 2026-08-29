/* =====================================================================
 *  AskEdgar.IA — lógica del chat (conectada al backend Django)
 * =====================================================================
 *  - Conversaciones como PESTAÑAS en la parte superior (máx. según backend).
 *  - Respuestas preparadas (respuestas_preparadas.js): 0 tokens.
 *  - Filtro de seguridad cliente (filtro_seguridad.js): aviso instantáneo.
 *  - Delay de 3 s con spinner en cada envío.
 *  - focus() con preventScroll para que el menú del sitio no se esconda.
 * ===================================================================== */
(function () {
  "use strict";

  const wrap = document.getElementById("cvchatWrap");
  if (!wrap) return;

  const CFG = {
    loginUrl: wrap.dataset.loginUrl || "/user/login/",
    captchaEnabled: wrap.dataset.captchaEnabled === "1",
    maxWords: parseInt(wrap.dataset.maxWords || "500", 10),
  };

  const EP = {
    lista: "/api/chat/lista/",
    nueva: "/api/chat/nueva/",
    enviar: "/api/chat/enviar/",
    borrar: "/api/chat/borrar/",
    captcha: "/api/chat/captcha/",
  };

  const messagesArea = document.getElementById("messagesArea");
  const messageInput = document.getElementById("messageInput");
  const sendBtn = document.getElementById("sendBtn");
  const sendIcon = document.getElementById("sendIcon");
  const conversationsList = document.getElementById("conversationsList");
  const newChatBtn = document.getElementById("newChatBtn");
  const chatStatus = document.getElementById("chatStatus");
  const captchaGate = document.getElementById("captchaGate");

  const state = {
    conversations: [],
    activeId: null,
    sending: false,
    autenticado: false,
    captchaOk: !CFG.captchaEnabled,
    maxConvs: 2,
    tokens: { usados: 0, limite: 0, restantes: 0 },
  };

  // ---------------- utilidades ----------------
  function getCookie(name) {
    const m = document.cookie.match("(^|;)\\s*" + name + "\\s*=\\s*([^;]+)");
    return m ? m.pop() : "";
  }
  async function postJSON(url, body) {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-CSRFToken": getCookie("csrftoken") },
      body: JSON.stringify(body || {}),
    });
    let data = {};
    try { data = await r.json(); } catch (e) {}
    return { status: r.status, data };
  }
  async function getJSON(url) {
    const r = await fetch(url, { headers: { "X-CSRFToken": getCookie("csrftoken") } });
    try { return { status: r.status, data: await r.json() }; }
    catch (e) { return { status: r.status, data: {} }; }
  }
  const delay = (ms) => new Promise((res) => setTimeout(res, ms));
  const focusInput = () => { if (!messageInput.disabled) messageInput.focus({ preventScroll: true }); };
  function activeConv() { return state.conversations.find((c) => c.id === state.activeId); }

  // ---------------- render ----------------
  function renderStatus() {
    const t = state.tokens;
    let txt = state.autenticado ? "" : "Invitado · ";
    txt += `Tokens: <b>${t.restantes}</b>/${t.limite}`;
    const conv = activeConv();
    if (conv) {
      const rp = Math.max(CFG.maxWords - (conv.total_palabras || 0), 0);
      txt += ` · Palabras restantes: <b>${rp}</b>`;
    }
    chatStatus.innerHTML = txt;
  }

  function bubble(role, text, isHTML) {
    const w = document.createElement("div");
    w.className = "cvchat-message " + role;
    const b = document.createElement("div");
    b.className = "cvchat-bubble";
    if (isHTML) b.innerHTML = text; else b.textContent = text;
    w.appendChild(b);
    return w;
  }

  function renderMessages() {
    messagesArea.innerHTML = "";
    const conv = activeConv();
    if (!conv || !conv.mensajes || !conv.mensajes.length) {
      const e = document.createElement("div");
      e.className = "cvchat-empty-state";
      e.textContent = "Empieza una nueva conversación con el asistente.";
      messagesArea.appendChild(e);
      renderStatus();
      return;
    }
    conv.mensajes.forEach((m) => {
      messagesArea.appendChild(bubble(m.rol === "user" ? "user" : "assistant", m.contenido, false));
    });
    scrollBottom();
    renderStatus();
  }

  function updateNewBtn() {
    const atMax = state.conversations.length >= state.maxConvs;
    newChatBtn.disabled = atMax;
    newChatBtn.title = atMax ? "Máximo de conversaciones alcanzado" : "";
  }

  function renderConversations() {
    conversationsList.innerHTML = "";
    if (!state.conversations.length) {
      const e = document.createElement("div");
      e.className = "cvchat-list-empty";
      e.textContent = "No hay conversaciones";
      conversationsList.appendChild(e);
      updateNewBtn();
      return;
    }
    state.conversations.forEach((conv) => {
      const item = document.createElement("div");
      item.className = "cvchat-conversation" + (conv.id === state.activeId ? " active" : "");
      item.onclick = (e) => {
        if (e.target.closest(".cvchat-conv-del")) return;
        state.activeId = conv.id;
        renderMessages();
        renderConversations();
      };
      const t = document.createElement("span");
      t.className = "cvchat-conversation-title";
      t.textContent = conv.titulo || "Conversación";
      const del = document.createElement("button");
      del.className = "cvchat-conv-del";
      del.title = "Eliminar conversación";
      del.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>';
      del.onclick = () => deleteConversation(conv.id);
      item.appendChild(t);
      item.appendChild(del);
      conversationsList.appendChild(item);
    });
    updateNewBtn();
  }

  function scrollBottom() { messagesArea.scrollTop = messagesArea.scrollHeight; }

  function showTyping() {
    const t = document.createElement("div");
    t.className = "cvchat-message assistant";
    t.id = "typingIndicator";
    t.innerHTML = '<div class="cvchat-bubble"><div class="cvchat-typing"><div class="cvchat-typing-dot"></div><div class="cvchat-typing-dot"></div><div class="cvchat-typing-dot"></div></div></div>';
    messagesArea.appendChild(t);
    scrollBottom();
  }
  function hideTyping() { const t = document.getElementById("typingIndicator"); if (t) t.remove(); }

  function setSending(on) {
    state.sending = on;
    sendBtn.disabled = on;
    messageInput.disabled = on;
    if (on) {
      sendIcon.style.display = "none";
      if (!sendBtn.querySelector(".cvchat-spinner")) {
        const s = document.createElement("span");
        s.className = "cvchat-spinner";
        sendBtn.appendChild(s);
      }
    } else {
      sendIcon.style.display = "";
      const s = sendBtn.querySelector(".cvchat-spinner");
      if (s) s.remove();
    }
  }

  // ---------------- respuestas preparadas ----------------
  function buscarPreparada(text) {
    const R = window.RESPUESTAS_PREPARADAS || {};
    const t = text.trim().toLowerCase();
    if (R.exactas && R.exactas[t]) return R.exactas[t];
    if (R.claves) {
      for (const e of R.claves) {
        if (e.claves && e.claves.some((k) => t.includes(k.toLowerCase()))) return e.respuesta;
      }
    }
    return null;
  }

  // ---------------- acciones ----------------
  async function loadConversations() {
    const { data } = await getJSON(EP.lista);
    state.conversations = data.conversaciones || [];
    state.autenticado = !!data.autenticado;
    state.captchaOk = !CFG.captchaEnabled || !!data.captcha_ok;
    if (typeof data.max_conversaciones === "number") state.maxConvs = data.max_conversaciones;
    if (data.tokens) state.tokens = data.tokens;
    if (state.conversations.length) {
      state.activeId = state.conversations[0].id;
    } else {
      await newChat(true);
    }
    renderConversations();
    renderMessages();
    updateGate();
  }

  function updateGate() {
    if (!captchaGate) return;
    captchaGate.style.display = state.captchaOk ? "none" : "flex";
    messageInput.disabled = !state.captchaOk;
    sendBtn.disabled = !state.captchaOk;
  }

  async function newChat(silent) {
    const { status, data } = await postJSON(EP.nueva, {});
    if (status === 403) {
      if (!silent) systemMessage(data.mensaje || "No puedes crear más conversaciones.", !!data.need_login);
      return;
    }
    if (data.id) {
      state.conversations.unshift({ id: data.id, titulo: data.titulo, total_palabras: 0, mensajes: [] });
      state.activeId = data.id;
      renderConversations();
      renderMessages();
      if (!silent) focusInput();
    }
  }

  async function deleteConversation(id) {
    await postJSON(EP.borrar, { id });
    state.conversations = state.conversations.filter((c) => c.id !== id);
    if (state.activeId === id) {
      state.activeId = state.conversations.length ? state.conversations[0].id : null;
      if (!state.activeId) await newChat(true);
    }
    renderConversations();
    renderMessages();
  }

  function systemMessage(text, withLogin) {
    let html = text;
    if (withLogin) html += ` <a href="${CFG.loginUrl}?next=/es/ask/">Iniciar sesión</a>`;
    messagesArea.appendChild(bubble("system", html, true));
    scrollBottom();
  }

  function pushLocalMessage(conv, rol, contenido) { conv.mensajes.push({ rol, contenido }); }

  async function sendMessage() {
    if (state.sending || !state.captchaOk) return;
    const text = messageInput.value.trim();
    if (!text) return;

    let conv = activeConv();
    if (!conv) { await newChat(true); conv = activeConv(); if (!conv) return; }

    messageInput.value = "";
    autoResize();

    messagesArea.appendChild(bubble("user", text, false));
    pushLocalMessage(conv, "user", text);
    scrollBottom();

    // Filtro de seguridad cliente (el servidor también valida)
    if (window.FILTRO_SEGURIDAD && window.FILTRO_SEGURIDAD.esPeligroso(text)) {
      messagesArea.appendChild(bubble("assistant", window.FILTRO_SEGURIDAD.respuesta, false));
      pushLocalMessage(conv, "assistant", window.FILTRO_SEGURIDAD.respuesta);
      scrollBottom();
      postJSON(EP.enviar, { conversacion_id: conv.id, mensaje: text, origen: "ia" });
      return;
    }

    const preparada = buscarPreparada(text);
    const payload = { conversacion_id: conv.id, mensaje: text };
    if (preparada) { payload.origen = "preparada"; payload.respuesta_preparada = preparada; }
    else { payload.origen = "ia"; }

    setSending(true);
    showTyping();

    const [resp] = await Promise.all([postJSON(EP.enviar, payload), delay(3000)]);

    hideTyping();
    setSending(false);

    const d = resp.data || {};
    if (resp.status === 429) { systemMessage(d.error || "Demasiadas peticiones. Espera un momento.", false); return; }
    if (d.need_captcha) { state.captchaOk = false; updateGate(); return; }
    if (d.reply) {
      messagesArea.appendChild(bubble("assistant", d.reply, false));
      pushLocalMessage(conv, "assistant", d.reply);
    }
    if (d.tokens) state.tokens = d.tokens;
    if (typeof d.titulo === "string") { conv.titulo = d.titulo; renderConversations(); }

    conv.total_palabras = (conv.total_palabras || 0) + text.split(/\s+/).length +
      (d.reply ? d.reply.split(/\s+/).length : 0);

    if (d.need_login) {
      systemMessage("Para continuar la entrevista, inicia sesión.", true);
      messageInput.disabled = true; sendBtn.disabled = true;
    } else if (d.limit_tokens) {
      systemMessage("Has alcanzado el límite de tokens.", false);
      messageInput.disabled = true; sendBtn.disabled = true;
    }
    if (d.abrir_otra || d.limit_words) {
      systemMessage(`Esta conversación llegó a ~${CFG.maxWords} palabras. Abre una nueva para seguir.`, false);
    }

    scrollBottom();
    renderStatus();
    focusInput();
  }

  window.onCaptchaSuccess = async function (token) {
    const { data } = await postJSON(EP.captcha, { token });
    if (data.ok) { state.captchaOk = true; updateGate(); focusInput(); }
  };

  function autoResize() {
    messageInput.style.height = "auto";
    messageInput.style.height = Math.min(messageInput.scrollHeight, 128) + "px";
  }
  messageInput.addEventListener("input", autoResize);
  messageInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  });
  sendBtn.addEventListener("click", sendMessage);
  newChatBtn.addEventListener("click", () => newChat(false));

  loadConversations();
})();
