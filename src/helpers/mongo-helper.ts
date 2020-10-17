import { Collection, MongoClient, ObjectId, UpdateWriteOpResult } from "mongodb";

export class DbService<T extends MongoEditModel> {
  constructor(
    protected collection: Collection
  ) { }

  async create(data: Partial<T>): Promise<T>;
  async create(data: Partial<T>[]): Promise<T[]>;
  async create(data: any): Promise<any> {
    if (!Array.isArray(data)) {
      data = [data];
    }
    data.forEach((d: T) => d.createdAt = new Date());
    const result = await this.collection.insertMany(data);

    return this.collection.find<T>({ _id: { $in: Object.values(result.insertedIds) } })
      .toArray()
      .then(this.ensureQueryResult);
  }

  async find(query: any): Promise<T[]> {
    return this.collection
      .find<T>(query)
      .toArray();
  }

  async update(id: string | ObjectId, data: Partial<T>): Promise<UpdateWriteOpResult> {
    return this.collection
      .updateOne({ _id: id }, { $set: data });
  }

  ensureQueryResult = (res: T[]) => {
    if (!res) {
      return null;
    }
    if (res.length === 1) {
      return res[0];
    }
    return res;
  }
}

export class DbServiceFactory<T extends MongoEditModel> {
  // Connection URI
  uri = process.env.MONGO_URI;

  async fromCollection(collectionName: string): Promise<DbService<T>> {
    const client = await MongoClient
      .connect(this.uri, { useUnifiedTopology: true })
    const collection = client.db()
      .collection<T>(collectionName)
    return new DbService<T>(collection);
  }
}

interface MongoEditModel {
  createdAt: Date;
}
