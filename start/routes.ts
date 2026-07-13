/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The CLIuno REST contract, served under /api/v1.
|
*/

import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

const AuthController = () => import('#controllers/auth_controller')
const UsersController = () => import('#controllers/users_controller')
const TodosController = () => import('#controllers/todos_controller')
const PostsController = () => import('#controllers/posts_controller')
const FollowsController = () => import('#controllers/follows_controller')
const RolesController = () => import('#controllers/roles_controller')

router.get('/', async () => ({ status: 'success', message: 'CLIuno AdonisJS API' }))

router
  .group(() => {
    // Auth — public
    router.post('/auth/register', [AuthController, 'register'])
    router.post('/auth/login', [AuthController, 'login'])
    router.post('/auth/refresh-token', [AuthController, 'refreshToken'])
    router.post('/auth/forgot-password', [AuthController, 'forgotPassword'])
    router.post('/auth/reset-password', [AuthController, 'resetPassword'])
    router.post('/auth/verify-email', [AuthController, 'verifyEmail'])

    // Auth — bearer token required
    router
      .group(() => {
        router.post('/auth/logout', [AuthController, 'logout'])
        router.post('/auth/check-token', [AuthController, 'checkToken'])
        router.post('/auth/change-password', [AuthController, 'changePassword'])
        router.post('/auth/send-verify-email', [AuthController, 'sendVerifyEmail'])
        router.post('/auth/otp/generate', [AuthController, 'otpGenerate'])
        router.post('/auth/otp/verify', [AuthController, 'otpVerify'])
        router.post('/auth/otp/validate', [AuthController, 'otpValidate'])
        router.post('/auth/otp/disable', [AuthController, 'otpDisable'])

        // Users
        router.get('/users', [UsersController, 'index'])
        router.get('/users/current', [UsersController, 'current'])
        router.patch('/users/current', [UsersController, 'updateCurrent'])
        router.delete('/users/current', [UsersController, 'deleteCurrent'])
        router.get('/users/username/:username', [UsersController, 'byUsername'])
        router.get('/users/:id/posts', [UsersController, 'posts'])
        router.get('/users/:id/roles', [UsersController, 'roles'])
        router.get('/users/:id', [UsersController, 'show'])
        router.patch('/users/:id', [UsersController, 'update'])
        router.delete('/users/:id', [UsersController, 'destroy'])

        // Todos
        router.get('/todos/current-user', [TodosController, 'currentUser'])
        router.get('/todos', [TodosController, 'index'])
        router.post('/todos', [TodosController, 'store'])
        router.get('/todos/:id', [TodosController, 'show'])
        router.patch('/todos/:id/toggle', [TodosController, 'toggle'])
        router.patch('/todos/:id', [TodosController, 'update'])
        router.delete('/todos/:id', [TodosController, 'destroy'])

        // Posts + nested comments
        router.get('/posts/current-user', [PostsController, 'currentUser'])
        router.get('/posts', [PostsController, 'index'])
        router.post('/posts', [PostsController, 'store'])
        router.get('/posts/:id', [PostsController, 'show'])
        router.patch('/posts/:id', [PostsController, 'update'])
        router.delete('/posts/:id', [PostsController, 'destroy'])
        router.get('/posts/:id/user', [PostsController, 'user'])
        router.get('/posts/:postId/comments', [PostsController, 'comments'])
        router.post('/posts/:postId/comments', [PostsController, 'storeComment'])
        router.patch('/posts/:postId/comments/:id', [PostsController, 'updateComment'])
        router.delete('/posts/:postId/comments/:id', [PostsController, 'destroyComment'])

        // Follows
        router.post('/follows/:userId/follow', [FollowsController, 'follow'])
        router.delete('/follows/:userId/follow', [FollowsController, 'unfollow'])
        router.get('/follows/:userId/followers', [FollowsController, 'followers'])
        router.get('/follows/:userId/following', [FollowsController, 'following'])
        router.get('/follows/:userId/is-following', [FollowsController, 'isFollowing'])

        // Roles (admin only)
        router.get('/roles', [RolesController, 'index'])
        router.post('/roles', [RolesController, 'store'])
        router.get('/roles/:id', [RolesController, 'show'])
        router.patch('/roles/:id', [RolesController, 'update'])
        router.delete('/roles/:id', [RolesController, 'destroy'])
      })
      .use(middleware.auth())
  })
  .prefix('/api/v1')
