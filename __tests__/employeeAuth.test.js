const employeeAuth = require('../Middleware/employeeAuth');
const Employee = require('../Models/employeeModel');
const jwt = require('jsonwebtoken');

// Mock dependencies
jest.mock('../Models/employeeModel');
jest.mock('jsonwebtoken');

describe('employeeAuth Middleware', () => {
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
    process.env.JWT_SECRET = 'test-secret';
    jest.clearAllMocks();
  });

  describe('Successful authentication', () => {
    it('should allow access for valid employee token', async () => {
      const mockEmployee = {
        _id: 'emp123',
        name: 'Test Employee',
        role: 'employee'
      };

      mockReq.headers.authorization = 'Bearer valid-token';
      jwt.verify.mockReturnValue({ id: 'emp123', role: 'employee' });
      
      const mockSelect = jest.fn().mockResolvedValue(mockEmployee);
      Employee.findById.mockReturnValue({
        select: mockSelect
      });

      await employeeAuth(mockReq, mockRes, mockNext);

      expect(jwt.verify).toHaveBeenCalledWith('valid-token', 'test-secret');
      expect(Employee.findById).toHaveBeenCalledWith('emp123');
      expect(mockSelect).toHaveBeenCalledWith('-password');
      expect(mockReq.employee).toEqual(mockEmployee);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should return 403 for manager role (only employees allowed)', async () => {
  mockReq.headers.authorization = 'Bearer valid-token';
  jwt.verify.mockReturnValue({ id: 'emp123', role: 'manager' });

  await employeeAuth(mockReq, mockRes, mockNext);

  expect(mockRes.status).toHaveBeenCalledWith(403);
  expect(mockRes.json).toHaveBeenCalledWith({
    message: 'Forbidden'
  });
  expect(mockNext).not.toHaveBeenCalled();
});
  });

  describe('Authentication failures', () => {
    it('should return 401 if no token provided', async () => {
      await employeeAuth(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'No token provided'
      });
    });

    it('should return 401 if token does not start with Bearer', async () => {
      mockReq.headers.authorization = 'Invalid token';

      await employeeAuth(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'No token provided'
      });
    });

    it('should return 403 if decoded role is not employee', async () => {
      mockReq.headers.authorization = 'Bearer valid-token';
      jwt.verify.mockReturnValue({ id: 'user123', role: 'user' });

      await employeeAuth(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Forbidden'
      });
    });

    it('should return 401 if employee not found', async () => {
      mockReq.headers.authorization = 'Bearer valid-token';
      jwt.verify.mockReturnValue({ id: 'nonexistent', role: 'employee' });
      
      const mockSelect = jest.fn().mockResolvedValue(null);
      Employee.findById.mockReturnValue({
        select: mockSelect
      });

      await employeeAuth(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Employee not found'
      });
    });

    it('should return 401 if JWT verification fails', async () => {
      mockReq.headers.authorization = 'Bearer invalid-token';
      jwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await employeeAuth(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Not authorized'
      });
    });

    it('should return 401 if database query fails', async () => {
      mockReq.headers.authorization = 'Bearer valid-token';
      jwt.verify.mockReturnValue({ id: 'emp123', role: 'employee' });
      
      const mockSelect = jest.fn().mockRejectedValue(new Error('DB error'));
      Employee.findById.mockReturnValue({
        select: mockSelect
      });

      await employeeAuth(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Not authorized'
      });
    });
  });

  describe('Token parsing', () => {
    it('should correctly extract token from Bearer header', async () => {
      const mockEmployee = {
        _id: 'emp123',
        name: 'Test Employee',
        role: 'employee'
      };

      mockReq.headers.authorization = 'Bearer token123';
      jwt.verify.mockReturnValue({ id: 'emp123', role: 'employee' });
      
      const mockSelect = jest.fn().mockResolvedValue(mockEmployee);
      Employee.findById.mockReturnValue({
        select: mockSelect
      });

      await employeeAuth(mockReq, mockRes, mockNext);

      expect(jwt.verify).toHaveBeenCalledWith('token123', 'test-secret');
      expect(mockNext).toHaveBeenCalled();
    });
  });
});