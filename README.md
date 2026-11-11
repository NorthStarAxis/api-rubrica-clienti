# API Rubrica Clienti

API REST per la gestione di una rubrica clienti, costruita con Node.js, Express e
PostgreSQL. Include autenticazione con JWT e password protette da hashing bcrypt.

Progetto realizzato per imparare lo sviluppo backend: ogni scelta tecnica è
motivata nella sezione "Scelte di progetto".

---

## Stack

- **Node.js** + **Express** — server e routing
- **PostgreSQL** (ospitato su Supabase) — database
- **node-postgres (`pg`)** — driver con query SQL scritte a mano
- **bcryptjs** — hashing delle password
- **jsonwebtoken** — autenticazione a token
- **dotenv** — gestione delle variabili d'ambiente

Frontend minimale in HTML, CSS e JavaScript puro, servito dallo stesso server.

---

## Avvio

```bash
git clone https://github.com/NorthStarAxis/api-rubrica-clienti.git
cd api-rubrica-clienti
npm install
```

Crea un file `.env` sulla base di `.env.example`:

```
DATABASE_URL=postgresql://utente:password@host:5432/nome_db
JWT_SECRET=una_stringa_lunga_e_casuale
```

Esegui `schema.sql` sul tuo database per creare le tabelle.

Avvia:

```bash
node server.js
```

Il server risponde su `http://localhost:3000`.

---

## Endpoint

### Autenticazione

| Metodo | Percorso | Descrizione |
|---|---|---|
| `POST` | `/api/registrati` | Crea un utente. Body: `{ email, password }` |
| `POST` | `/api/login` | Restituisce un token JWT valido 2 ore |

### Clienti

| Metodo | Percorso | Auth | Descrizione |
|---|---|---|---|
| `GET` | `/api/clienti` | no | Elenco dei clienti |
| `GET` | `/api/clienti/:id` | no | Un singolo cliente |
| `POST` | `/api/clienti` | sì | Crea un cliente |
| `PUT` | `/api/clienti/:id` | sì | Aggiorna un cliente |
| `DELETE` | `/api/clienti/:id` | sì | Elimina un cliente |

Le rotte protette richiedono l'intestazione:

```
Authorization: Bearer <token>
```

### Esempio

```bash
# Login
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"utente@esempio.it","password":"password123"}'

# Creazione di un cliente
curl -X POST http://localhost:3000/api/clienti \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"nome":"Villa Rosa","email":"info@villarosa.it"}'
```

---

## Codici di stato

| Codice | Quando |
|---|---|
| `200` | Richiesta riuscita |
| `201` | Risorsa creata |
| `204` | Eliminazione riuscita, nessun contenuto |
| `400` | Campi obbligatori mancanti o non validi |
| `401` | Token assente, non valido o scaduto |
| `404` | Risorsa inesistente |
| `409` | Email già presente (violazione del vincolo `unique`) |
| `500` | Errore del server |

---

## Scelte di progetto

**Query SQL scritte a mano invece di un ORM.** Il progetto nasce per imparare SQL:
usare `pg` direttamente rende esplicito cosa viene eseguito sul database.

**Query parametrizzate ovunque.** I valori passano come array separato (`$1`, `$2`) e
mai concatenati nella stringa SQL. È la difesa contro la SQL injection.

**Pool di connessioni.** Aprire una connessione a PostgreSQL è costoso: il pool ne
mantiene alcune riutilizzabili invece di crearne una per richiesta.

**Integrità garantita dal database.** Il vincolo `unique` sull'email impedisce i
duplicati a livello di database, non solo nel codice applicativo: due richieste
simultanee possono superare entrambe un controllo in JavaScript, il vincolo no.
L'errore PostgreSQL `23505` viene intercettato e tradotto in un `409 Conflict`.

**Password con hash bcrypt, cost factor 10.** L'hashing è volutamente lento per
rendere impraticabili gli attacchi a forza bruta. Il salt è generato
automaticamente e incluso nell'hash, così due password identiche producono hash
diversi.

**Messaggi di login volutamente generici.** "Credenziali non valide" sia per email
inesistente sia per password errata, per non permettere di scoprire quali indirizzi
sono registrati (user enumeration).

**Token con scadenza.** I JWT durano 2 ore. Un token firmato è leggibile da
chiunque ma non falsificabile, quindi non contiene dati sensibili.

**Segreti fuori dal codice.** Stringa di connessione e chiave di firma vivono nel
file `.env`, escluso dal versionamento.

---

## Limiti noti

- Nessun test automatico
- Nessun rate limiting sulle rotte di autenticazione
- Nessun refresh token: alla scadenza serve un nuovo login
- Validazione degli input essenziale, senza libreria dedicata
- Non containerizzato
