const { getNtfyConfig } = require('./config');

async function sendSubmissionNotification(record) {
  const { topic, baseUrl } = getNtfyConfig();
  if (!topic) return;

  const message = [
    'New Paint submission queued for review.',
    `Title: ${record.title}`,
    `ID: ${record.id}`,
    `Submitted: ${record.createdAt}`,
  ].join('\n');

  try {
    await fetch(`${baseUrl}/${encodeURIComponent(topic)}`, {
      method: 'POST',
      headers: {
        Title: 'New drawing submission',
        Priority: 'default',
        Tags: 'art,palette',
      },
      body: message,
    });
  } catch (error) {
    console.warn('ntfy notification failed', error);
  }
}

module.exports = {
  sendSubmissionNotification,
};
