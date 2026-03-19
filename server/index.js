const express = require('express');

const {
  handleAdminCommissions,
  handleDeleteCommission,
  handleAdminLogout,
  handleAdminSubmissionImage,
  handleAdminSession,
  handleAdminSubmissions,
  handleApproveSubmission,
  handleCreateSubmission,
  handleGitHubCallback,
  handleGitHubStart,
  handleListPublicCommissions,
  handleListPublicDrawings,
  handlePublicDrawingImage,
  handlePublicCommissionImage,
  handleRejectSubmission,
} = require('../api/_lib/handlers');

const PORT = Number(process.env.DRAWINGS_SERVER_PORT || 4748);
const app = express();

app.use(express.json({ limit: '10mb' }));

app.post('/api/drawings/submissions', handleCreateSubmission);
app.get('/api/drawings/public', handleListPublicDrawings);
app.get('/api/drawings/image', handlePublicDrawingImage);
app.get('/api/commissions/public', handleListPublicCommissions);
app.get('/api/commissions/image', handlePublicCommissionImage);
app.get('/api/admin/session', handleAdminSession);
app.post('/api/admin/logout', handleAdminLogout);
app.get('/api/admin/drawings/submissions', handleAdminSubmissions);
app.get('/api/admin/drawings/image', handleAdminSubmissionImage);
app.post('/api/admin/drawings/approve', handleApproveSubmission);
app.post('/api/admin/drawings/reject', handleRejectSubmission);
app.get('/api/admin/commissions', handleAdminCommissions);
app.post('/api/admin/commissions', handleAdminCommissions);
app.post('/api/admin/commissions/delete', handleDeleteCommission);
app.get('/api/admin/oauth/github/start', handleGitHubStart);
app.get('/api/admin/oauth/github/callback', handleGitHubCallback);

app.listen(PORT, () => {
  console.log(`Drawings API listening on http://127.0.0.1:${PORT}`);
});
