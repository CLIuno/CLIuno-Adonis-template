import { DateTime } from 'luxon'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { BaseModel, belongsTo, column, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import { DbAccessTokensProvider } from '@adonisjs/auth/access_tokens'

import Role from '#models/role'
import Post from '#models/post'
import Todo from '#models/todo'

const AuthFinder = withAuthFinder(() => hash.use('scrypt'), {
  uids: ['email', 'username'],
  passwordColumnName: 'password',
})

export default class User extends compose(BaseModel, AuthFinder) {
  @column({ isPrimary: true })
  declare id: number

  @column()
  declare username: string

  @column()
  declare first_name: string

  @column()
  declare last_name: string

  @column()
  declare email: string

  @column()
  declare phone: string | null

  @column({ serializeAs: null })
  declare password: string

  @column()
  declare is_online: boolean

  @column()
  declare is_verified: boolean

  @column()
  declare is_otp_enabled: boolean

  @column({ serializeAs: null, columnName: 'otp_base32' })
  declare otp_base32: string | null

  @column({ serializeAs: null })
  declare otp_auth_url: string | null

  @column({ serializeAs: null })
  declare reset_token: string | null

  @column({ serializeAs: null })
  declare verify_token: string | null

  @column()
  declare is_deleted: boolean

  @column()
  declare role_id: number | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => Role, { foreignKey: 'role_id' })
  declare role: BelongsTo<typeof Role>

  @hasMany(() => Todo, { foreignKey: 'user_id' })
  declare todos: HasMany<typeof Todo>

  @hasMany(() => Post, { foreignKey: 'user_id' })
  declare posts: HasMany<typeof Post>

  static accessTokens = DbAccessTokensProvider.forModel(User)
}
