export default function handler(request, response) {
  if (request.method === 'GET') {
    const mode = request.query['hub.mode'];
    const token = request.query['hub.verify_token'];
    const challenge = request.query['hub.challenge'];

    if (mode === 'subscribe' && token === 'mysecrettoken123') {
      return response
        .status(200)
        .setHeader('Content-Type', 'text/plain')
        .send(challenge);
    }

    return response.status(403).send('Forbidden');
  }

  if (request.method === 'POST') {
    return response.status(200).send('EVENT_RECEIVED');
  }

  return response.status(405).send('Method Not Allowed');
}