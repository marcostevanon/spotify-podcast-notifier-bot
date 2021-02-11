import { Observer } from '../src/observer';

module.exports = async (req, res) => {
  if (req.query.key !== process.env.OBSERVER_API_KEY) {
    return res.json({ message: 'Invalid api key' });
  }

  await Observer.checkNewEpisodes()
  await Observer.checkActiveChats();
  res.json({ message: 'Observer complete' });
}
