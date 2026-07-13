import type { HttpContext } from '@adonisjs/core/http'

import Follow from '#models/follow'
import User from '#models/user'

export default class FollowsController {
  async follow({ auth, params, response }: HttpContext) {
    const target = await User.find(params.userId)
    if (!target) {
      return response.notFound({ status: 'error', message: 'User not found' })
    }
    const me = auth.getUserOrFail()
    if (me.id === target.id) {
      return response.badRequest({ status: 'error', message: 'Cannot follow this user' })
    }

    await Follow.firstOrCreate({ follower_id: me.id, following_id: target.id })
    return response.created({ status: 'success', message: 'Followed successfully' })
  }

  async unfollow({ auth, params, response }: HttpContext) {
    const target = await User.find(params.userId)
    if (!target) {
      return response.notFound({ status: 'error', message: 'User not found' })
    }
    const follow = await Follow.query()
      .where('follower_id', auth.getUserOrFail().id)
      .where('following_id', target.id)
      .first()
    if (follow) await follow.delete()
    return response.ok({ status: 'success', message: 'Unfollowed successfully' })
  }

  async followers({ params, response }: HttpContext) {
    const target = await User.find(params.userId)
    if (!target) {
      return response.notFound({ status: 'error', message: 'User not found' })
    }
    const follows = await Follow.query().where('following_id', target.id).preload('follower')
    return response.ok({
      status: 'success',
      data: { followers: follows.map((f) => f.follower) },
    })
  }

  async following({ params, response }: HttpContext) {
    const target = await User.find(params.userId)
    if (!target) {
      return response.notFound({ status: 'error', message: 'User not found' })
    }
    const follows = await Follow.query().where('follower_id', target.id).preload('following')
    return response.ok({
      status: 'success',
      data: { following: follows.map((f) => f.following) },
    })
  }

  async isFollowing({ auth, params, response }: HttpContext) {
    const target = await User.find(params.userId)
    if (!target) {
      return response.notFound({ status: 'error', message: 'User not found' })
    }
    const follow = await Follow.query()
      .where('follower_id', auth.getUserOrFail().id)
      .where('following_id', target.id)
      .first()
    return response.ok({ status: 'success', data: { isFollowing: !!follow } })
  }
}
