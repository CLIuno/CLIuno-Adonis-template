import { BaseModel, CamelCaseNamingStrategy } from '@adonisjs/lucid/orm'
import type { LucidModel } from '@adonisjs/lucid/types/model'

/**
 * The CLIuno contract serialises resource fields exactly as they are declared —
 * `first_name`, `is_verified`, `is_completed`, `avatar_url`, `role_id`.
 *
 * Lucid's default strategy camelCases property names on the way out, so the API
 * was returning `firstName`/`isCompleted` while every frontend reads the
 * snake_case keys. Keep the declared name verbatim; models that genuinely want a
 * different wire name (Post.imageUrl → image_url) still set `serializeAs`
 * explicitly, which takes precedence over this.
 */
class ContractNamingStrategy extends CamelCaseNamingStrategy {
  serializedName(_model: LucidModel, propertyName: string): string {
    return propertyName
  }
}

BaseModel.namingStrategy = new ContractNamingStrategy()
