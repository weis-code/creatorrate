/**
 * Send a message to the configured Slack webhook (fire-and-forget).
 * Set SLACK_WEBHOOK_URL in your environment variables.
 */
export async function notifySlack(text: string): Promise<void> {
  const url = process.env.SLACK_WEBHOOK_URL
  if (!url) return
  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  }).catch(() => {})
}
