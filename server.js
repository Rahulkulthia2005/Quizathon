const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(__dirname));

// Serve pages
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'admin.html')));

// ===================
// Question Endpoints
// ===================
app.get('/questions', (req, res) => {
  const file = path.join(__dirname, 'questions.json');
  const data = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file)) : [];
  res.json(data);
});

app.post('/add-question', (req, res) => {
  const { question, options, answer } = req.body;
  if (!question || !Array.isArray(options) || options.length !== 4 || !options.includes(answer)) {
    return res.status(400).json({ message: 'Invalid input or answer not in options' });
  }

  const file = path.join(__dirname, 'questions.json');
  const existing = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file)) : [];

  existing.push({ id: Date.now(), question, options, answer });
  fs.writeFileSync(file, JSON.stringify(existing, null, 2));
  res.json({ message: 'Question added successfully' });
});

app.put('/edit-question/:id', (req, res) => {
  const questionId = parseInt(req.params.id);
  const { question, options, answer } = req.body;

  if (!question || !Array.isArray(options) || options.length !== 4 || !options.includes(answer)) {
    return res.status(400).json({ message: 'Invalid input or answer not in options' });
  }

  const file = path.join(__dirname, 'questions.json');
  let data = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file)) : [];

  const index = data.findIndex(q => q.id === questionId);
  if (index === -1) return res.status(404).json({ message: 'Question not found' });

  data[index] = { id: questionId, question, options, answer };
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
  res.json({ message: 'Question updated successfully' });
});

app.delete('/delete-question/:id', (req, res) => {
  const questionId = parseInt(req.params.id);
  const file = path.join(__dirname, 'questions.json');
  let data = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file)) : [];

  const filtered = data.filter(q => q.id !== questionId);
  if (filtered.length === data.length) return res.status(404).json({ message: 'Question not found' });

  fs.writeFileSync(file, JSON.stringify(filtered, null, 2));
  res.json({ message: 'Question deleted successfully' });
});

// ================
// Quiz Result APIs
// ================
app.get('/results', (req, res) => {
  const file = path.join(__dirname, 'results.json');
  const data = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file)) : [];
  res.json(data);
});

app.post('/submit', (req, res) => {
  const { name, score, department, Reg, section, year, exited } = req.body;

  if (!name || !Reg || !department || !section || !year) {
    return res.status(400).json({ message: 'Incomplete user info' });
  }

  const file = path.join(__dirname, 'results.json');
  const existing = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file)) : [];

  const alreadySubmitted = existing.find(u => u.Reg === Reg && !u.exited);
  if (alreadySubmitted) {
    return res.json({ message: 'Duplicate submission. Already submitted.' });
  }

  const entry = {
    name,
    score,
    department,
    Reg,
    section,
    year,
    exited: !!exited,
    time: new Date().toISOString()
  };

  existing.push(entry);
  fs.writeFileSync(file, JSON.stringify(existing, null, 2));

  if (exited) {
    res.json({ message: 'You exited the quiz. Your previous answers were saved.' });
  } else {
    res.json({ message: 'Quiz completed.' });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running at http://0.0.0.0:${PORT}`);
});

