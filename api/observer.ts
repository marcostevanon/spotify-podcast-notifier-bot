import { Observer } from '../src/observer';

module.exports = async (req, res) => {
  if (req.query.key !== process.env.OBSERVER_API_KEY) {
    return res.json({ message: 'Invalid api key' });
  }

  Observer.checkShow();
  res.json({ message: 'Observer complete' });
}
