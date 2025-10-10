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

    mockingoose(User).toReturn(mockUser, 'save');

    const user = new User(mockUser);
    const savedUser = await user.save();

    expect(savedUser.fullName).toBe("Test User");
    expect(savedUser.IDNumber).toBe("1234567890123");
    expect(savedUser.AccNumber).toBe(123456);
    expect(savedUser.userName).toBe("testuser");
  });

  it("should hash password before save", async () => {
    const mockUser = { password: "mypassword" };
    
    // Simulate pre-save hook hashing
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(mockUser.password, salt);
    mockingoose(User).toReturn({ password: hashedPassword }, 'save');

    const user = new User(mockUser);
    await user.save();

    expect(user.password).not.toBe("mypassword");
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

    mockingoose(User).toReturn(mockUser, 'findOne');

    const user = await User.findOne({ userName: "comparetest" });
    const match = await user.comparePassword("mypassword");

    expect(match).toBe(true);
  });
});
