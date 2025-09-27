const express = require('express');
const repo = require('./pets');
const app = express();

app.use(express.json());

// petit logger
app.use((req, _res, next) => { console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`); next(); });

app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.get('/', (_req, res) => { res.json({ service: 'pets-service', message: 'PixelPets API OK', time: new Date().toISOString() }); });

app.post('/echo', (req, res) => res.json({ok:true, body:req.body}));


// LIST
app.get('/pets', async (_req, res) => res.json(await repo.list()));

// CREATE
app.post('/pets', async (req, res) => {
  const { name, species } = req.body || {};
  if (!name || !species) return res.status(400).json({ error: 'name and species are required' });
  const t0 = Date.now();
  try {
    const pet = await repo.create({ name, species });
    console.log('CREATE /pets done in', Date.now()-t0, 'ms');
    res.status(201).json(pet);
  } catch (e) {
    console.error('CREATE /pets error after', Date.now()-t0, 'ms', e);
    res.status(500).json({ error: 'db_error', detail: String(e) });
  }
});


// READ
app.get('/pets/:id', async (req, res) => {
  const pet = await repo.get(req.params.id);
  if (!pet) return res.status(404).json({ error: 'not found' });
  res.json(pet);
});

// UPDATE
app.put('/pets/:id', async (req, res) => {
  const pet = await repo.update(req.params.id, req.body || {});
  if (!pet) return res.status(404).json({ error: 'not found' });
  res.json(pet);
});

// DELETE
app.delete('/pets/:id', async (req, res) => {
  const ok = await repo.remove(req.params.id);
  if (!ok) return res.status(404).json({ error: 'not found' });
  res.status(204).send();
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`pets-service listening on port ${port}`));
