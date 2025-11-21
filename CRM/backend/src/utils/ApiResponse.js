export class ApiResponse {
  constructor({ success = true, message, data, error }) {
    this.success = success;
    this.message = message;
    this.data = data;
    if (error) {
      this.error = error;
    }
  }
}

