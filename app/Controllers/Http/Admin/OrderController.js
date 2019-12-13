'use strict'

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

const Order = use( 'App/Models/Order' )
const Database = use( 'Database' )
const OrderService = use( 'App/Services/Order/OrderService' )
const Coupon = use( 'App/Models/Coupon' )
const Discount = use( 'App/Models/Discount' )

/**
 * Resourceful controller for interacting with orders
 */
class OrderController {
  /**
   * Show a list of all orders.
   * GET orders
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   * @param {Object} ctx.pagination
   */
  async index ({ request, response, pagination }) {

    const { status, id } = request.only( [ 'status', 'id' ] )
    try {

      const query = Order.query()

      if( status && id ) {

        query.where( 'status', status )
        query.orWhere( 'id', 'LIKE', `%${id}%` )
      } else if( status ) {

        query.where( 'status', status )
      } else if( id ) {

        query.where( 'id', 'LIKE', `%${id}%` )
      }

      const orders = query.paginate( pagination.page, pagination.limit )

      return response.status( 201 ).send( orders )
    } catch (error) {

      return response.status( 400 ).send( {
        message: 'Erro ao listar Orders'
      } )
    }
  }

  /**
   * Create/save a new order.
   * POST orders
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async store ({ request, response }) {

    const trx = await Database.beginTransaction()
    const { user_id, items, status } = request.all()

    try {

      const order = await Order.create( { user_id, items, status }, trx )
      const service = new OrderService( order, trx )

      if( items && item.length > 0 ) {
        await service.syncItems( items )
      }

      await trx.commit()

      return response.status( 201 ).send( order )

    } catch (error) {

      trx.rollback()

      return response.status( 400 ).send( {
        message: 'Erro ao criar Order'
      } )
    }
  }

  /**
   * Display a single order.
   * GET orders/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async show ({ params: { id }, request, response }) {

    try {

      const order = await Order.findOrFail( id )
      return response.status( 201 ).send( order )
    } catch (error) {

      return response.status( 400 ).send( {
        message: 'Erro ao buscar Order'
      } )
    }
  }

  /**
   * Update order details.
   * PUT or PATCH orders/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async update ({ params: { id }, request, response }) {

    const trx = await Database.beginTransaction()
    const { user_id, items, status } = request.all()
    try {

      const order = await Order.findOrFail( id )
      const service = new OrderService( order, trx )

      order.merge( { user_id, status } )
      await service.updateItems( items )
      await order.save( trx )
      await trx.commit()

      return response.status( 200 ).send( order )

    } catch (error) {

      trx.rollback()
      return response.status( 400 ).send( {
        message: 'Erro ao atualizar este pedido'
      } )
    }
  }

  /**
   * Delete a order with id.
   * DELETE orders/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async destroy ({ params: { id }, request, response }) {

    const trx = await Database.beginTransaction()
    try {

      const order = await Order.findOrFail( id )
      await order.items().delete( trx )
      await order.coupons().delete( trx )
      await order.delete( trx )
      await trx.commit()

      return response.status( 204 ).send()

    } catch (error) {

      trx.rollback()
      return response.status( 400 ).send( {
        message: 'Erro ao deletar Order'
      } )
    }
  }

  async applyDiscount( { params: { id }, request, response } ) {

    const { code } = request.all()
    const discount = {}
    const info = {}

    try {

      const coupon = await Coupon.findByOrFail( 'code', code.toUpperCase() )
      const order = await Order.findOrFail( id )
      const service = new OrderService( order )

      const canAddDiscount = await service.canApllyDiscount( coupon )
      const orderDiscounts = await order.coupons().getCount()

      const canApplyToOrder = orderDiscounts < 1 || ( orderDiscounts >= 1 && coupon.recursive )

      if( canAddDiscount && canApplyToOrder ) {

        discount = await Discount.findOrCreate( {
          order_id: order.id,
          coupon_id: coupon.id
        } )

        info.message = 'Cupom aplicado com sucesso'
        info.success = true
      } else {

        info.message = 'Não foi possível aplicar esse cupom'
        info.success = false
      }

      return response.status( 201 ).send( { order, info } )

    } catch (error) {

      return response.status( 400 ).send( {
        message: 'Erro ao aplicar o Cupom'
      } )
    }
  }

  async removeDiscount( { params, request, response } ) {

    const { discount_id } = request.all()

    try {

      const discount = await Discount.findOrFail( discount_id )
      await discount.delete()

      return response.status( 204 ).send()
    } catch (error) {

      return response.status( 400 ).send( {
        message: 'Erro ao deletar Cupom'
      } )
    }
  }
}

module.exports = OrderController
