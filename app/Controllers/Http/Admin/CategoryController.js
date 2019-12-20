'use strict'

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

const Category = use( 'App/Models/Category' )
const CategoryTransformer = use( 'App/Transformers/Admin/CategoryTransformer' )

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
   * @param {TransformWith} ctx.transform
   * @param { Object } ctx.pagination
   */
  async index ({ request, response, transform, pagination }) {

    const title = request.input( 'title' )

    try {

      const query = Category.query()

      if( title ) {

        query.where( 'title', 'LIKE', `%${title}%` )
      }

      let categories = await query
        .paginate( pagination.page, pagination.limit )

      categories = await transform.paginate( categories, CategoryTransformer )

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
   * @param {TransformWith} ctx.transform
   */
  async store ({ request, response, transform }) {

    const { title, description, image_id } = request.all()

    try {

      let category = await Category.create( {
        image_id,
        title,
        description
      } )

      category = await transform.item( category, CategoryTransformer )

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
   * @param {TransformWith} ctx.transform
   * @param {View} ctx.view
   */
  async show ({ params: { id }, request, response, transform }) {

    try {

      let category = await Category.findOrFail( id )

      category = await transform.item( category, CategoryTransformer )

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
   * @param {TransformWith} ctx.transform
   */
  async update ({ params: { id }, request, response, transform }) {

    const { title, description, image_id } = request.all()
    try {

      let category = await Category.findOrFail( id )
      category.merge( { title, description, image_id } )
      await category.save()

      category = await transform.item( category, CategoryTransformer )

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
