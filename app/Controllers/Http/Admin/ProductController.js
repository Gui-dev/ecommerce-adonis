'use strict'

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

const Product = use( 'App/Models/Product' )

/**
 * Resourceful controller for interacting with products
 */
class ProductController {
  /**
   * Show a list of all products.
   * GET products
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async index ({ request, response, pagination }) {

    const name = request.input( 'name' )

    try {

      const query = Product.query()

      if( name ) {

        query.where( 'name', 'LIKE', `%%${name}%` )
      }

      const products = await query.paginate( pagination.page, pagination.limit )

      return response.status( 200 ).send( products )
    } catch (error) {

      return response.status( 400 ).send( {
        message: 'Erro ao listar produtos'
      } )
    }
  }

  /**
   * Create/save a new product.
   * POST products
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async store ({ request, response }) {

    const { name, description, price, image_id } = request.all()

    try {

      const product = await Product.create( {
        name, description, price, image_id
      } )

      return response.status( 200 ).send( product )
    } catch (error) {

      return response.status( 400 ).send( {
        message: 'Erro ao cadastrar o produto'
      } )
    }
  }

  /**
   * Display a single product.
   * GET products/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {View} ctx.view
   */
  async show ({ params, request, response }) {
  }

  /**
   * Update product details.
   * PUT or PATCH products/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async update ({ params, request, response }) {
  }

  /**
   * Delete a product with id.
   * DELETE products/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async destroy ({ params, request, response }) {
  }
}

module.exports = ProductController
