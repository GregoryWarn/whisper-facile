# Whisper Facile

Modulo per [Foundry Virtual Tabletop](https://foundryvtt.com/) che consente al GM di inviare Whisper ai giocatori connessi tramite una finestra dedicata, senza digitare comandi nella chat.

**Versione:** 1.1.0  
**Foundry VTT minimo dichiarato:** 14.370  
**ID del modulo:** `whisper-facile`

## Funzionalità

- Aggiunge il pulsante **Whisper** all'intestazione della finestra Chat (solo GM).
- Mostra i giocatori non-GM attualmente connessi.
- Permette di selezionare il destinatario e comporre un messaggio privato.
- Invia un normale messaggio Whisper tramite il sistema nativo di Foundry.
- Include l'impostazione **Mantieni aperta la finestra Whisper dopo l'invio**.

### Impostazione della finestra

In **Impostazioni → Configura impostazioni → Moduli → Whisper Facile** trovi:

**Mantieni aperta la finestra Whisper dopo l'invio**

- **Disattivata (predefinita):** la finestra si chiude automaticamente dopo l'invio.
- **Attivata:** la finestra resta aperta, il messaggio inviato viene cancellato dal campo e puoi scriverne un altro. Puoi chiuderla con la X, con il pulsante **Chiudi**, cliccando fuori dalla finestra oppure premendo `Esc`.

La preferenza è salvata a livello client.

## Installazione manuale

1. Scarica o estrai la cartella `whisper-facile`.
2. Copiala in `Data/modules/` della tua installazione di Foundry.
3. Riavvia Foundry (oppure ricarica i dati dei moduli).
4. Apri il mondo come GM.
5. Vai in **Impostazioni → Gestione moduli** e attiva **Whisper Facile**.

La cartella installata deve contenere `module.json` direttamente al suo interno.

## Utilizzo

1. Apri la finestra Chat.
2. Premi il pulsante **Whisper** nell'intestazione.
3. Seleziona un giocatore connesso.
4. Scrivi il messaggio e premi **Invia Whisper**.

## Pubblicare questa repository su GitHub

Questa repository include una GitHub Action che prepara automaticamente il pacchetto installabile e il manifest a ogni nuova release.

### 1. Crea la repository

1. Crea su GitHub una nuova repository, preferibilmente pubblica, chiamata `whisper-facile`.
2. Estrai questo archivio sul tuo computer.
3. Carica **tutti i contenuti** della cartella `whisper-facile-github` nella cartella principale della repository GitHub. Non caricare la cartella contenitore come sottocartella: `module.json` e `.github/` devono trovarsi direttamente nella root della repository.
4. Esegui il commit sul branch principale (ad esempio `main`).

Assicurati che GitHub includa anche la cartella nascosta `.github/workflows/`.

### 2. Pubblica la prima release

1. Apri **Settings → Actions → General** della repository e verifica che le GitHub Actions siano abilitate.
2. Apri **Releases → Draft a new release**.
3. Crea il tag `v1.1.0` partendo dal branch principale.
4. Pubblica la release.
5. Apri la scheda **Actions** e attendi che il workflow `Build and publish Foundry module` termini con successo.

La GitHub Action aggiungerà alla release due risorse:
- `module.json`: manifest specifico di quella versione.
- `whisper-facile.zip`: archivio pronto per l'installazione in Foundry.

Il workflow usa il nome effettivo della repository per generare automaticamente gli URL: non devi modificare a mano URL di download o manifest.

### 3. Installa da Foundry

Dopo che la prima release è stata pubblicata con successo, l'indirizzo del manifest da incollare in **Install Module → Manifest URL** sarà:

```text
https://github.com/UTENTE-GITHUB/whisper-facile/releases/latest/download/module.json
```

Sostituisci `UTENTE-GITHUB` con il tuo nome utente o quello dell'organizzazione GitHub. Se hai scelto un nome diverso per la repository, sostituisci anche `whisper-facile` con quel nome.

Questo indirizzo rimane invariato nelle release successive.

## Come pubblicare un aggiornamento

Per ogni aggiornamento:

1. Modifica i file necessari nella repository.
2. Aggiorna il campo `version` in `module.json` usando una nuova versione, ad esempio `1.1.1`.
3. Aggiungi le modifiche a `CHANGELOG.md`.
4. Esegui commit e push sul branch principale.
5. Crea una nuova release GitHub con un tag che corrisponda esattamente alla versione, anteponendo `v` (nell'esempio, `v1.1.1`).
6. Pubblica la release e controlla che la GitHub Action termini correttamente.

La Action verifica che la versione nel tag coincida con quella in `module.json`, crea lo ZIP con la cartella `whisper-facile/` al suo interno e carica lo ZIP e il manifest nella release. Il manifest stabile `releases/latest/download/module.json` punterà così alla versione più recente.

**Importante:** non riutilizzare un tag già pubblicato per una versione diversa. Ogni release deve avere un nuovo numero di versione.

## Struttura della repository

```text
whisper-facile/
├── .github/
│   └── workflows/
│       └── release.yml
├── lang/
│   └── it.json
├── scripts/
│   └── main.js
├── styles/
│   └── main.css
├── .gitignore
├── CHANGELOG.md
├── CONTRIBUTING.md
├── module.json
└── README.md
```

## Compatibilità e note

- Il manifest dichiara Foundry VTT **14.370** come versione minima.
- La compatibilità runtime va verificata nella propria installazione di Foundry; la creazione del pacchetto non equivale a un test su un server reale.
- Il destinatario deve essere connesso al mondo.
- L'invio dipende dai permessi di creazione dei messaggi configurati nel mondo.

## Licenza

Questa repository non include ancora una licenza. Prima di consentire formalmente ad altre persone di riutilizzare, modificare o ridistribuire il codice, aggiungi una licenza che rispecchi le tue intenzioni.
