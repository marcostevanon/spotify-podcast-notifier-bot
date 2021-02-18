import { VercelRequest, VercelResponse } from '@vercel/node';

export default async (request: VercelRequest, response: VercelResponse) => {
  response.json({ message: 'Non implemented' });
}
