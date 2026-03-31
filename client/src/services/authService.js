import http from './http';
import { API } from '../constants/api';

const authService = {
  register:              (data)                => http.post(API.AUTH.REGISTER, data),
  login:                 (data)                => http.post(API.AUTH.LOGIN, data),
  getMe:                 ()                    => http.get(API.AUTH.ME),
  getProfile:            ()                    => http.get(API.AUTH.PROFILE),
  updateProfile:         (data)                => http.put(API.AUTH.PROFILE, data),
  changePassword:        (data)                => http.put(API.AUTH.PASSWORD, data),
  verifyOtp:             (email, otp)          => http.post(API.AUTH.OTP_VERIFY, { email, otp }),
  resendOtp:             (email)               => http.post(API.AUTH.OTP_RESEND, { email }),
  forgotPassword:        (email)               => http.post(API.AUTH.FORGOT_PASSWORD, { email }),
  resetPassword:         (token, newPassword)  => http.post(API.AUTH.RESET_PASSWORD, { token, newPassword }),
  googleVerifyOtp:       (stepToken, otp)      => http.post(API.AUTH.GOOGLE_VERIFY_OTP, { stepToken, otp }),
  googleResendOtp:       (stepToken)           => http.post(API.AUTH.GOOGLE_RESEND_OTP, { stepToken }),
  googleCompleteProfile: (data)                => http.post(API.AUTH.GOOGLE_COMPLETE_PROFILE, data),
};

export default authService;
