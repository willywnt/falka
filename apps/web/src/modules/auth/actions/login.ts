'use server';

import { AuthError as NextAuthError } from 'next-auth';

import { signIn } from '@/auth';
import {
  AUTH_ERROR_CODES,
  AUTH_ERROR_MESSAGES,
  AuthError,
} from '@/modules/auth/errors/auth-errors';
import { loginSchema } from '@/modules/auth/validators/login';
import type { AuthActionResult } from '@/modules/auth/types';

export async function loginAction(formData: FormData): Promise<AuthActionResult> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!parsed.success) {
    return {
      success: false,
      code: AUTH_ERROR_CODES.VALIDATION_ERROR,
      message: AUTH_ERROR_MESSAGES.VALIDATION_ERROR,
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    await signIn('credentials', {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: '/dashboard',
    });
  } catch (error) {
    if (error instanceof NextAuthError) {
      if (error.type === 'CredentialsSignin') {
        return {
          success: false,
          code: AUTH_ERROR_CODES.INVALID_CREDENTIALS,
          message: AUTH_ERROR_MESSAGES.INVALID_CREDENTIALS,
        };
      }
    }

    if (error instanceof AuthError) {
      return {
        success: false,
        code: error.code,
        message: error.message,
      };
    }

    throw error;
  }

  return { success: true };
}
