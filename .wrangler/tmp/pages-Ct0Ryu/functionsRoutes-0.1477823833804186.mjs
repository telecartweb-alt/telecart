import { onRequestPost as __api_user_change_email_request_js_onRequestPost } from "C:\\Users\\Mohd Faiz\\Desktop\\Final\\Final telecart\\functions\\api\\user\\change-email\\request.js"
import { onRequestPost as __api_user_change_email_verify_js_onRequestPost } from "C:\\Users\\Mohd Faiz\\Desktop\\Final\\Final telecart\\functions\\api\\user\\change-email\\verify.js"
import { onRequestPost as __api_auth_check_email_account_js_onRequestPost } from "C:\\Users\\Mohd Faiz\\Desktop\\Final\\Final telecart\\functions\\api\\auth\\check-email-account.js"
import { onRequestPost as __api_auth_check_whatsapp_account_js_onRequestPost } from "C:\\Users\\Mohd Faiz\\Desktop\\Final\\Final telecart\\functions\\api\\auth\\check-whatsapp-account.js"
import { onRequestPost as __api_auth_logout_js_onRequestPost } from "C:\\Users\\Mohd Faiz\\Desktop\\Final\\Final telecart\\functions\\api\\auth\\logout.js"
import { onRequestGet as __api_auth_me_js_onRequestGet } from "C:\\Users\\Mohd Faiz\\Desktop\\Final\\Final telecart\\functions\\api\\auth\\me.js"
import { onRequestPost as __api_auth_send_email_otp_js_onRequestPost } from "C:\\Users\\Mohd Faiz\\Desktop\\Final\\Final telecart\\functions\\api\\auth\\send-email-otp.js"
import { onRequestPost as __api_auth_send_whatsapp_otp_js_onRequestPost } from "C:\\Users\\Mohd Faiz\\Desktop\\Final\\Final telecart\\functions\\api\\auth\\send-whatsapp-otp.js"
import { onRequestPost as __api_auth_verify_email_otp_js_onRequestPost } from "C:\\Users\\Mohd Faiz\\Desktop\\Final\\Final telecart\\functions\\api\\auth\\verify-email-otp.js"
import { onRequestPost as __api_auth_verify_whatsapp_otp_js_onRequestPost } from "C:\\Users\\Mohd Faiz\\Desktop\\Final\\Final telecart\\functions\\api\\auth\\verify-whatsapp-otp.js"
import { onRequestPost as __api_db_query_js_onRequestPost } from "C:\\Users\\Mohd Faiz\\Desktop\\Final\\Final telecart\\functions\\api\\db\\query.js"
import { onRequestPost as __api_forms_generate_token_js_onRequestPost } from "C:\\Users\\Mohd Faiz\\Desktop\\Final\\Final telecart\\functions\\api\\forms\\generate-token.js"
import { onRequestGet as __api_forms_prefill_js_onRequestGet } from "C:\\Users\\Mohd Faiz\\Desktop\\Final\\Final telecart\\functions\\api\\forms\\prefill.js"
import { onRequestPost as __api_forms_prefill_js_onRequestPost } from "C:\\Users\\Mohd Faiz\\Desktop\\Final\\Final telecart\\functions\\api\\forms\\prefill.js"
import { onRequestGet as __api_storage_health_js_onRequestGet } from "C:\\Users\\Mohd Faiz\\Desktop\\Final\\Final telecart\\functions\\api\\storage\\health.js"
import { onRequestGet as __api_storage_public_url_js_onRequestGet } from "C:\\Users\\Mohd Faiz\\Desktop\\Final\\Final telecart\\functions\\api\\storage\\public-url.js"
import { onRequestPost as __api_storage_remove_js_onRequestPost } from "C:\\Users\\Mohd Faiz\\Desktop\\Final\\Final telecart\\functions\\api\\storage\\remove.js"
import { onRequestPost as __api_storage_upload_js_onRequestPost } from "C:\\Users\\Mohd Faiz\\Desktop\\Final\\Final telecart\\functions\\api\\storage\\upload.js"
import { onRequestGet as __api_user_profile_js_onRequestGet } from "C:\\Users\\Mohd Faiz\\Desktop\\Final\\Final telecart\\functions\\api\\user\\profile.js"
import { onRequestPut as __api_user_profile_js_onRequestPut } from "C:\\Users\\Mohd Faiz\\Desktop\\Final\\Final telecart\\functions\\api\\user\\profile.js"

