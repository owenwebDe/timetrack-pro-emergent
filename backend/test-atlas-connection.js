// Create file: test-atlas-connection.js
const mongoose = require("mongoose");
require("dotenv").config();

const testAtlasConnection = async () => {
  try {
    console.log("Testing MongoDB Atlas connection...");

    const mongoURL = process.env.MONGO_URL;
    if (!mongoURL) {
      throw new Error("MONGO_URL environment variable is not defined");
    }

    // Hide credentials in log
    const sanitizedURL = mongoURL.replace(/\/\/[^:]*:[^@]*@/, "//***:***@");
    console.log("Connecting to:", sanitizedURL);

    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      family: 4, // Use IPv4
      retryWrites: true,
      w: "majority",
    };

    await mongoose.connect(mongoURL, options);
    console.log("✅ MongoDB Atlas connection successful!");

    // Test database operations
    const testSchema = new mongoose.Schema({
      name: String,
      createdAt: { type: Date, default: Date.now },
    });

    const TestModel = mongoose.model("ConnectionTest", testSchema);

    // Create a test document
    const testDoc = new TestModel({ name: "Atlas Connection Test" });
    await testDoc.save();
    console.log("✅ Document creation successful!");

    // Read the document
    const foundDoc = await TestModel.findOne({ name: "Atlas Connection Test" });
    console.log("✅ Document read successful:", foundDoc.name);

    // Clean up
    await TestModel.deleteMany({});
    console.log("✅ Cleanup successful!");

    await mongoose.connection.close();
    console.log("✅ All tests passed! MongoDB Atlas is working correctly.");
    process.exit(0);
  } catch (error) {
    console.error("❌ MongoDB Atlas connection failed:");
    console.error("Error:", error.message);

    if (error.message.includes("ENOTFOUND")) {
      console.error(
        "🔧 Fix: Check your internet connection and MongoDB Atlas URL"
      );
    } else if (error.message.includes("authentication failed")) {
      console.error("🔧 Fix: Check your MongoDB Atlas username and password");
    } else if (error.message.includes("not authorized")) {
      console.error("🔧 Fix: Check your MongoDB Atlas user permissions");
    } else if (error.message.includes("network")) {
      console.error(
        "🔧 Fix: Check your internet connection and MongoDB Atlas network access settings"
      );
    }

    process.exit(1);
  }
};

testAtlasConnection();

// Run this with: node test-atlas-connection.js
