const crypto = require('crypto');

const {
  clearAdminSession,
  clearOauthState,
  getAdminSession,
  getOauthState,
  requireAdmin,
  setAdminSession,
  setOauthState,
} = require('./auth');
const { ADMIN_PATH, getGitHubConfig } = require('./config');
const {
  buildPublicCommission,
  deleteCommission,
  getCommission,
  getPublicCommissions,
  upsertCommission,
} = require('./commissions-store');
const {
  approveSubmission,
  createSubmission,
  getPublishedDrawing,
  getPublicManifest,
  getSubmissionAsset,
  getSubmissionsManifest,
  rejectSubmission,
  sortSubmissions,
} = require('./drawings-store');
const {
  methodNotAllowed,
  noStore,
  readJsonBody,
  redirect,
  sendError,
  sendJson,
} = require('./http');
const { sendSubmissionNotification } = require('./ntfy');

function assertMethod(req, res, allowedMethods) {
  if (!allowedMethods.includes(req.method)) {
    methodNotAllowed(res, allowedMethods);
    return false;
  }
  return true;
}

function parseSubmissionImage(imageDataUrl) {
  if (
    typeof imageDataUrl !== 'string' ||
    !imageDataUrl.startsWith('data:image/png;base64,')
  ) {
    const error = new Error('Submission must be a PNG image');
    error.statusCode = 400;
    throw error;
  }

  return Buffer.from(
    imageDataUrl.replace('data:image/png;base64,', ''),
    'base64',
  );
}

async function handleCreateSubmission(req, res) {
  if (!assertMethod(req, res, ['POST'])) return;

  try {
    const body = await readJsonBody(req);
    const imageBuffer = parseSubmissionImage(body.imageDataUrl);
    const record = await createSubmission({
      title: body.title,
      imageBuffer,
    });

    await sendSubmissionNotification(record);
    sendJson(res, 201, {
      id: record.id,
      status: record.status,
      title: record.title,
    });
  } catch (error) {
    sendError(res, error.statusCode || 500, error.message || 'Submit failed');
  }
}

async function handleListPublicDrawings(req, res) {
  if (!assertMethod(req, res, ['GET'])) return;

  try {
    const entries = (await getPublicManifest()).map(entry => ({
      ...entry,
      imageUrl: `/api/drawings/image?id=${encodeURIComponent(entry.id)}`,
    }));
    sendJson(res, 200, {
      drawings: entries,
    });
  } catch (error) {
    sendError(
      res,
      error.statusCode || 500,
      error.message || 'Failed to load drawings',
    );
  }
}

async function handleListPublicCommissions(req, res) {
  if (!assertMethod(req, res, ['GET'])) return;

  try {
    sendJson(res, 200, {
      commissions: await getPublicCommissions(),
    });
  } catch (error) {
    sendError(
      res,
      error.statusCode || 500,
      error.message || 'Failed to load commissions',
    );
  }
}

async function handlePublicDrawingImage(req, res) {
  if (!assertMethod(req, res, ['GET'])) return;

  noStore(res);

  try {
    const { id } = req.query || {};
    if (!id) {
      sendError(res, 400, 'Drawing id is required');
      return;
    }

    const drawing = await getPublishedDrawing(id);
    if (!drawing) {
      sendError(res, 404, 'Drawing not found');
      return;
    }

    const asset = await require('@vercel/blob').get(drawing.publicPath, {
      access: 'private',
    });

    if (!asset) {
      sendError(res, 404, 'Drawing image not found');
      return;
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', asset.blob.contentType || 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=60');
    const buffer = Buffer.from(await new Response(asset.stream).arrayBuffer());
    res.end(buffer);
  } catch (error) {
    sendError(
      res,
      error.statusCode || 500,
      error.message || 'Failed to load drawing image',
    );
  }
}

async function handleAdminSession(req, res) {
  if (!assertMethod(req, res, ['GET'])) return;

  noStore(res);
  const session = getAdminSession(req);
  if (!session) {
    sendError(res, 401, 'Not authenticated');
    return;
  }

  sendJson(res, 200, {
    authenticated: true,
    login: session.login,
  });
}

