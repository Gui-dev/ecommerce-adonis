'use strict'

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

const User = use( 'App/Models/User' )
const UserTransformer = use( 'App/Transformers/Admin/UserTransformer' )

/**
 * Resourceful controller for interacting with users
 */
class UserController {
  /**
   * Show a list of all users.
   * GET users
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {TransformerWith} ctx.transform
   */
  async index ({ request, response, pagination, transform }) {

    const name = request.input( 'name' )

    try {

      const query = User.query()

      if( name ) {

        query.where( 'name', 'LIKE', `%${name}%` )
        query.orWhere( 'surname', 'LIKE', `%${name}%` )
        query.orWhere( 'email', 'LIKE', `%${name}%` )
      }

      let user = await query.paginate( pagination.page, pagination.limit )

      user = await transform.paginate( user, UserTransformer )

      return response.status( 200 ).send( user )

    } catch (error) {

      return response.status( 400 ).send( {
        message: 'Erro ao buscar usuário'
      } )
    }
  }

  /**
   * Create/save a new user.
   * POST users
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {TransformerWith} ctx.transform
   */
  async store ({ request, response, transform }) {

    const userData = request.only( [ 'name', 'surname', 'email', 'password', 'image_id' ] )

    try {

      let user = await User.create( userData )

      user = await transform.item( user, UserTransformer )

      return response.status( 201 ).send( user )
    } catch (error) {

      return response.status( 400 ).send( {
        message: 'Não foi possivel cadastrar esse usuário'
      } )
    }
  }

  /**
   * Display a single user.
   * GET users/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {TransformerWith} ctx.transform
   */
  async show ({ params: { id }, request, response, transform }) {

    try {

      let user = await User.findOrFail( id )
      user = await transform.item( user, UserTransformer )
      return response.status( 200 ).send( user )
    } catch (error) {

      return response.status( 400 ).send( {
        message: 'Erro ao buscar usuário'
      } )
    }
  }

  /**
   * Update user details.
   * PUT or PATCH users/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {TransformerWith} ctx.transform
   */
  async update ({ params: { id }, request, response, transform }) {

    const userData = request.only( [ 'name', 'surname', 'email', 'password', 'image_id' ] )

    try {

      let user = await User.findOrFail( id )
      user.merge( userData )
      await user.save()

      user = await transform.item( user, UserTransformer )

      return response.status( 201 ).send( user )
    } catch (error) {

      return response.status( 400 ).send( {
        message: 'Erro ao atualizar usuário'
      } )
    }
  }

  /**
   * Delete a user with id.
   * DELETE users/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async destroy ({ params: { id }, request, response }) {

    try {

      const user = await User.findOrFail( id )
      await user.delete()

      return response.status( 204 ).send()

    } catch (error) {

      return response.status( 500 ).send( {
        message: 'Erro ao deletar usuário'
      } )
    }
  }
}

module.exports = UserController
