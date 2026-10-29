/**
 * 5TOT ĐHĐN — Public Entry Types (Prompt 14)
 * Hội Sinh viên Việt Nam Đại học Đà Nẵng
 */

export type PublicEntryRoute =
  | 'landing'
  | 'login'
  | 'signup'
  | 'forgot_password'
  | 'reset_password';

export type PublicEntryDemoPresetId =
  | 'screenshot_a_landing'         // A. Landing 1440×900
  | 'screenshot_b_login'           // B. Login 1366×768
  | 'screenshot_c_signup_open'     // C. Signup with institution selector open 1440×900
  | 'screenshot_d_signup_errors'   // D. Signup validation & conflict errors
  | 'screenshot_e_inst_error'      // E. Institution load failure
  | 'login_invalid_credentials'    // Login error: Email hoặc mật khẩu chưa chính xác.
  | 'login_general_error'          // Login error: Chưa thể đăng nhập lúc này. Vui lòng thử lại.
  | 'login_session_expired'        // Session expired notice
  | 'login_return_url';            // Login from protected notification deep-link

export interface SafeInternalReturnTarget {
  navId: 'overview' | 'application' | 'notifications' | 'results' | 'evidence';
  label: string;
  criterionId?: string;
}

export interface StudentRegistrationPayload {
  fullName: string;
  email: string;
  studentId: string;
  institutionId: string;
  institutionName: string;
}
