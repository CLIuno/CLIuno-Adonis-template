import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import User from '#models/user'

export default class Follow extends BaseModel {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare follower_id: number

  @column()
  declare following_id: number

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @belongsTo(() => User, { foreignKey: 'follower_id' })
  declare follower: BelongsTo<typeof User>

  @belongsTo(() => User, { foreignKey: 'following_id' })
  declare following: BelongsTo<typeof User>
}
