import crypto from 'node:crypto'
import type { HttpContext } from '@adonisjs/core/http'
import hash from '@adonisjs/core/services/hash'
import { Secret } from '@adonisjs/core/helpers'

import Role from '#models/role'
import User from '#models/user'
import { buildTotp, generateBase32Secret, verifyTotp } from '#services/totp'

const randomToken = () => crypto.randomBytes(20).toString('hex')

async function issueTokens(user: User) {
  const access = await User.accessTokens.create(user, ['api'], { name: 'api' })
  const refresh = await User.accessTokens.create(user, ['refresh'], { name: 'refresh' })
  return { token: access.value!.release(), refreshToken: refresh.value!.release() }
}

export default class AuthController {
  async register({ request, response }: HttpContext) {
    const { username, first_name, last_name, email, phone, password } = request.only([
      'username',
      'first_name',
      'last_name',
      'email',
      'phone',
      'password',
    ])

    if (!username || !first_name || !last_name || !email || !password) {
      return response.badRequest({ status: 'warning', message: 'Missing required fields' })
    }
    if (String(password).length < 8) {
      return response.badRequest({
        status: 'warning',
        message: 'Password must be at least 8 characters',
      })
    }

    const exists = await User.query().where('username', username).orWhere('email', email).first()
    if (exists) {
      return response.badRequest({ status: 'warning', message: 'User already exists' })
    }

    // Default role is created on first use so a fresh install works out of the box
    const role = await Role.firstOrCreate({ name: 'user' })

    const user = await User.create({
      username,
      first_name,
      last_name,
      email,
      phone: phone || null,
      password,
      role_id: role.id,
      // The verify token is stored so verify-email can look the user up by token later.
      verify_token: randomToken(),
    })
    // In production, email the token; templates keep it local to the database.

    return response.created({
      status: 'success',
      message: 'User created successfully and an email has been sent to you for verification',
      data: { user },
    })
  }

  async login({ request, response }: HttpContext) {
    const { usernameOrEmail, password } = request.only(['usernameOrEmail', 'password'])
    if (!usernameOrEmail || !password) {
      return response.badRequest({
        status: 'warning',
        message: 'usernameOrEmail and password are required',
      })
    }

    const isEmail = String(usernameOrEmail).includes('@')
    const user = await User.query()
      .where(isEmail ? 'email' : 'username', usernameOrEmail)
      .where('is_deleted', false)
      .first()

    if (!user || !(await hash.verify(user.password, password))) {
      return response.unauthorized({
        status: 'error',
        message: 'Invalid username/email or password',
      })
    }

    user.is_online = true
    await user.save()
    const tokens = await issueTokens(user)

    return response.ok({
      status: 'success',
      message: 'Login successful',
      data: {
        user,
        first_name: user.first_name,
        last_name: user.last_name,
        is_otp_enabled: user.is_otp_enabled,
        ...tokens,
      },
    })
  }

