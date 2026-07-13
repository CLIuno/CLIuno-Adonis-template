import type { HttpContext } from '@adonisjs/core/http'

import Role from '#models/role'
import User from '#models/user'

async function requireAdmin(user: User): Promise<boolean> {
  await user.load('role')
  return user.role?.name === 'admin'
}

export default class RolesController {
  async index({ auth, response }: HttpContext) {
    if (!(await requireAdmin(auth.getUserOrFail()))) {
      return response.forbidden({ status: 'error', message: 'Forbidden: Permission denied' })
    }
    const roles = await Role.all()
    return response.ok({ status: 'success', data: { roles } })
  }

  async show({ auth, params, response }: HttpContext) {
    if (!(await requireAdmin(auth.getUserOrFail()))) {
      return response.forbidden({ status: 'error', message: 'Forbidden: Permission denied' })
    }
    const role = await Role.find(params.id)
    if (!role) {
      return response.notFound({ status: 'warning', message: 'Role not found' })
    }
    return response.ok({ status: 'success', data: { role } })
  }

  async store({ auth, request, response }: HttpContext) {
    if (!(await requireAdmin(auth.getUserOrFail()))) {
      return response.forbidden({ status: 'error', message: 'Forbidden: Permission denied' })
    }
    const name = request.input('name')
    if (!name) {
      return response.badRequest({ status: 'warning', message: 'Role name is required' })
    }
    const existing = await Role.findBy('name', name)
    if (existing) {
      return response.badRequest({ status: 'warning', message: 'Role already exists' })
    }
    const role = await Role.create({ name })
    return response.created({
      status: 'success',
      message: 'Role created successfully',
      data: { role },
    })
  }

  async update({ auth, params, request, response }: HttpContext) {
    if (!(await requireAdmin(auth.getUserOrFail()))) {
      return response.forbidden({ status: 'error', message: 'Forbidden: Permission denied' })
    }
    const role = await Role.find(params.id)
    if (!role) {
      return response.notFound({ status: 'warning', message: 'Role not found' })
    }
    const name = request.input('name')
    if (name !== undefined) role.name = name
    await role.save()
    return response.ok({ status: 'success', message: 'Role updated', data: { role } })
  }

  async destroy({ auth, params, response }: HttpContext) {
    if (!(await requireAdmin(auth.getUserOrFail()))) {
      return response.forbidden({ status: 'error', message: 'Forbidden: Permission denied' })
    }
    const role = await Role.find(params.id)
    if (!role) {
      return response.notFound({ status: 'warning', message: 'Role not found' })
    }
    await role.delete()
    return response.ok({ status: 'success', message: 'Role deleted successfully' })
  }
}
