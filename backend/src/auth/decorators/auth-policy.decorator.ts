import { SetMetadata } from '@nestjs/common';

export const REQUIRE_SERVICE_AUTH_KEY = 'require_service_auth';
export const REQUIRE_OPERATOR_KEY = 'require_operator';
export const REQUIRE_USER_KEY = 'require_user';
export const PUBLIC_READ_ONLY_KEY = 'public_read_only';

export interface ServiceAuthOptions {
  allowUser?: boolean;
}

/**
 * Decorator to require service-to-service API key authentication.
 * Bypasses of @Public() are strictly disallowed on this endpoint.
 */
export const RequireServiceAuth = (options?: ServiceAuthOptions) =>
  SetMetadata(REQUIRE_SERVICE_AUTH_KEY, options || { allowUser: false });

/**
 * Decorator to require privileged operator/admin access (either admin JWT or operator service key).
 */
export const RequireOperator = () => SetMetadata(REQUIRE_OPERATOR_KEY, true);

/**
 * Decorator to require authenticated user session (JWT).
 */
export const RequireUser = () => SetMetadata(REQUIRE_USER_KEY, true);

/**
 * Decorator to mark safe, read-only demo endpoints that permit anonymous viewing
 * when PUBLIC_ACCESS_ENABLED=true.
 */
export const PublicReadOnly = () => SetMetadata(PUBLIC_READ_ONLY_KEY, true);
