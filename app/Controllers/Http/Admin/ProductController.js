'use strict'

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

const Product = use( 'App/Models/Product' )
const ProductTransformer = use( 'App/Transformers/Admin/ProductTransformer' )

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
   * @param {TransformerWith} ctx.transform
   */
  async index ({ request, response, pagination, transform }) {

    const name = request.input( 'name' )

    try {

      const query = Product.query()

      if( name ) {

        query.where( 'name', 'LIKE', `%${name}%` )
      }

      let products = await query.paginate( pagination.page, pagination.limit )

      products = await transform.paginate( products, ProductTransformer )

      return response.status( 200 ).send( products )
    } catch (error) {

      return response.status( 400 ).send( {
        message: 'Erro ao listar os produtos'
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
   * @param {TransformerWith} ctx.transform
   */
  async store ({ request, response, transform }) {

    const { name, description, price, image_id } = request.all()

    try {

      let product = await Product.create( {
        name, description, price, image_id
      } )

      product = await transform.item( product, ProductTransformer )

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
   * @param {TransformerWith} ctx.transform
   */
  async show ({ params: { id }, request, response, transform }) {

    try {

      let product = await Product.findOrFail( id )

      product = await transform.item( product, ProductTransformer )

      return response.status( 200 ).send( product )
    } catch (error) {
      return response.status( 400 ).send( {
        message: 'Erro ao listar produto'
      } )
    }
  }

  /**
   * Update product details.
   * PUT or PATCH products/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {TransformerWith} ctx.transform
   */
  async update ({ params: { id }, request, response, transform }) {

    const { name, description, price, image_id } = request.all()

    try {

      let product = await Product.findOrFail( id )
      product.merge( { name, description, price, image_id } )
      await product.save()

      product = await transform.item( product, ProductTransformer )

      return response.status( 200 ).send( product )
    } catch (error) {

      return response.status( 400 ).send( {
        message: 'Erro ao atualizar o produto'
      } )
    }
  }

  /**
   * Delete a product with id.
   * DELETE products/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async destroy ({ params: { id }, request, response }) {

    try {

      const product = await Product.findOrFail( id )
      await product.delete()

      return response.status( 204 ).send()
    } catch (error) {

      return response.status( 500 ).send( {
        message: 'Erro ao deletar produto'
      } )
    }
  }
}

module.exports = ProductController
