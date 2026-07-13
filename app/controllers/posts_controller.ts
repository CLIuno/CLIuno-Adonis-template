import type { HttpContext } from '@adonisjs/core/http'

import Comment from '#models/comment'
import Post from '#models/post'

export default class PostsController {
  async index({ response }: HttpContext) {
    const posts = await Post.query()
      .preload('user')
      .preload('comments', (q) => q.preload('user'))
      .orderBy('created_at', 'desc')
    return response.ok({ status: 'success', data: { posts } })
  }

  async currentUser({ auth, response }: HttpContext) {
    const posts = await Post.query()
      .where('user_id', auth.getUserOrFail().id)
      .preload('user')
      .preload('comments', (q) => q.preload('user'))
      .orderBy('created_at', 'desc')
    return response.ok({ status: 'success', data: { posts } })
  }

  async store({ auth, request, response }: HttpContext) {
    const { title, content } = request.only(['title', 'content'])
    if (!title || !content) {
      return response.badRequest({ status: 'error', message: 'Title and Content are required' })
    }

    const post = await Post.create({ title, content, user_id: auth.getUserOrFail().id })
    await post.load('user')
    return response.created({
      status: 'success',
      message: 'Post created successfully',
      data: { post },
    })
  }

  async show({ params, response }: HttpContext) {
    const post = await Post.query()
      .where('id', params.id)
      .preload('user')
      .preload('comments', (q) => q.preload('user'))
      .first()
    if (!post) {
      return response.notFound({ status: 'error', message: 'Post not found' })
    }
    return response.ok({ status: 'success', data: { post } })
  }

  async update({ params, request, response }: HttpContext) {
    const post = await Post.query().where('id', params.id).preload('user').first()
    if (!post) {
      return response.notFound({ status: 'error', message: 'Post not found' })
    }
    post.merge(request.only(['title', 'content', 'imageUrl']))
    await post.save()
    return response.ok({ status: 'success', message: 'Post updated', data: { post } })
  }

  async destroy({ params, response }: HttpContext) {
    const post = await Post.find(params.id)
    if (!post) {
      return response.notFound({ status: 'error', message: 'Post not found' })
    }
    await post.delete()
    return response.ok({ status: 'success', message: 'Post deleted successfully' })
  }

  async user({ params, response }: HttpContext) {
    const post = await Post.query().where('id', params.id).preload('user').first()
    if (!post) {
      return response.notFound({ status: 'error', message: 'Post not found' })
    }
    return response.ok({ status: 'success', message: 'User found', data: { user: post.user } })
  }

  async comments({ params, response }: HttpContext) {
    const comments = await Comment.query()
      .where('post_id', params.postId)
      .preload('user')
      .orderBy('created_at', 'asc')
    return response.ok({ status: 'success', data: { comments } })
  }

  async storeComment({ auth, params, request, response }: HttpContext) {
    const content = request.input('content')
    if (!content) {
      return response.badRequest({ status: 'error', message: 'Content is required' })
    }
    const post = await Post.find(params.postId)
    if (!post) {
      return response.notFound({ status: 'error', message: 'Post not found' })
    }

    const comment = await Comment.create({
      content,
      post_id: post.id,
      user_id: auth.getUserOrFail().id,
    })
    await comment.load('user')
    return response.created({
      status: 'success',
      message: 'Comment created successfully',
      data: { comment },
    })
  }

  async updateComment({ params, request, response }: HttpContext) {
    const comment = await Comment.query().where('id', params.id).preload('user').first()
    if (!comment) {
      return response.notFound({ status: 'error', message: 'Comment not found' })
    }
    const content = request.input('content')
    if (content !== undefined) comment.content = content
    await comment.save()
    return response.ok({ status: 'success', message: 'Comment updated', data: { comment } })
  }

  async destroyComment({ params, response }: HttpContext) {
    const comment = await Comment.find(params.id)
    if (!comment) {
      return response.notFound({ status: 'error', message: 'Comment not found' })
    }
    await comment.delete()
    return response.ok({ status: 'success', message: 'Comment deleted successfully' })
  }
}