  async logout({ auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const token = auth.user?.currentAccessToken
    if (token) {
      await User.accessTokens.delete(user, token.identifier)
    }
    user.is_online = false
    await user.save()
    return response.ok({ status: 'success', message: 'Logout successful' })
  }

  async checkToken({ auth, response }: HttpContext) {
    return response.ok({
      status: 'success',
      message: 'Token is valid',
      data: { user: auth.getUserOrFail() },
    })
  }

  async refreshToken({ request, response }: HttpContext) {
    // Frontends send the refresh token in the body; the header is a fallback
    const raw =
      request.input('refreshToken') ?? request.header('authorization')?.split(' ')[1] ?? ''
    const token = raw ? await User.accessTokens.verify(new Secret(String(raw))) : null

    if (!token || !token.allows('refresh')) {
      return response.unauthorized({
        status: 'error',
        message: 'Invalid or expired refresh token',
      })
    }

    const user = await User.find(token.tokenableId)
    if (!user) {
      return response.unauthorized({ status: 'error', message: 'Invalid refresh token' })
    }

    await User.accessTokens.delete(user, token.identifier)
    const tokens = await issueTokens(user)

    return response.ok({
      status: 'success',
      message: 'Token refreshed successfully',
      data: tokens,
    })
  }

  async changePassword({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const oldPassword = request.input('oldPassword') ?? request.input('current_password')
    const newPassword = request.input('newPassword') ?? request.input('new_password')

    if (!oldPassword || !newPassword || String(newPassword).length < 8) {
      return response.badRequest({
        status: 'warning',
        message: 'oldPassword and newPassword are required',
      })
    }
    if (!(await hash.verify(user.password, oldPassword))) {
      return response.badRequest({ status: 'error', message: 'Current password is incorrect' })
    }

    user.password = newPassword
    await user.save()
    return response.ok({ status: 'success', message: 'Password changed successfully' })
  }

  async forgotPassword({ request, response }: HttpContext) {
    // Frontends send `email`; `usernameOrEmail` is kept for compatibility
    const login = request.input('email') ?? request.input('usernameOrEmail')
    if (!login) {
      return response.badRequest({ status: 'warning', message: 'Email is required' })
    }

    const isEmail = String(login).includes('@')
    const user = await User.query()
      .where(isEmail ? 'email' : 'username', login)
      .first()
    if (user) {
      user.reset_token = randomToken()
      await user.save()
      // In production, email the token; templates keep it local to the database.
    }
    return response.ok({
      status: 'success',
      message: 'If the email exists, a reset link has been sent',
    })
  }

  async resetPassword({ request, response }: HttpContext) {
    const { password, token } = request.only(['password', 'token'])
    const user = token ? await User.findBy('reset_token', token) : null
    if (!user) {
      return response.badRequest({ status: 'error', message: 'Invalid or expired reset token' })
    }
    if (!password || String(password).length < 8) {
      return response.badRequest({
        status: 'warning',
        message: 'Password must be at least 8 characters',
      })
    }

    user.password = password
    user.reset_token = null
    await user.save()
    return response.ok({ status: 'success', message: 'Password reset successful' })
  }

  async sendVerifyEmail({ auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    user.verify_token = randomToken()
    await user.save()
    // In production, email the token; templates keep it local to the database.
    return response.ok({ status: 'success', message: 'Email sent successfully' })
  }

  async verifyEmail({ request, response }: HttpContext) {
    const token = request.input('token')
    const user = token ? await User.findBy('verify_token', token) : null
    if (!user) {
      return response.badRequest({
        status: 'error',
        message: 'Invalid or expired verification token',
      })
    }

    user.is_verified = true
    user.verify_token = null
    await user.save()
    return response.ok({ status: 'success', message: 'Email verified successfully' })
  }

  // OTP endpoints act on the authenticated user (RFC 6238 TOTP)
  async otpGenerate({ auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const secret = generateBase32Secret()
    user.otp_base32 = secret
    user.otp_auth_url = buildTotp(user.username, secret).toString()
    user.is_otp_enabled = false
    await user.save()

    return response.ok({
      status: 'success',
      message: 'OTP secret generated',
      data: { secret, base32: secret, otpauth_url: user.otp_auth_url },
    })
  }

  async otpVerify({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    if (!user.otp_base32) {
      return response.badRequest({ status: 'error', message: 'OTP is not set up' })
    }
    const code = request.input('otp') ?? request.input('token')
    if (!verifyTotp(user.username, user.otp_base32, code)) {
      return response.unauthorized({ status: 'error', message: 'Invalid OTP code' })
    }

    user.is_otp_enabled = true
    await user.save()
    return response.ok({ status: 'success', message: 'OTP verified successfully' })
  }

  async otpValidate({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    if (!user.otp_base32 || !user.is_otp_enabled) {
      return response.badRequest({ status: 'error', message: 'OTP is not enabled for this user' })
    }
    const code = request.input('otp') ?? request.input('token')
    if (!verifyTotp(user.username, user.otp_base32, code)) {
      return response.unauthorized({ status: 'error', message: 'Invalid OTP code' })
    }
    return response.ok({ status: 'success', message: 'Token is valid' })
  }

  async otpDisable({ auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    user.is_otp_enabled = false
    user.otp_base32 = null
    user.otp_auth_url = null
    await user.save()
    return response.ok({ status: 'success', message: 'OTP disabled successfully' })
  }
}
