const express = require('express');
const studentResumeRoutes = express.Router();

studentResumeRoutes.get('/templates', (req, res) => {
  res.json({ message: 'Legacy route disabled.', data: [] });
});

studentResumeRoutes.get('/', (req, res) => {
  res.json({ message: 'Legacy route disabled.', data: [] });
});

studentResumeRoutes.get('/:id', (req, res) => {
  res.status(404).json({ message: 'Legacy route disabled.' });
});

studentResumeRoutes.post('/generate', (req, res) => {
  res.status(400).json({ message: 'Legacy generation is disabled. Please use the ATS engine endpoints.' });
});

module.exports = studentResumeRoutes;
