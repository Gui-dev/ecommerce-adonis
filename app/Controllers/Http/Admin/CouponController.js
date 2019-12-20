'use strict'

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

const Coupon = use( 'App/Models/Coupon' )
const Database = use( 'Database' )
const CouponService = use( 'App/Services/Coupon/CoupnService' )
const CouponTransformer = use( 'App/Transformers/Admin/CouponTransformer' )

/**
 * Resourceful controller for interacting with coupons
 */
class CouponController {
  /**
   * Show a list of all coupons.
   * GET coupons
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {Object} ctx.pagination
   * @param {TransformerWith} ctx.transform
   */
  async index ({ request, response, pagination, transform }) {

    const code = request.input( 'code' )

    try {

      const query = await Coupon.query()

      if( code ) {

        query.where( 'code', 'LIKE', `%${code}%` )
      }

      let coupons = await query.paginate( pagination.page, pagination.limit )
      coupons = await transform.paginate( coupons, CouponTransformer )

      return response.status( 200 ).send( coupons )

    } catch (error) {

      return response.status( 400 ).send( {
        message: 'Cupons não foram encontrados'
      } )
    }
  }

  /**
   * Create/save a new coupon.
   * POST coupons
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {TransformerWith} ctx.transform
   */
  async store ({ request, response, transform }) {
    /**
     * 1 - produto: pose ser utilizado apenas em produtos especificos
     * 2 - clientes: pode ser utilizado apenas por clientes especificos
     * 3 - clientes e produtos: pode ser utilizado somente em por clientes e produtos especificos
     * 4 - pode ser utilizado por qualquer cliente em qualquer pedido
     */
    const trx = await Database.beginTransaction()
    const canUseFor = { client: false,  product: false }
    const couponData = request.only( [ 'code', 'dicount', 'valid_from', 'valid_until', 'quantity', 'type', 'recursive' ] )
    const { users, products } = request.only( [ 'users', 'products' ] )

    try {

      let coupon = await Coupon.create( { couponData, trx } )

      // starts services layers
      const service = new CouponService( coupon, trx )

      // insere os relacionamentos no DB
      if( users && users.length > 0 ) {

        await service.syncUsers( users )
        canUseFor.client = true
      }

      if( products && products.length > 0 ) {

        await service.syncProducts( products )
        canUseFor.product = true
      }

      if( canUseFor.client && canUseFor.product ) {
        coupon.can_use_for = 'product_client'
      } else if( !canUseFor.client && canUseFor.product ) {
        coupon.can_use_for = 'product'
      } else if( canUseFor.client && !canUseFor.product ) {
        coupon.can_use_for = 'client'
      } else {
        coupon.can_use_for = 'all'
      }

      await coupon.save( trx )
      await trx.commit()

      coupon = await transform.item( coupon, CouponTransformer )

      return response.status( 201 ).send( coupon )

    } catch (error) {

      await trx.rollback()
      return response.status( 400 ).send( {
        message: 'Erro ao cadastrar cupom'
      } )
    }
  }

  /**
   * Display a single coupon.
   * GET coupons/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {TransformerWith} ctx.transform
   */
  async show ({ params: { id }, request, response, transform }) {

    try {

      let coupon = await Coupon.findOrFail( id )
      coupon = await transform.item( coupon, CouponTransformer )

      return response.status( 201 ).send( coupon )
    } catch (error) {

      return response.status( 400 ).send( {
        message: 'Erro ao listar Cupom'
      } )
    }
  }

  /**
   * Update coupon details.
   * PUT or PATCH coupons/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {TransformerWith} ctx.transform
   */
  async update ({ params: { id }, request, response, transform }) {

    const trx = await Database.beginTransaction()
    const canUseFor = { client: false,  product: false }
    const couponData = request.only( [ 'code', 'dicount', 'valid_from', 'valid_until', 'quantity', 'type', 'recursive' ] )
    const { users, products } = request.only( [ 'users', 'products' ] )
    try {

      let coupon = await Coupon.findOrFail( id )
      coupon.merge( couponData )

      const service = new CouponService( coupon, trx )

      if( users && users.length > 0 ) {
        await service.syncUsers( users )
        canUseFor.client = true
      }

      if( products && products.length > 0 ) {
        await service.syncUsers( products )
        canUseFor.product = true
      }

      if( canUseFor.client && canUseFor.product ) {
        coupon.can_use_for = 'product_client'
      } else if( !canUseFor.client && canUseFor.product ) {
        coupon.can_use_for = 'product'
      } else if( canUseFor.client && !canUseFor.product ) {
        coupon.can_use_for = 'client'
      } else {
        coupon.can_use_for = 'all'
      }

      await coupon.save( trx )
      await trx.commit()

      coupon = await transform.item( coupon, CouponTransformer )

      return response.status( 200 ).send( coupon )
    } catch (error) {

      trx.rollback()
      return response.status( 400 ).send( {
        message: 'Erro ao atualizar Cupom'
      } )
    }
  }

  /**
   * Delete a coupon with id.
   * DELETE coupons/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async destroy ({ params: { id }, request, response }) {

    const trx = await Database.beginTransaction()
    try {

      const coupon = await Coupon.findOrFail( id )

      await coupon.products().detach( [], trx )
      await coupon.orders().detach( [], trx )
      await coupon.users().detach( [], trx )
      await coupon.delete( trx )
      await trx.commit()

      return response.status( 204 ).send()
    } catch (error) {

      await trx.rollback()
      return response.status( 400 ).send( {
        message: 'Erro ao deletar Cupom'
      } )
    }
  }

}

module.exports = CouponController
