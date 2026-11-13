# Contribuire

Grazie per l'interesse verso Whisper Facile.

## Segnalare un problema

Apri una Issue e indica:
- versione di Foundry VTT;
- versione di Whisper Facile;
- passaggi per riprodurre il problema;
- comportamento atteso e comportamento osservato;
- eventuali errori rilevanti dalla console del browser.

Non includere password, token, link privati o dati personali.

## Proporre una modifica

1. Crea un fork della repository.
2. Crea un branch dedicato.
3. Apporta la modifica e verifica almeno la sintassi JavaScript e la validità dei file JSON.
4. Aggiorna `CHANGELOG.md` se la modifica è rilevante.
5. Apri una Pull Request descrivendo cosa cambia e come hai verificato il risultato.

## Versioni e release

Le release usano tag Git nel formato `vMAJOR.MINOR.PATCH`, ad esempio `v1.1.1`.
Il campo `version` in `module.json` deve coincidere con il tag senza la `v`.
La GitHub Action crea gli asset della release.