export const routes = [
    {
      routePath: "/api/user/change-email/request",
      mountPath: "/api/user/change-email",
      method: "POST",
      middlewares: [],
      modules: [__api_user_change_email_request_js_onRequestPost],
    },
  {
      routePath: "/api/user/change-email/verify",
      mountPath: "/api/user/change-email",
      method: "POST",
      middlewares: [],
      modules: [__api_user_change_email_verify_js_onRequestPost],
    },
  {
      routePath: "/api/auth/check-email-account",
      mountPath: "/api/auth",
      method: "POST",
      middlewares: [],
      modules: [__api_auth_check_email_account_js_onRequestPost],
    },
  {
      routePath: "/api/auth/check-whatsapp-account",
      mountPath: "/api/auth",
      method: "POST",
      middlewares: [],
      modules: [__api_auth_check_whatsapp_account_js_onRequestPost],
    },
  {
      routePath: "/api/auth/logout",
      mountPath: "/api/auth",
      method: "POST",
      middlewares: [],
      modules: [__api_auth_logout_js_onRequestPost],
    },
  {
      routePath: "/api/auth/me",
      mountPath: "/api/auth",
      method: "GET",
      middlewares: [],
      modules: [__api_auth_me_js_onRequestGet],
    },
  {
      routePath: "/api/auth/send-email-otp",
      mountPath: "/api/auth",
      method: "POST",
      middlewares: [],
      modules: [__api_auth_send_email_otp_js_onRequestPost],
    },
  {
      routePath: "/api/auth/send-whatsapp-otp",
      mountPath: "/api/auth",
      method: "POST",
      middlewares: [],
      modules: [__api_auth_send_whatsapp_otp_js_onRequestPost],
    },
  {
      routePath: "/api/auth/verify-email-otp",
      mountPath: "/api/auth",
      method: "POST",
      middlewares: [],
      modules: [__api_auth_verify_email_otp_js_onRequestPost],
    },
  {
      routePath: "/api/auth/verify-whatsapp-otp",
      mountPath: "/api/auth",
      method: "POST",
      middlewares: [],
      modules: [__api_auth_verify_whatsapp_otp_js_onRequestPost],
    },
  {
      routePath: "/api/db/query",
      mountPath: "/api/db",
      method: "POST",
      middlewares: [],
      modules: [__api_db_query_js_onRequestPost],
    },
  {
      routePath: "/api/forms/generate-token",
      mountPath: "/api/forms",
      method: "POST",
      middlewares: [],
      modules: [__api_forms_generate_token_js_onRequestPost],
    },
  {
      routePath: "/api/forms/prefill",
      mountPath: "/api/forms",
      method: "GET",
      middlewares: [],
      modules: [__api_forms_prefill_js_onRequestGet],
    },
  {
      routePath: "/api/forms/prefill",
      mountPath: "/api/forms",
      method: "POST",
      middlewares: [],
      modules: [__api_forms_prefill_js_onRequestPost],
    },
  {
      routePath: "/api/storage/health",
      mountPath: "/api/storage",
      method: "GET",
      middlewares: [],
      modules: [__api_storage_health_js_onRequestGet],
    },
  {
      routePath: "/api/storage/public-url",
      mountPath: "/api/storage",
      method: "GET",
      middlewares: [],
      modules: [__api_storage_public_url_js_onRequestGet],
    },
  {
      routePath: "/api/storage/remove",
      mountPath: "/api/storage",
      method: "POST",
      middlewares: [],
      modules: [__api_storage_remove_js_onRequestPost],
    },
  {
      routePath: "/api/storage/upload",
      mountPath: "/api/storage",
      method: "POST",
      middlewares: [],
      modules: [__api_storage_upload_js_onRequestPost],
    },
  {
      routePath: "/api/user/profile",
      mountPath: "/api/user",
      method: "GET",
      middlewares: [],
      modules: [__api_user_profile_js_onRequestGet],
    },
  {
      routePath: "/api/user/profile",
      mountPath: "/api/user",
      method: "PUT",
      middlewares: [],
      modules: [__api_user_profile_js_onRequestPut],
    },
  ]