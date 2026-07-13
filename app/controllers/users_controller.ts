import type { HttpContext } from '@adonisjs/core/http'

import Post from '#models/post'
import User from '#models/user'

async function isAdmin(user: User): Promise<boolean> {
  await user.load('role')
  return user.role?.name === 'admin'
}

export default class UsersController {
  async index({ response }: HttpContext) {
    const users = await User.query().preload('role')
    return response.ok({ status: 'success', data: { users } })
  }

  async current({ auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    await user.load('role')
    return response.ok({ status: 'success', data: { user } })
  }

  async updateCurrent({ auth, request, response }: HttpContext) {
    const user = auth.getUserOrFail()
    user.merge(request.only(['first_name', 'last_name', 'phone']))
    await user.save()
    return response.ok({ status: 'success', message: 'User updated', data: { user } })
  }

  async deleteCurrent({ auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    user.is_deleted = true
    await user.save()
    return response.ok({ status: 'success', message: 'User deleted', data: { user } })
  }

  async byUsername({ params, response }: HttpContext) {
    const user = await User.findBy('username', params.username)
    if (!user) {
      return response.notFound({ status: 'warning', message: 'User not found' })
    }
    return response.ok({ status: 'success', data: { user } })
  }

  async show({ params, response }: HttpContext) {
    const user = await User.find(params.id)
    if (!user) {
      return response.notFound({ status: 'warning', message: 'User not found' })
    }
    return response.ok({ status: 'success', data: { user } })
  }

  async posts({ params, response }: HttpContext) {
    const user = await User.find(params.id)
    if (!user) {
      return response.notFound({ status: 'warning', message: 'User not found' })
    }
    const posts = await Post.query()
      .where('user_id', user.id)
      .preload('user')
      .preload('comments', (q) => q.preload('user'))
      .orderBy('created_at', 'desc')
    return response.ok({ status: 'success', message: 'Posts', data: { posts } })
  }

  async roles({ params, response }: HttpContext) {
    const user = await User.find(params.id)
    if (!user) {
      return response.notFound({ status: 'warning', message: 'User not found' })
    }
    await user.load('role')
    return response.ok({ status: 'success', message: 'Role found', data: { role: user.role } })
  }

  async update({ auth, params, request, response }: HttpContext) {
    if (!(await isAdmin(auth.getUserOrFail()))) {
      return response.forbidden({ status: 'error', message: 'Forbidden: Permission denied' })
    }
    const user = await User.find(params.id)
    if (!user) {
      return response.notFound({ status: 'warning', message: 'User not found' })
    }
    user.merge(request.only(['first_name', 'last_name', 'phone']))
    await user.save()
    return response.ok({ status: 'success', data: { user } })
  }

  async destroy({ auth, params, response }: HttpContext) {
    if (!(await isAdmin(auth.getUserOrFail()))) {
      return response.forbidden({ status: 'error', message: 'Forbidden: Permission denied' })
    }
    const user = await User.find(params.id)
    if (!user) {
      return response.notFound({ status: 'warning', message: 'User not found' })
    }
    user.is_deleted = true
    await user.save()
    return response.ok({ status: 'success', data: { user } })
  }
}
