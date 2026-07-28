import { randomUUID } from 'node:crypto'
import { existsSync, mkdirSync } from 'node:fs'
import { extname, resolve } from 'node:path'

import type { HttpContext } from '@adonisjs/core/http'

// Uploaded files live at the repo root and are served back from /uploads.
const UPLOAD_DIR = resolve(process.cwd(), 'uploads')

// 5 MB — matches every other CLIuno backend template.
const MAX_UPLOAD_SIZE = '5mb'
const ALLOWED_EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp', 'gif']

function ensureUploadDir() {
  if (!existsSync(UPLOAD_DIR)) mkdirSync(UPLOAD_DIR, { recursive: true })
  return UPLOAD_DIR
}

export default class UploadsController {
  // Stores the bytes and hands back a URL. Attaching it to a user or a post is the
  // caller's job (PATCH /users/current, POST /posts) — upload mutates nothing.
  async image({ request, response }: HttpContext) {
    const file = request.file('file', {
      size: MAX_UPLOAD_SIZE,
      extnames: ALLOWED_EXTENSIONS,
    })

    if (!file) {
      return response.badRequest({ status: 'warning', message: 'No image file provided' })
    }

    if (!file.isValid) {
      const tooLarge = file.errors.some((error) => error.type === 'size')
      const message = file.errors[0]?.message ?? 'Invalid image'
      return response
        .status(tooLarge ? 413 : 400)
        .send({ status: 'error', message: tooLarge ? 'Image exceeds the 5 MB limit' : message })
    }

    const filename = `${randomUUID()}.${file.extname}`
    await file.move(ensureUploadDir(), { name: filename })

    const base = process.env.PUBLIC_BASE_URL || `${request.protocol()}://${request.host()}`
    return response.created({
      status: 'success',
      message: 'Image uploaded',
      data: { url: `${base.replace(/\/+$/, '')}/uploads/${filename}`, filename },
    })
  }

  // No static provider is configured in this template, so uploads get an explicit route.
  async serve({ params, response }: HttpContext) {
    const name = String(params.filename)
    // Reject anything that isn't a plain generated filename — no traversal, no nesting.
    if (
      !/^[\w-]+\.[a-z0-9]+$/i.test(name) ||
      !ALLOWED_EXTENSIONS.includes(extname(name).slice(1).toLowerCase())
    ) {
      return response.notFound({ status: 'warning', message: 'Not found' })
    }

    const target = resolve(UPLOAD_DIR, name)
    if (!target.startsWith(UPLOAD_DIR) || !existsSync(target)) {
      return response.notFound({ status: 'warning', message: 'Not found' })
    }

    return response.download(target)
  }
}
