const app = require("../server");

describe("Server startup", () => {
  it("should export app for testing", () => {
    expect(app).toBeDefined();
  });
});
