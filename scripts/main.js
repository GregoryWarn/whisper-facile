const MODULE_ID = "whisper-facile";
const BUTTON_SELECTOR = '[data-whisper-facile-button="true"]';

Hooks.once("init", () => {
  game.settings.register(MODULE_ID, "keepWindowOpen", {
    name: "WHISPER_FACILE.Settings.KeepWindowOpen.Name",
    hint: "WHISPER_FACILE.Settings.KeepWindowOpen.Hint",
    scope: "client",
    config: true,
    type: Boolean,
    default: false
  });
});

Hooks.once("ready", () => {
  if (game.user?.isGM) console.info(`${MODULE_ID} | Modulo pronto.`);
});

/*
 * In V14 ChatLog è un'ApplicationV2. Il suo hook di rendering riceve
 * l'HTMLElement del contenuto, non la cornice esterna della finestra.
 * Il vecchio codice cercava .window-header dentro quel contenuto e quindi
 * non trovava alcun punto in cui inserire il pulsante.
 */
Hooks.on("renderApplicationV2", (application, element) => {
  if (!game.user?.isGM || !isChatApplication(application)) return;
  insertWhisperButton(application, element);
});

function isChatApplication(application) {
  const ChatLogClass = foundry?.applications?.sidebar?.tabs?.ChatLog;
  if (ChatLogClass && application instanceof ChatLogClass) return true;
  return application?.tabName === "chat" || application?.constructor?.name === "ChatLog";
}

function insertWhisperButton(application, renderedElement) {
  const roots = [
    renderedElement,
    application?.element,
    application?.element?.parentElement,
    document
  ].filter(root => root && typeof root.querySelector === "function");

  // V14: i comandi di visibilità del messaggio si trovano in #message-modes.
  // Inseriamo il pulsante accanto a quel gruppo, nella barra dei controlli Chat.
  const messageModes = findInRoots(roots, "#message-modes");
  const chatControls = findInRoots(roots, ".chat-controls, #chat-controls");
  const chatForm = findInRoots(roots, "#chat-form, .chat-form");

  let host = null;
  let insertAfter = null;

  if (messageModes?.parentElement) {
    host = messageModes.parentElement;
    insertAfter = messageModes;
  } else if (chatControls) {
    host = chatControls;
  } else if (chatForm?.parentElement) {
    // Ripiego per temi/interfacce che non espongono .chat-controls.
    host = chatForm.parentElement;
    insertAfter = null;
  } else if (application?.window?.header) {
    // Utile quando ChatLog è visualizzata come finestra separata.
    host = application.window.header;
  } else if (renderedElement instanceof HTMLElement) {
    // Ultimo ripiego: il pulsante resta comunque dentro il contenuto Chat.
    host = renderedElement;
  }

  if (!host) {
    console.warn(`${MODULE_ID} | Impossibile individuare la barra dei controlli della Chat.`);
    return;
  }

  if (host.querySelector(BUTTON_SELECTOR)) return;

  const button = document.createElement("button");
  button.type = "button";
  button.className = "control-button whisper-facile-button";
  button.dataset.whisperFacileButton = "true";
  button.title = localize("WHISPER_FACILE.ButtonHint", "Invia un sussurro a un giocatore connesso");
  button.setAttribute("aria-label", localize("WHISPER_FACILE.Button", "Whisper"));
  button.innerHTML = '<i class="fas fa-user-secret" aria-hidden="true"></i><span>Whisper</span>';
  button.addEventListener("click", openWhisperDialog);

  if (insertAfter?.parentElement === host) {
    insertAfter.insertAdjacentElement("afterend", button);
  } else {
    host.append(button);
  }
}

function findInRoots(roots, selector) {
  for (const root of roots) {
    const match = root.querySelector(selector);
    if (match) return match;
  }
  return null;
}

function localize(key, fallback) {
  const translated = game.i18n?.localize(key);
  return translated && translated !== key ? translated : fallback;
}

function openWhisperDialog() {
  // Evita finestre duplicate se la finestra Whisper è già aperta.
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
  title.textContent = localize("WHISPER_FACILE.Title", "Invia un Whisper");

  const closeButton = document.createElement("button");
  closeButton.type = "button";
  closeButton.className = "whisper-facile-window-close";
  closeButton.setAttribute("aria-label", "Chiudi finestra Whisper");
  closeButton.title = "Chiudi";
  closeButton.innerHTML = '<i class="fas fa-times" aria-hidden="true"></i>';

  const playerLabel = document.createElement("label");
  playerLabel.htmlFor = "whisper-facile-player";
  playerLabel.textContent = localize("WHISPER_FACILE.Player", "Giocatore connesso");

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
  messageLabel.textContent = localize("WHISPER_FACILE.Message", "Messaggio");

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
  cancel.textContent = localize("WHISPER_FACILE.Cancel", "Chiudi");

  const send = document.createElement("button");
  send.type = "button";
  send.className = "whisper-facile-send";
  send.textContent = localize("WHISPER_FACILE.Send", "Invia Whisper");

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

    // Controlla di nuovo che il destinatario sia ancora connesso.
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

      const keepWindowOpen = game.settings.get(MODULE_ID, "keepWindowOpen");
      if (keepWindowOpen) {
        textarea.value = "";
        send.disabled = false;
        send.textContent = localize("WHISPER_FACILE.Send", "Invia Whisper");
        textarea.focus();
      } else {
        close();
      }
    } catch (error) {
      console.error(`${MODULE_ID} | Errore durante l'invio del Whisper`, error);
      ui.notifications.error("Impossibile inviare il Whisper. Verifica i permessi della chat.");
      send.disabled = false;
      send.textContent = localize("WHISPER_FACILE.Send", "Invia Whisper");
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
