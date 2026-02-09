const mongoose = require("mongoose");

const connectDB = async (mongoUri) => {
  if (!mongoUri) {
    throw new Error("MONGODB_URI is missing");
  }

  mongoose.set("strictQuery", true);

  await mongoose.connect(mongoUri);
  // eslint-disable-next-line no-console
  console.log("MongoDB connected");
};

module.exports = { connectDB };
