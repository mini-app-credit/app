import { applyDecorators } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { SignUpByEmailDto, SignInByEmailDto, SignInByEmailResponseDto, ConfirmEmailDto, InvokeEmailVerificationDto, ForgotPasswordDto, ResetPasswordDto, RefreshTokenResponseDto } from "../dtos";

export class AuthDocs {
  static readonly tags = () => applyDecorators(
    ApiTags('Authentication'),
  );
  static readonly signUpByEmail = () => applyDecorators(
    ApiTags('Authentication'),
    ApiOperation({
      summary: 'Sign up by email',
      description: 'Create a new user account with email and password',
    }),
    ApiBody({
      type: SignUpByEmailDto,
    }),
    ApiResponse({
      status: 201,
      description: 'User created successfully',
    }),
    ApiResponse({
      status: 400,
      description: 'Bad request - invalid email or password format',
    }),
    ApiResponse({
      status: 409,
      description: 'User with this email already exists',
    }),
    ApiResponse({
      status: 500,
      description: 'Internal server error',
    }),
  );

  static readonly signInByEmail = () => applyDecorators(
    ApiTags('Authentication'),
    ApiOperation({
      summary: 'Sign in by email',
      description: 'Authenticate user with email and password',
    }),
    ApiBody({
      type: SignInByEmailDto,
    }),
    ApiResponse({
      status: 200,
      description: 'User authenticated successfully',
      type: SignInByEmailResponseDto,
    }),
    ApiResponse({
      status: 401,
      description: 'Invalid credentials or email not verified',
    }),
    ApiResponse({
      status: 400,
      description: 'Bad request - invalid email or password format',
    }),
    ApiResponse({
      status: 500,
      description: 'Internal server error',
    }),
  );

  static readonly confirmEmail = () => applyDecorators(
    ApiTags('Authentication'),
    ApiOperation({
      summary: 'Confirm email',
      description: 'Verify user email address with token',
    }),
    ApiBody({
      type: ConfirmEmailDto,
    }),
    ApiResponse({
      status: 200,
      description: 'Email verified successfully',
    }),
    ApiResponse({
      status: 400,
      description: 'Bad request - invalid token or email',
    }),
    ApiResponse({
      status: 401,
      description: 'Invalid credentials or email already verified',
    }),
    ApiResponse({
      status: 500,
      description: 'Internal server error',
    }),
  );

  static readonly refreshToken = () => applyDecorators(
    ApiTags('Authentication'),
    ApiOperation({
      summary: 'Refresh token',
      description: 'Generate new access token using refresh token from Authorization header',
    }),
    ApiResponse({
      status: 200,
      description: 'New access token generated successfully',
      type: RefreshTokenResponseDto,
    }),
    ApiResponse({
      status: 401,
      description: 'Invalid refresh token',
    }),
    ApiResponse({
      status: 400,
      description: 'Bad request - missing or invalid authorization header',
    }),
    ApiResponse({
      status: 500,
      description: 'Internal server error',
    }),
  );

  static readonly invokeEmailVerification = () => applyDecorators(
    ApiTags('Authentication'),
    ApiOperation({
      summary: 'Request email verification',
      description: 'Send email verification link to user',
    }),
    ApiBody({
      type: InvokeEmailVerificationDto,
    }),
    ApiResponse({
      status: 200,
      description: 'Email verification sent successfully',
    }),
    ApiResponse({
      status: 400,
      description: 'Bad request - invalid email format',
    }),
    ApiResponse({
      status: 404,
      description: 'Account not found',
    }),
    ApiResponse({
      status: 401,
      description: 'Email already verified',
    }),
    ApiResponse({
      status: 500,
      description: 'Internal server error',
    }),
  );

  static readonly signOut = () => applyDecorators(
    ApiTags('Authentication'),
    ApiOperation({
      summary: 'Sign out',
      description: 'Sign out user and revoke all refresh tokens',
    }),
    ApiResponse({
      status: 204,
      description: 'User signed out successfully',
    }),
    ApiResponse({
      status: 400,
      description: 'Bad request - invalid user or account',
    }),
    ApiResponse({
      status: 404,
      description: 'User or account not found',
    }),
    ApiResponse({
      status: 500,
      description: 'Internal server error',
    }),
  );

  static readonly forgotPassword = () => applyDecorators(
    ApiTags('Authentication'),
    ApiOperation({
      summary: 'Forgot password',
      description: 'Request password reset link for user email',
    }),
    ApiBody({
      type: ForgotPasswordDto,
    }),
    ApiResponse({
      status: 200,
      description: 'Password reset email sent successfully',
    }),
    ApiResponse({
      status: 400,
      description: 'Bad request - invalid email format',
    }),
    ApiResponse({
      status: 404,
      description: 'Account not found',
    }),
    ApiResponse({
      status: 500,
      description: 'Internal server error',
    }),
  );

  static readonly resetPassword = () => applyDecorators(
    ApiTags('Authentication'),
    ApiOperation({
      summary: 'Reset password',
      description: 'Reset user password with valid reset token',
    }),
    ApiBody({
      type: ResetPasswordDto,
    }),
    ApiResponse({
      status: 200,
      description: 'Password reset successfully',
    }),
    ApiResponse({
      status: 400,
      description: 'Bad request - invalid token, email or password format',
    }),
    ApiResponse({
      status: 401,
      description: 'Invalid or expired reset token',
    }),
    ApiResponse({
      status: 404,
      description: 'Account not found',
    }),
    ApiResponse({
      status: 500,
      description: 'Internal server error',
    }),
  );
}
