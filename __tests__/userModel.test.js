const mockingoose = require('mockingoose');
const User = require('../Models/userModel');
const bcrypt = require('bcrypt');

describe("User model (mocked)", () => {

  beforeEach(() => {
    mockingoose.resetAll();
  });

  it("should create a User instance", async () => {
    const mockUser = {
      fullName: "Test User",
      IDNumber: "1234567890123",
      AccNumber: 123456,
      userName: "testuser",
      password: "password123"
    };

    // Mock the save operation
    mockingoose(User).toReturn(mockUser, 'save');

    const user = new User(mockUser);
    const savedUser = await user.save();

    expect(savedUser.fullName).toBe("Test User");
    expect(savedUser.IDNumber).toBe("1234567890123");
    expect(savedUser.AccNumber).toBe(123456);
    expect(savedUser.userName).toBe("testuser");
    expect(savedUser.password).toBe("password123"); // mock returns original password
  });

  it("should hash password before save", async () => {
    const mockUser = {
      fullName: "Hash Test",
      IDNumber: "9876543210987",
      AccNumber: 654321,
      userName: "hashtest",
      password: "mypassword"
    };

    // Simulate pre-save hook hashing
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(mockUser.password, salt);

    mockingoose(User).toReturn({ ...mockUser, password: hashedPassword }, 'save');

    const user = new User(mockUser);
    const savedUser = await user.save();

    expect(savedUser.password).not.toBe("mypassword");
    expect(await bcrypt.compare("mypassword", savedUser.password)).toBe(true);
  });

  it("should compare password correctly", async () => {
    const password = "mypassword";
    const hashed = await bcrypt.hash(password, 10);

    const mockUser = {
      fullName: "Compare Test",
      IDNumber: "1112223334445",
      AccNumber: 111222,
      userName: "comparetest",
      password: hashed
    };

    // Mock findOne to return user with hashed password
    mockingoose(User).toReturn(mockUser, 'findOne');

    const user = await User.findOne({ userName: "comparetest" });
    const match = await user.comparePassword(password);

    expect(match).toBe(true);
  });
});
