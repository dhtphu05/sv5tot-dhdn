/**
 * 5TOT ĐHĐN — RFC 7807 Compliant API Problem Details Error
 */

export interface InvalidParamDetail {
  name: string;
  reason: string;
}

export class ApiError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly title: string;
  public readonly detail: string;
  public readonly type: string;
  public readonly invalidParams?: InvalidParamDetail[];

  constructor(params: {
    status: number;
    code: string;
    title: string;
    detail: string;
    type?: string;
    invalidParams?: InvalidParamDetail[];
  }) {
    super(params.detail);
    this.name = 'ApiError';
    this.status = params.status;
    this.code = params.code;
    this.title = params.title;
    this.detail = params.detail;
    this.type = params.type || `https://5tot.danang.gov.vn/errors/${params.code.toLowerCase()}`;
    this.invalidParams = params.invalidParams;
  }

  static badRequest(detail: string, code = 'BAD_REQUEST', invalidParams?: InvalidParamDetail[]): ApiError {
    return new ApiError({
      status: 400,
      code,
      title: 'Yêu cầu không hợp lệ',
      detail,
      invalidParams,
    });
  }

  static unauthorized(detail = 'Yêu cầu xác thực tài khoản.', code = 'UNAUTHORIZED'): ApiError {
    return new ApiError({
      status: 401,
      code,
      title: 'Chưa xác thực',
      detail,
    });
  }

  static forbidden(detail = 'Bạn không có thẩm quyền thực hiện thao tác này.', code = 'FORBIDDEN'): ApiError {
    return new ApiError({
      status: 403,
      code,
      title: 'Không đủ thẩm quyền',
      detail,
    });
  }

  static notFound(resource = 'Tài nguyên', code = 'NOT_FOUND'): ApiError {
    return new ApiError({
      status: 404,
      code,
      title: 'Không tìm thấy',
      detail: `Không tìm thấy ${resource} trong hệ thống.`,
    });
  }

  static conflict(detail: string, code = 'CONFLICT'): ApiError {
    return new ApiError({
      status: 409,
      code,
      title: 'Xung đột dữ liệu',
      detail,
    });
  }

  static payloadTooLarge(detail = 'Dung lượng tải lên vượt quá giới hạn tối đa cho phép.', code = 'PAYLOAD_TOO_LARGE'): ApiError {
    return new ApiError({
      status: 413,
      code,
      title: 'Dung lượng vượt giới hạn',
      detail,
    });
  }

  static tooManyRequests(retryAfterSeconds = 60): ApiError {
    return new ApiError({
      status: 429,
      code: 'TOO_MANY_REQUESTS',
      title: 'Tần suất gửi yêu cầu quá nhanh',
      detail: `Vui lòng thử lại sau ${retryAfterSeconds} giây.`,
    });
  }

  static internal(detail = 'Lỗi hệ thống nội bộ.', code = 'INTERNAL_SERVER_ERROR'): ApiError {
    return new ApiError({
      status: 500,
      code,
      title: 'Lỗi máy chủ nội bộ',
      detail,
    });
  }

  static serviceUnavailable(detail = 'Dịch vụ tạm thời không khả dụng.', code = 'SERVICE_UNAVAILABLE'): ApiError {
    return new ApiError({
      status: 503,
      code,
      title: 'Dịch vụ chưa sẵn sàng',
      detail,
    });
  }
}
