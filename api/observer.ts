import { VercelRequest, VercelResponse } from '@vercel/node';
import { Observer } from '../src/observer';

export default async (request: VercelRequest, response: VercelResponse) => {
  if (request.query.key !== process.env.OBSERVER_API_KEY) {
    return response.json({ message: 'Invalid api key' });
  }

  try {
    await Observer.checkNewEpisodes()
    response.json({ message: 'Observer: operation completed' });
  } catch (err) {
    response.status(500).json({ message: 'Observer: operation failed' });
    console.error(err)
  }
}
