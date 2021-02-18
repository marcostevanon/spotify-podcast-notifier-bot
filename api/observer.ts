import { VercelRequest, VercelResponse } from '@vercel/node';
import { Observer } from '../src/observer';

export default async (request: VercelRequest, response: VercelResponse) => {
  if (request.query.key !== process.env.OBSERVER_API_KEY) {
    return response.json({ message: 'Invalid api key' });
  }

  response.json({ message: 'Observer: operation started' });

  try {
    await Observer.checkNewEpisodes()
  } catch (err) {
    console.error(err)
  }
}
