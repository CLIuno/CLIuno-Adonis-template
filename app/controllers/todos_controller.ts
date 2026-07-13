import type { HttpContext } from '@adonisjs/core/http'

import Todo from '#models/todo'

export default class TodosController {
  async index({ response }: HttpContext) {
    const todos = await Todo.query().preload('user').orderBy('created_at', 'desc')
    return response.ok({ status: 'success', data: { todos } })
  }

  async currentUser({ auth, response }: HttpContext) {
    const todos = await Todo.query()
      .where('user_id', auth.getUserOrFail().id)
      .preload('user')
      .orderBy('created_at', 'desc')
    return response.ok({ status: 'success', data: { todos } })
  }

  async store({ auth, request, response }: HttpContext) {
    const { title, description } = request.only(['title', 'description'])
    if (!title) {
      return response.badRequest({ status: 'error', message: 'Title is required' })
    }

    const todo = await Todo.create({
      title,
      description: description || '',
      user_id: auth.getUserOrFail().id,
    })
    await todo.load('user')
    return response.created({
      status: 'success',
      message: 'Todo created successfully',
      data: { todo },
    })
  }

  async show({ params, response }: HttpContext) {
    const todo = await Todo.query().where('id', params.id).preload('user').first()
    if (!todo) {
      return response.notFound({ status: 'error', message: 'Todo not found' })
    }
    return response.ok({ status: 'success', data: { todo } })
  }

  async toggle({ params, response }: HttpContext) {
    const todo = await Todo.query().where('id', params.id).preload('user').first()
    if (!todo) {
      return response.notFound({ status: 'error', message: 'Todo not found' })
    }
    todo.is_completed = !todo.is_completed
    await todo.save()
    return response.ok({ status: 'success', message: 'Todo toggled', data: { todo } })
  }

  async update({ params, request, response }: HttpContext) {
    const todo = await Todo.query().where('id', params.id).preload('user').first()
    if (!todo) {
      return response.notFound({ status: 'error', message: 'Todo not found' })
    }
    todo.merge(request.only(['title', 'description', 'is_completed']))
    await todo.save()
    return response.ok({ status: 'success', message: 'Todo updated', data: { todo } })
  }

  async destroy({ params, response }: HttpContext) {
    const todo = await Todo.find(params.id)
    if (!todo) {
      return response.notFound({ status: 'error', message: 'Todo not found' })
    }
    await todo.delete()
    return response.ok({ status: 'success', message: 'Todo deleted successfully' })
  }
}
