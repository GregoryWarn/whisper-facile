const MODULE_ID = "whisper-facile";

Hooks.once("init", () => {
  game.settings.register(MODULE_ID, "keepWindowOpen", {
    name: "WHISPER_FACILE.Settings.KeepWindowOpen.Name",
    hint: "WHISPER_FACILE.Settings.KeepWindowOpen.Hint",
    scope: "client",
    config: true,
    type: new foundry.fields.BooleanField(),
    default: false
  });
});

Hooks.once("ready", () => {
  if (!game.user?.isGM) return;
  console.info(`${MODULE_ID} | Modulo pronto.`);
});

Hooks.on("renderChatLog", (app, html) => {
  if (!game.user?.isGM) return;

  // V14 fornisce un HTMLElement; il fallback mantiene compatibilità con wrapper jQuery.
  const root = html instanceof HTMLElement ? html : html?.[0];
  if (!root || root.querySelector('[data-whisper-facile-button="true"]')) return;

  const header = root.querySelector(".window-header");
  if (!header) return;

  const button = document.createElement("button");
  button.type = "button";
  button.className = "whisper-facile-button";
  button.dataset.whisperFacileButton = "true";
  button.innerHTML = '<i class="fas fa-user-secret" aria-hidden="true"></i><span>Whisper</span>';
  button.title = "Invia un sussurro a un giocatore connesso";
  button.addEventListener("click", openWhisperDialog);
  header.appendChild(button);
});

function openWhisperDialog() {
  // Evita finestre duplicate se la finestra è già aperta.
  const existing = document.querySelector(".whisper-facile-overlay");
  if (existing) {
    existing.querySelector("textarea")?.focus();
    return;
  }

  const players = game.users
    .filter(user => user.active && !user.isGM && user.id !== game.user.id)
    .sort((a, b) => a.name.localeCompare(b.name));

  if (!players.length) {
    ui.notifications.warn("Non ci sono giocatori connessi a cui inviare un Whisper.");
    return;
  }

  const keepWindowOpen = game.settings.get(MODULE_ID, "keepWindowOpen");
  const overlay = document.createElement("div");
  overlay.className = "whisper-facile-overlay";

  const dialog = document.createElement("section");
  dialog.className = "whisper-facile-dialog";
  dialog.setAttribute("role", "dialog");
  dialog.setAttribute("aria-modal", "true");
  dialog.setAttribute("aria-labelledby", "whisper-facile-title");

  const titleBar = document.createElement("div");
  titleBar.className = "whisper-facile-titlebar";

  const title = document.createElement("h2");
  title.id = "whisper-facile-title";
  title.textContent = "Invia un Whisper";

  const closeButton = document.createElement("button");
  closeButton.type = "button";
  closeButton.className = "whisper-facile-window-close";
  closeButton.setAttribute("aria-label", "Chiudi finestra Whisper");
  closeButton.title = "Chiudi";
  closeButton.innerHTML = '<i class="fas fa-times" aria-hidden="true"></i>';

  const playerLabel = document.createElement("label");
  playerLabel.htmlFor = "whisper-facile-player";
  playerLabel.textContent = "Giocatore connesso";

  const select = document.createElement("select");
  select.id = "whisper-facile-player";
  for (const player of players) {
    const option = document.createElement("option");
    option.value = player.id;
    option.textContent = player.name;
    select.appendChild(option);
  }

  const messageLabel = document.createElement("label");
  messageLabel.htmlFor = "whisper-facile-message";
  messageLabel.textContent = "Messaggio";

  const textarea = document.createElement("textarea");
  textarea.id = "whisper-facile-message";
  textarea.rows = 5;
  textarea.maxLength = 10000;
  textarea.placeholder = "Scrivi qui il messaggio privato…";

  const actions = document.createElement("div");
  actions.className = "whisper-facile-actions";

  const cancel = document.createElement("button");
  cancel.type = "button";
  cancel.className = "whisper-facile-cancel";
  cancel.textContent = "Chiudi";

  const send = document.createElement("button");
  send.type = "button";
  send.className = "whisper-facile-send";
  send.textContent = "Invia Whisper";

  let isClosed = false;
  const close = () => {
    if (isClosed) return;
    isClosed = true;
    overlay.remove();
    document.removeEventListener("keydown", onKeyDown);
  };

  closeButton.addEventListener("click", close);
  cancel.addEventListener("click", close);
  overlay.addEventListener("click", event => {
    if (event.target === overlay) close();
  });

  send.addEventListener("click", async () => {
    const recipientId = select.value;
    const content = textarea.value.trim();
    if (!content) {
      ui.notifications.warn("Scrivi un messaggio prima di inviare.");
      textarea.focus();
      return;
    }

    // Verifica nuovamente che il destinatario sia ancora connesso.
    const recipient = game.users.get(recipientId);
    if (!recipient || !recipient.active || recipient.isGM) {
      ui.notifications.warn("Il giocatore selezionato non è più connesso.");
      close();
      return;
    }

    send.disabled = true;
    send.textContent = "Invio…";
    try {
      await ChatMessage.create({
        content: foundry.utils.escapeHTML(content).replace(/\n/g, "<br>"),
        whisper: [recipient.id],
        speaker: ChatMessage.getSpeaker({ user: game.user })
      });

      ui.notifications.info(`Whisper inviato a ${recipient.name}.`);

      if (keepWindowOpen) {
        // Mantiene la finestra e il destinatario selezionato, pronta per il messaggio successivo.
        textarea.value = "";
        send.disabled = false;
        send.textContent = "Invia Whisper";
        textarea.focus();
      } else {
        close();
      }
    } catch (error) {
      console.error(`${MODULE_ID} | Errore durante l'invio del Whisper`, error);
      ui.notifications.error("Impossibile inviare il Whisper. Verifica i permessi della chat.");
      send.disabled = false;
      send.textContent = "Invia Whisper";
    }
  });

  titleBar.append(title, closeButton);
  actions.append(cancel, send);
  dialog.append(titleBar, playerLabel, select, messageLabel, textarea, actions);
  overlay.appendChild(dialog);
  document.body.appendChild(overlay);
  textarea.focus();

  function onKeyDown(event) {
    if (event.key === "Escape") close();
  }
  document.addEventListener("keydown", onKeyDown);
}
