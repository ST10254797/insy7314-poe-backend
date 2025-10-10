require('dotenv').config();  // loads your .env
const mongoose = require('mongoose');
const User = require('../Models/userModel');

jest.setTimeout(30000); // increase timeout for async DB operations

describe("User model", () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI);
  });

  afterEach(async () => {
    await User.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it("should create a User instance", () => {
    const user = new User({
      fullName: "Test User",
      IDNumber: "1234567890123",
      AccNumber: 123456,
      userName: "testuser",
      password: "password123"
    });

    expect(user.fullName).toBe("Test User");
    expect(user.IDNumber).toBe("1234567890123");
    expect(user.AccNumber).toBe(123456);
    expect(user.userName).toBe("testuser");
  });

  it("should hash password before save", async () => {
    const user = new User({
      fullName: "Hash Test",
      IDNumber: "9876543210987",
      AccNumber: 654321,
      userName: "hashtest",
      password: "mypassword"
    });

    await user.save(); // triggers pre-save hook
    expect(user.password).not.toBe("mypassword"); // should be hashed
  });

  it("should compare password correctly", async () => {
    const user = new User({
      fullName: "Compare Test",
      IDNumber: "1112223334445",
      AccNumber: 111222,
      userName: "comparetest",
      password: "mypassword"
    });

    await user.save();
    const match = await user.comparePassword("mypassword");
    expect(match).toBe(true);
  });
});
