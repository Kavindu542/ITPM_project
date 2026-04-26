const mongoose = require("mongoose");

const dropAllTtlIndexes = async (collection) => {
  try {
    const idx = await collection.indexes();
    const ttl = (idx || []).filter((i) => Object.prototype.hasOwnProperty.call(i || {}, "expireAfterSeconds"));
    if (!ttl.length) return;

    for (const i of ttl) {
      if (!i?.name) continue;
      try {
        await collection.dropIndex(i.name);
        // eslint-disable-next-line no-console
        console.log(`Dropped TTL index ${collection.collectionName}.${i.name}`);
      } catch {
        // ignore
      }
    }
  } catch {
    // ignore (collection/index may not exist yet)
  }
};

const connectDB = async (mongoUri) => {
  // Apply safe global defaults even if we never connect.
  // This prevents Mongoose from buffering queries (and timing out/crashing)
  // when the app is running without a DB connection.
  mongoose.set("strictQuery", true);
  mongoose.set("bufferCommands", false);
  mongoose.set("bufferTimeoutMS", 0);

  if (!mongoUri) {
    throw new Error("MONGODB_URI is missing");
  }

  await mongoose.connect(mongoUri, {
    bufferCommands: false,
    bufferTimeoutMS: 0,
  });
  // eslint-disable-next-line no-console
  console.log("MongoDB connected");

  // If older versions of the app created TTL indexes on meetings/events, remove them.
  // We retain past meetings/events for club leader reports.
  try {
    const db = mongoose.connection.db;
    if (db) {
      await dropAllTtlIndexes(db.collection("meetings"));
      await dropAllTtlIndexes(db.collection("events"));
    }
  } catch {
    // ignore
  }
};

module.exports = { connectDB };
