'use strict'

/** @type {typeof import('@adonisjs/framework/src/Route/Manager')} */
const Route = use('Route')

/**
 * Retorna o usuário logado atualmente
 */
Route
  .get( 'v1/me', 'UserController.me' )
  .as( 'me' )
  .middleware( 'auth' )

require( './auth' )
require( './admin' )
require( './client' )