async function handleAdminSubmissions(req, res) {
  if (!assertMethod(req, res, ['GET'])) return;

  noStore(res);
  const session = requireAdmin(req, res);
  if (!session) return;

  try {
    const entries = sortSubmissions(await getSubmissionsManifest()).map(
      entry => ({
        ...entry,
        previewUrl: `/api/admin/drawings/image?id=${encodeURIComponent(
          entry.id,
        )}`,
      }),
    );
    sendJson(res, 200, {
      submissions: entries,
      reviewer: session.login,
    });
  } catch (error) {
    sendError(
      res,
      error.statusCode || 500,
      error.message || 'Failed to load submissions',
    );
  }
}

async function handleAdminCommissions(req, res) {
  if (!assertMethod(req, res, ['GET', 'POST'])) return;

  noStore(res);
  const session = requireAdmin(req, res);
  if (!session) return;

  try {
    if (req.method === 'GET') {
      const commissions = await getPublicCommissions();
      sendJson(res, 200, {
        commissions,
        reviewer: session.login,
      });
      return;
    }

    const body = await readJsonBody(req);
    const record = await upsertCommission(body);
    sendJson(res, 200, {
      ok: true,
      commission: buildPublicCommission(record),
    });
  } catch (error) {
    sendError(
      res,
      error.statusCode || 500,
      error.message || 'Commission save failed',
    );
  }
}

