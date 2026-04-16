import { z, createZodDto } from "src/shared"

export const signUpByEmailBodySchema = z.object({
  email: z.string().email().openapi({
    description: 'User email address',
    example: 'user@example.com',
  }),
  password: z.string().min(8).openapi({
    description: 'User password (minimum 8 characters)',
    example: 'password123',
  }),
}).openapi({
  description: 'Sign up by email request body',
  example: {
    email: 'user@example.com',
    password: 'password123',
  },
});

export class SignUpByEmailDto extends createZodDto(signUpByEmailBodySchema) { }

export const signInByEmailBodySchema = z.object({
  email: z.string().email().openapi({
    description: 'User email address',
    example: 'user@example.com',
  }),
  password: z.string().min(8).openapi({
    description: 'User password',
    example: 'password123',
  }),
}).openapi({
  description: 'Sign in by email request body',
  example: {
    email: 'user@example.com',
    password: 'password123',
  },
});

export class SignInByEmailDto extends createZodDto(signInByEmailBodySchema) { }

export const confirmEmailBodySchema = z.object({
  token: z.string().min(1).openapi({
    description: 'Email verification token',
    example: 'abc123def456',
  }),
  email: z.string().email().openapi({
    description: 'User email address',
    example: 'user@example.com',
  }),
}).openapi({
  description: 'Confirm email request body',
  example: {
    token: 'abc123def456',
    email: 'user@example.com',
  },
});

export class ConfirmEmailDto extends createZodDto(confirmEmailBodySchema) { }

export const refreshTokenBodySchema = z.object({
  refreshToken: z.string().min(1).openapi({
    description: 'Refresh token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  }),
}).openapi({
  description: 'Refresh token request body',
  example: {
    refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  },
});

export class RefreshTokenDto extends createZodDto(refreshTokenBodySchema) { }

export const invokeEmailVerificationBodySchema = z.object({
  email: z.string().email().openapi({
    description: 'User email address',
    example: 'user@example.com',
  }),
}).openapi({
  description: 'Invoke email verification request body',
  example: {
    email: 'user@example.com',
  },
});

export class InvokeEmailVerificationDto extends createZodDto(invokeEmailVerificationBodySchema) { }

export const signInByEmailResponseSchema = z.object({
  access: z.object({
    token: z.string().openapi({
      description: 'Access token',
      example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    }),
    expiresAt: z.coerce.date().openapi({
      description: 'Access token expiration date',
      example: '2024-01-01T00:15:00.000Z',
    }),
  }).openapi({
    description: 'Access token information',
  }),
  refresh: z.object({
    token: z.string().openapi({
      description: 'Refresh token',
      example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    }),
    expiresAt: z.coerce.date().openapi({
      description: 'Refresh token expiration date',
      example: '2024-01-08T00:00:00.000Z',
    }),
  }).optional().openapi({
    description: 'Refresh token information',
  }),
}).openapi({
  description: 'Sign in by email response',
  example: {
    access: {
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      expiresAt: '2024-01-01T00:15:00.000Z',
    },
    refresh: {
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      expiresAt: '2024-01-08T00:00:00.000Z',
    },
  },
});

export class SignInByEmailResponseDto extends createZodDto(signInByEmailResponseSchema) { }

export const refreshTokenResponseSchema = z.object({
  access: z.object({
    token: z.string().openapi({
      description: 'Access token',
      example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    }),
    expiresAt: z.coerce.date().openapi({
      description: 'Access token expiration date',
      example: '2024-01-01T00:15:00.000Z',
    }),
  }).openapi({
    description: 'Access token information',
  }),
  refresh: z.object({
    token: z.string().openapi({
      description: 'Refresh token',
      example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    }),
    expiresAt: z.coerce.date().openapi({
      description: 'Refresh token expiration date',
      example: '2024-01-08T00:00:00.000Z',
    }),
  }).optional().openapi({
    description: 'Refresh token information',
  }),
}).openapi({
  description: 'Refresh token response',
  example: {
    access: {
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      expiresAt: '2024-01-01T00:15:00.000Z',
    },
    refresh: {
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      expiresAt: '2024-01-08T00:00:00.000Z',
    },
  },
});

export class RefreshTokenResponseDto extends createZodDto(refreshTokenResponseSchema) { }

export const forgotPasswordBodySchema = z.object({
  email: z.string().email().openapi({
    description: 'User email address',
    example: 'user@example.com',
  }),
}).openapi({
  description: 'Forgot password request body',
  example: {
    email: 'user@example.com',
  },
});

export class ForgotPasswordDto extends createZodDto(forgotPasswordBodySchema) { }

export const resetPasswordBodySchema = z.object({
  token: z.string().min(1).openapi({
    description: 'Password reset token',
    example: 'token...',
  }),
  email: z.string().email().openapi({
    description: 'User email address',
    example: 'user@example.com',
  }),
  newPassword: z.string().min(8).openapi({
    description: 'New password (minimum 8 characters)',
    example: 'newPassword123',
  }),
}).openapi({
  description: 'Reset password request body',
  example: {
    token: 'token...',
    email: 'user@example.com',
    newPassword: 'newPassword123',
  },
});

export class ResetPasswordDto extends createZodDto(resetPasswordBodySchema) { }
