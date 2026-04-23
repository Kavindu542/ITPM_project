const mongoose = require("mongoose");

const dropTtlIndexIfPresent = async (collection, indexName) => {
  try {
    const idx = await collection.indexes();
    const found = (idx || []).find((i) => i?.name === indexName);
    const hasTtl = found && Object.prototype.hasOwnProperty.call(found, "expireAfterSeconds");
    if (!hasTtl) return;
    await collection.dropIndex(indexName);
    // eslint-disable-next-line no-console
    console.log(`Dropped TTL index ${collection.collectionName}.${indexName}`);
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
      await dropTtlIndexIfPresent(db.collection("meetings"), "date_1");
      await dropTtlIndexIfPresent(db.collection("events"), "date_1");
    }
  } catch {
    // ignore
  }
};

module.exports = { connectDB };
