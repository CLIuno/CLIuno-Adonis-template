import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table.string('username').notNullable().unique()
      table.string('first_name').notNullable()
      table.string('last_name').notNullable()
      table.string('email', 254).notNullable().unique()
      table.string('phone').nullable().unique()
      table.string('password').notNullable()
      table.boolean('is_online').notNullable().defaultTo(false)
      table.boolean('is_verified').notNullable().defaultTo(false)
      table.boolean('is_otp_enabled').notNullable().defaultTo(false)
      table.string('otp_base32').nullable()
      table.text('otp_auth_url').nullable()
      table.string('reset_token').nullable()
      table.string('verify_token').nullable()
      table.boolean('is_deleted').notNullable().defaultTo(false)
      table
        .integer('role_id')
        .unsigned()
        .nullable()
        .references('id')
        .inTable('roles')
        .onDelete('SET NULL')

      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
