/**
 * Galat aplikasi dengan format seragam PRD 13.1.
 * @param {number} status HTTP status
 * @param {string} code kode galat PRD 13.1 (mis. NOT_FOUND)
 * @param {string} message pesan berbahasa Indonesia, tanpa detail internal
 * @param {{field: string, message: string}[]} [details]
 */
export class AppError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}
