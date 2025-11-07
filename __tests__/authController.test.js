const jwt = require("jsonwebtoken");
const { protect, authorize } = require("../Middleware/authMiddleware");
const User = require("../Models/userModel");
const Employee = require("../Models/employeeModel");

// Mock the models PROPERLY
jest.mock("../Models/userModel", () => ({
  findById: jest.fn()
}));

jest.mock("../Models/employeeModel", () => ({
  findById: jest.fn()
}));

describe("Auth Middleware", () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {
      headers: {}
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();
    process.env.JWT_SECRET = "test-secret";
    
    // Clear all mocks
    User.findById.mockClear();
    Employee.findById.mockClear();
  });

  describe("protect middleware", () => {
    it("should return 401 if no authorization header", async () => {
      await protect(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Not authorized, no token"
      });
    });

    it("should attach regular user to request for valid token", async () => {
      const mockUser = {
        _id: "user123",
        name: "Test User",
        email: "test@example.com"
      };

      const token = jwt.sign(
        { id: "user123" },
        process.env.JWT_SECRET
      );

      mockReq.headers.authorization = `Bearer ${token}`;
      
      // Mock the chain: User.findById().select()
      const mockSelect = jest.fn().mockResolvedValue(mockUser);
      User.findById.mockReturnValue({
        select: mockSelect
      });

      await protect(mockReq, mockRes, mockNext);

      expect(User.findById).toHaveBeenCalledWith("user123");
      expect(mockSelect).toHaveBeenCalledWith("-password");
      expect(mockReq.user.role).toBe("user");
      expect(mockNext).toHaveBeenCalled();
    });

    it("should attach employee to request for valid employee token", async () => {
      const mockEmployee = {
        _id: "emp123",
        name: "Test Employee",
        email: "employee@test.com",
        role: "employee"
      };

      const token = jwt.sign(
        { id: "emp123", role: "employee" },
        process.env.JWT_SECRET
      );

      mockReq.headers.authorization = `Bearer ${token}`;
      
      // Mock the chain: Employee.findById().select()
      const mockSelect = jest.fn().mockResolvedValue(mockEmployee);
      Employee.findById.mockReturnValue({
        select: mockSelect
      });

      await protect(mockReq, mockRes, mockNext);

      expect(Employee.findById).toHaveBeenCalledWith("emp123");
      expect(mockSelect).toHaveBeenCalledWith("-password");
      expect(mockReq.user).toEqual(mockEmployee);
      expect(mockNext).toHaveBeenCalled();
    });

    it("should return 401 if user not found", async () => {
      const token = jwt.sign(
        { id: "nonexistent" },
        process.env.JWT_SECRET
      );

      mockReq.headers.authorization = `Bearer ${token}`;
      
      // Mock user not found
      const mockSelect = jest.fn().mockResolvedValue(null);
      User.findById.mockReturnValue({
        select: mockSelect
      });

      await protect(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "User not found"
      });
    });

    it("should return 401 if employee not found", async () => {
      const token = jwt.sign(
        { id: "nonexistent", role: "employee" },
        process.env.JWT_SECRET
      );

      mockReq.headers.authorization = `Bearer ${token}`;
      
      // Mock employee not found
      const mockSelect = jest.fn().mockResolvedValue(null);
      Employee.findById.mockReturnValue({
        select: mockSelect
      });

      await protect(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Employee not found"
      });
    });
  });

  describe("authorize middleware", () => {
    it("should allow access when user has required role", () => {
      mockReq.user = { role: "manager" };
      const middleware = authorize("manager", "employee");

      middleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it("should deny access when user doesn't have required role", () => {
      mockReq.user = { role: "employee" };
      const middleware = authorize("manager");

      middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: "Access denied: insufficient permissions"
      });
    });

    it("should deny access when no user data", () => {
      mockReq.user = null;
      const middleware = authorize("manager");

      middleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
    });
  });
});