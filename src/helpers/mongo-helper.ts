import { Collection, MongoClient, ObjectId, UpdateWriteOpResult } from "mongodb";
import { Chat } from "telegraf/typings/telegram-types";

export class DbService<T extends MongoEditModel> {
  constructor(
    public collection: Collection
  ) { }

  async create(data: T): Promise<T>;
  async create(data: T[]): Promise<T[]>;
  async create(data: any): Promise<any> {
    if (!Array.isArray(data)) {
      data = [data];
    }
    data.forEach((d: T) => d.createdAt = new Date());
    const result = await this.collection.insertMany(data);

    const ids = Object.values(result.insertedIds);
    return this.collection.find<T>({ _id: { $in: ids } })
      .toArray()
      .then(this.ensureQueryResult);
  }

  async find(query: any): Promise<T[]>;
  async find(query: any, opts?: { limit?: number, orderby?: { [key: string]: number } }): Promise<T[]> {
    return this.collection
      .find<T>(query)
      .limit(opts?.limit ? opts.limit : 0)
      .sort(opts?.orderby ? opts.orderby : {})
      .toArray();
  }

  async update(id: string | ObjectId, data: Partial<T>): Promise<UpdateWriteOpResult> {
    return this.collection.updateOne(
      { _id: id },
      { $set: data }
    );
  }

  async addEpisodes(documentId: ObjectId, episodes: SpotifyApi.EpisodeObjectSimplified) {
    return this.collection.updateOne(
      { _id: documentId },
      { $push: { episodes: { $each: episodes, $position: 0 } } }
    );
  }

  async addToSubscribers(documentId: ObjectId, subscriber: Chat) {
    return this.collection.updateOne(
      { _id: documentId },
      { $push: { subscribers: subscriber } }
    );
  }

  async removeFromSubscribers(showId: string, subscriber: Chat) {
    return this.collection.updateOne(
      { 'show.id': showId },
      { $pull: { subscribers: { id: subscriber.id } } }
    );
  }

  ensureQueryResult = (res: T[]) => {
    if (!res) { return null; }
    if (res.length === 1) { return res[0]; }
    return res;
  }
}

export class DbServiceFactory<T extends MongoEditModel> {
  // Connection URI
  uri = process.env.MONGO_URI;

  async fromCollection(collectionName: string): Promise<DbService<T>> {
    const client = await MongoClient
      .connect(this.uri, { useUnifiedTopology: true, maxIdleTimeMS: 3 * 60 * 1000 })
    const collection = client.db()
      .collection<T>(collectionName)
    return new DbService<T>(collection);
  }
}

interface MongoEditModel {
  createdAt: Date;
}
