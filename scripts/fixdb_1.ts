import { DbServiceFactory } from "../src/helpers/mongo-helper";
import { Collections } from "../src/models/mongo-collections";
import { Podcast } from "../src/models/podcasts";
import { config } from 'dotenv';

async function fixDb() {
  config()

  try {
    const podcastCollection = await new DbServiceFactory<Podcast>()
      .fromCollection(Collections.PODCASTS)

    // old podcasts already saved in mongodb
    const oldPodcasts = await podcastCollection.collection.find({}).toArray();

    const newPodcasts: Podcast[] = [];
    for (let op of oldPodcasts) {

      // every for cycle check if show.id is already inserted in newPodcasts array
      const found = newPodcasts.find(np => np.show.id === op.showInfo.id);

      // not exist, new podcast, add to array
      if (!found) {
        const newP = new Podcast(op.showInfo);
        delete (newP as any).show.episodes;   // delete rendundant episodes
        newP.subscribers.push(op.userInfo);
        newPodcasts.push(newP);
        continue;
      }

      // already existing, add subscriber if not already present
      const subFound = found.subscribers.find(s => s.id === op.userInfo.id);
      if (!subFound) {
        found.subscribers.push(op.userInfo);
        continue;
      }
    }

    console.log('old documents', oldPodcasts.length);
    console.log('new documents', newPodcasts.length);

  } catch (err) {
    console.log(err);
  }
}

fixDb();
