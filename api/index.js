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
  handlePublicCommissionImage,
  handlePublicDrawingImage,
  handleRejectSubmission,
  handleUploadCommissionImage,
} = require('./_lib/handlers');
const { sendError } = require('./_lib/http');

const ROUTE_HANDLERS = {
  'admin/commissions': handleAdminCommissions,
  'admin/commissions/upload': handleUploadCommissionImage,
  'admin/commissions/delete': handleDeleteCommission,
  'admin/drawings/approve': handleApproveSubmission,
  'admin/drawings/image': handleAdminSubmissionImage,
  'admin/drawings/reject': handleRejectSubmission,
  'admin/drawings/submissions': handleAdminSubmissions,
  'admin/logout': handleAdminLogout,
  'admin/oauth/github/callback': handleGitHubCallback,
  'admin/oauth/github/start': handleGitHubStart,
  'admin/session': handleAdminSession,
  'commissions/image': handlePublicCommissionImage,
  'commissions/public': handleListPublicCommissions,
  'drawings/image': handlePublicDrawingImage,
  'drawings/public': handleListPublicDrawings,
  'drawings/submissions': handleCreateSubmission,
};

function getRouteKey(req) {
  const route = req.query?.route;
  if (Array.isArray(route)) {
    return route.join('/');
  }

  return typeof route === 'string' ? route.replace(/^\/+|\/+$/g, '') : '';
}

module.exports = async function handler(req, res) {
  const routeKey = getRouteKey(req);
  const routeHandler = ROUTE_HANDLERS[routeKey];

  if (!routeHandler) {
    sendError(res, 404, 'Not found');
    return;
  }

  await routeHandler(req, res);
};

module.exports.config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};
