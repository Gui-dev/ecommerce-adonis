'use strict'

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

const Category = use( 'App/Models/Category' )

/**
 * Resourceful controller for interacting with categories
 */
class CategoryController {
  /**
   * Show a list of all categories.
   * GET categories
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param { Object } ctx.pagination
   */
  async index ({ request, response, pagination }) {

    const title = request.input( 'title' )

    try {

      const query = Category.query()

      if( title ) {

        query.where( 'title', 'LIKE', `%${title}%` )
      }

      const categories = await query
        .paginate( pagination.page, pagination.limit )

      return response.status( 200 ).send( categories )
    } catch (error) {

      console.log( error )
      return response.status( 400 ).json( {
        message: "Erro ao listar categorias"
      } )
    }
  }

  /**
   * Create/save a new category.
   * POST categories
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async store ({ request, response }) {

    const { title, description, image_id } = request.all()

    try {

      const category = await Category.create( {
        image_id,
        title,
        description
      } )

      return response.status( 201 ).send( category )
    } catch (error) {

      return response.status( 400 ).send( {
        message: 'Erro ao processar a sua solicitação'
      } )
    }
  }

  /**
   * Display a single category.
   * GET categories/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async show ({ params: { id }, request, response}) {

    try {

      const category = await Category.findOrFail( id )

      return response.status( 200 ).send( category )
    } catch (error) {

      return response.status( 400 ).send( {
        message: 'Erro ao listar categoria'
      } )
    }
  }

  /**
   * Update category details.
   * PUT or PATCH categories/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async update ({ params: { id }, request, response }) {

    const { title, description, image_id } = request.all()
    try {

      const category = await Category.findOrFail( id )
      category.merge( { title, description, image_id } )
      await category.save()

      return response.status( 200 ).send( category )
    } catch (error) {

      return response.status( 400 ).send( {
        message: 'Erro ao atualizar categoria'
      } )
    }
  }

  /**
   * Delete a category with id.
   * DELETE categories/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async destroy ({ params: { id }, request, response }) {

    try {

      const category = await Category.findOrFail( id )
      await category.delete()

      return response.status( 204 ).send()
    } catch (error) {

    }
  }
}

module.exports = CategoryController
