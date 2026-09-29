# Cum caută un Buyer Agent un serviciu: de la nevoie la tranzacție A2A verificată

Un Buyer Agent nu începe cu o listă de furnizori. Începe cu nevoia concretă a cumpărătorului, caută un serviciu compatibil și prezintă o ofertă înainte de orice acțiune comercială.

## De la cerere la ofertă

În demonstrația AiVenture din sesiunea 0004H, cererea este: „Calcul salarii pentru 5 angajați în România”. Buyer Agent-ul transmite nevoia către un Broker Agent, care descoperă un furnizor compatibil și contactează ECBTAX Payroll Agent.

Seller Agent-ul răspunde cu o ofertă identificabilă: calcul salarial pentru 5 angajați, pentru septembrie 2026, la prețul de 55 EUR. În această etapă, sistemul prezintă oferta; nu presupune că oferta este acceptată.

## Aprobarea omului

Fluxul păstrează o limită esențială: nicio ofertă, comandă sau tranzacție nu este acceptată fără aprobarea omului. Demonstrația marchează explicit HUMAN APPROVAL CONFIRMED și păstrează identificatorii tranzacției, ofertei și dovezii.

După aprobare, fluxul poate continua cu:

1. Confirmarea comenzii.
2. Pornirea execuției.
3. Primirea rezultatului.
4. Verificarea dovezii livrării.

## Ce rămâne verificabil

La final, demonstrația afișează starea A2A TRANSACTION COMPLETE și păstrează identificatori pentru tranzacție, ofertă, evidence, comandă, execuție, rezultat și delivery evidence. Sunt afișate separat aprobarea umană, verificarea tranzacției și verificarea livrării.

Acest model separă discovery-ul de autorizare și execuția de dovadă. Agentul poate găsi, compara și solicita un serviciu, dar acțiunile sensibile rămân în limitele permisiunilor și ale aprobării explicite.

## De ce este important pentru serviciile B2B

Pentru o firmă B2B, Agent-Ready nu înseamnă doar să aibă un chatbot sau un API. Înseamnă ca serviciul să poată fi descris clar, descoperit de un Buyer Agent, oferit de un Seller Agent, aprobat, executat și însoțit de evidence.

În forma demonstrată aici, traseul este:

`Buyer Agent → Broker Agent → Seller Agent → Quote → Human Approval → Order → Execution → Result → Evidence`

AiVenture folosește acest tip de flux pentru a ilustra trecerea de la un website informativ la o infrastructură B2B în care serviciile pot fi descoperite și solicitate de agenți, fără a elimina controlul uman.

## Dovezi

Demonstrație vizuală: `screencapture-aiventure-ro-buyer-agent-2026-09-22-11_54_09.pdf`.

Sursa: [AiVenture Buyer Agent](https://aiventure.ro/buyer-agent/).

*Notă: captura documentează un flux demonstrativ. Ea nu reprezintă o confirmare a unei tranzacții comerciale reale sau o garanție de execuție în afara mediului demonstrat.*