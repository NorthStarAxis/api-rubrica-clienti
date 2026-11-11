const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const express = require('express');
const pool = require('./db');
const app = express();

app.use(express.json());
app.use(express.static('public'));

app.get('/api/clienti', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'select id, nome, email from clienti order by id'
    );
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ errore: 'Errore del server' });
  }
});

app.get('/api/clienti/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'select id, nome, email from clienti where id = $1',
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ errore: 'Cliente non trovato' });
    }
    res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ errore: 'Errore del server' });
  }
});

app.post('/api/clienti', autenticato, async (req, res) => {
  const { nome, email } = req.body;
  if (!nome || !email) {
    return res.status(400).json({ errore: 'nome ed email sono obbligatori' });
  }
  try {
    const { rows } = await pool.query(
      'insert into clienti (nome, email) values ($1, $2) returning id, nome, email',
      [nome, email]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    if (e.code === '23505') {
      return res.status(409).json({ errore: 'Email già presente' });
    }
    console.error(e);
    res.status(500).json({ errore: 'Errore del server' });
  }
});

app.put('/api/clienti/:id', autenticato, async (req, res) => {
  const { nome, email } = req.body;
  try {
    const { rows } = await pool.query(
      `update clienti
          set nome  = coalesce($1, nome),
              email = coalesce($2, email)
        where id = $3
        returning id, nome, email`,
      [nome ?? null, email ?? null, req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ errore: 'Cliente non trovato' });
    }
    res.json(rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ errore: 'Errore del server' });
  }
});

app.delete('/api/clienti/:id', autenticato, async (req, res) => {
  try {
    const r = await pool.query('delete from clienti where id = $1', [req.params.id]);
    if (r.rowCount === 0) {
      return res.status(404).json({ errore: 'Cliente non trovato' });
    }
    res.status(204).end();
  } catch (e) {
    console.error(e);
    res.status(500).json({ errore: 'Errore del server' });
  }
});

function autenticato(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ errore: 'Token mancante' });
  }
  const token = header.split(' ')[1];
  try {
    req.utente = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (e) {
    return res.status(401).json({ errore: 'Token non valido o scaduto' });
  }
}

// REGISTRAZIONE
app.post('/api/registrati', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ errore: 'email e password obbligatorie' });
  }
  if (password.length < 8) {
    return res.status(400).json({ errore: 'La password deve avere almeno 8 caratteri' });
  }
  try {
    const hash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      'insert into utenti (email, password) values ($1, $2) returning id, email',
      [email, hash]
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    if (e.code === '23505') {
      return res.status(409).json({ errore: 'Email già registrata' });
    }
    console.error(e);
    res.status(500).json({ errore: 'Errore del server' });
  }
});

// LOGIN
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const { rows } = await pool.query(
      'select id, email, password from utenti where email = $1',
      [email]
    );
    const utente = rows[0];

    if (!utente || !(await bcrypt.compare(password, utente.password))) {
      return res.status(401).json({ errore: 'Credenziali non valide' });
    }

    const token = jwt.sign(
      { id: utente.id, email: utente.email },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );
    res.json({ token });
  } catch (e) {
    console.error(e);
    res.status(500).json({ errore: 'Errore del server' });
  }
});

app.listen(3000, () => console.log('Server acceso su http://localhost:3000'));