async function handleAdminSubmissionImage(req, res) {
  if (!assertMethod(req, res, ['GET'])) return;

  noStore(res);
  const session = requireAdmin(req, res);
  if (!session) return;

  try {
    const { id } = req.query || {};
    if (!id) {
      sendError(res, 400, 'Submission id is required');
      return;
    }

    const submission = await getSubmissionAsset(id);
    if (!submission) {
      sendError(res, 404, 'Submission not found');
      return;
    }

    const asset = await require('@vercel/blob').get(submission.submissionPath, {
      access: 'private',
    });

    if (!asset) {
      sendError(res, 404, 'Submission image not found');
      return;
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', asset.blob.contentType || 'image/png');
    res.setHeader('Cache-Control', 'no-store');
    const buffer = Buffer.from(await new Response(asset.stream).arrayBuffer());
    res.end(buffer);
  } catch (error) {
    sendError(
      res,
      error.statusCode || 500,
      error.message || 'Failed to load submission image',
    );
  }
}

async function handlePublicCommissionImage(req, res) {
  if (!assertMethod(req, res, ['GET'])) return;

  noStore(res);

  try {
    const { id } = req.query || {};
    if (!id) {
      sendError(res, 400, 'Commission id is required');
      return;
    }

    const commission = await getCommission(id);
    if (!commission) {
      sendError(res, 404, 'Commission not found');
      return;
    }

    const asset = await require('@vercel/blob').get(commission.assetPath, {
      access: 'private',
    });

    if (!asset) {
      sendError(res, 404, 'Commission image not found');
      return;
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', asset.blob.contentType || 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=60');
    const buffer = Buffer.from(await new Response(asset.stream).arrayBuffer());
    res.end(buffer);
  } catch (error) {
    sendError(
      res,
      error.statusCode || 500,
      error.message || 'Failed to load commission image',
    );
  }
}

async function handleApproveSubmission(req, res) {
  if (!assertMethod(req, res, ['POST'])) return;

  noStore(res);
  const session = requireAdmin(req, res);
  if (!session) return;

  try {
    const body = await readJsonBody(req);
    if (!body.id) {
      sendError(res, 400, 'Submission id is required');
      return;
    }

    const result = await approveSubmission(body.id, session.login);
    sendJson(res, 200, {
      ok: true,
      submission: result.record,
      drawing: result.publicRecord,
    });
  } catch (error) {
    sendError(res, error.statusCode || 500, error.message || 'Approve failed');
  }
}

async function handleDeleteCommission(req, res) {
  if (!assertMethod(req, res, ['POST'])) return;

  noStore(res);
  const session = requireAdmin(req, res);
  if (!session) return;

  try {
    const body = await readJsonBody(req);
    if (!body.id) {
      sendError(res, 400, 'Commission id is required');
      return;
    }

    const record = await deleteCommission(body.id);
    sendJson(res, 200, {
      ok: true,
      commission: buildPublicCommission(record),
    });
  } catch (error) {
    sendError(
      res,
      error.statusCode || 500,
      error.message || 'Commission delete failed',
    );
  }
}

async function handleRejectSubmission(req, res) {
  if (!assertMethod(req, res, ['POST'])) return;

  noStore(res);
  const session = requireAdmin(req, res);
  if (!session) return;

  try {
    const body = await readJsonBody(req);
    if (!body.id) {
      sendError(res, 400, 'Submission id is required');
      return;
    }

    const submission = await rejectSubmission(
      body.id,
      session.login,
      body.reason || '',
    );
    sendJson(res, 200, {
      ok: true,
      submission,
    });
  } catch (error) {
    sendError(res, error.statusCode || 500, error.message || 'Reject failed');
  }
}

async function handleAdminLogout(req, res) {
  if (!assertMethod(req, res, ['POST'])) return;

  clearAdminSession(res);
  sendJson(res, 200, { ok: true });
}

async function handleGitHubStart(req, res) {
  if (!assertMethod(req, res, ['GET'])) return;

  const { clientId, callbackUrl } = getGitHubConfig(req);
  if (!clientId) {
    redirect(res, `${ADMIN_PATH}?error=oauth_unconfigured`);
    return;
  }

  const state = crypto.randomBytes(16).toString('hex');
  setOauthState(res, state);

  const authorizeUrl = new URL('https://github.com/login/oauth/authorize');
  authorizeUrl.searchParams.set('client_id', clientId);
  authorizeUrl.searchParams.set('scope', 'read:user');
  authorizeUrl.searchParams.set('state', state);
  authorizeUrl.searchParams.set('redirect_uri', callbackUrl);

  redirect(res, authorizeUrl.toString());
}

async function exchangeGitHubCode(code, callbackUrl, clientId, clientSecret) {
  const tokenResponse = await fetch(
    'https://github.com/login/oauth/access_token',
    {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: callbackUrl,
      }),
    },
  );

  if (!tokenResponse.ok) {
    throw new Error('GitHub token exchange failed');
  }

  const tokenData = await tokenResponse.json();
  if (!tokenData.access_token) {
    throw new Error('GitHub access token missing');
  }

  const userResponse = await fetch('https://api.github.com/user', {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${tokenData.access_token}`,
      'User-Agent': 'xp-drawings-admin',
    },
  });

  if (!userResponse.ok) {
    throw new Error('GitHub user lookup failed');
  }

  return userResponse.json();
}

async function handleGitHubCallback(req, res) {
  if (!assertMethod(req, res, ['GET'])) return;

  const { clientId, clientSecret, adminLogin, callbackUrl } = getGitHubConfig(
    req,
  );
  if (!clientId || !clientSecret || !adminLogin) {
    redirect(res, `${ADMIN_PATH}?error=oauth_unconfigured`);
    return;
  }

  const expectedState = getOauthState(req);
  const { code, state } = req.query || {};

  if (!expectedState || !state || state !== expectedState) {
    clearOauthState(res);
    redirect(res, `${ADMIN_PATH}?error=oauth_state`);
    return;
  }

  try {
    const user = await exchangeGitHubCode(
      code,
      callbackUrl,
      clientId,
      clientSecret,
    );
    clearOauthState(res);

    if (!user.login || user.login.toLowerCase() !== adminLogin.toLowerCase()) {
      clearAdminSession(res);
      redirect(res, `${ADMIN_PATH}?error=forbidden`);
      return;
    }

    setAdminSession(res, user.login);
    redirect(res, ADMIN_PATH);
  } catch (error) {
    clearOauthState(res);
    redirect(res, `${ADMIN_PATH}?error=oauth_failed`);
  }
}

module.exports = {
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
  handlePublicDrawingImage,
  handlePublicCommissionImage,
  handleListPublicDrawings,
  handleRejectSubmission,
};
