const mongoose = require("mongoose");

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
};

module.exports = { connectDB };
