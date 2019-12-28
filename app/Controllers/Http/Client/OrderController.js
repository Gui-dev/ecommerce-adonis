'use strict'

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

const Order = use( 'App/Models/Order' )
const Coupon = use( 'App/Models/Coupon' )
const Discount = use( 'App/Models/Discount' )
const OrderTransformer = use( 'App/Transformers/Admin/OrderTransformer' )
const Database = use( 'Database' )
const OrderService = use( 'App/Services/Order/OrderService' )
const Ws = use( 'Ws' )

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
   */
  async index ({ request, response, transform, pagination, auth }) {

    const number = request.input( 'number' )

    try {

      const client = await auth.getUser()
      const query = Order.query()

      if( number ) {
        query.where( 'id', 'LIKE', `${number}` )
      }

      query.where( 'user_id', client.id )

      const results = await query
        .orderBy( 'id', 'DESC' )
        .paginate( pagination.page, pagination.limit )
      const orders = await transform.paginate( results, OrderTransformer )

      return response.status( 201 ).send( orders )

    } catch (error) {

      return response.status( 400 ).send( {
        error: 'Erro ao listar pedidos'
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
  async store ({ request, response, transform, auth }) {

    const items = request.input( 'items' )

    try {

      const trx = await Database.beginTransaction()
      const client = await auth.getUser()
      let order = await Order.create( { user_id: client.id }, trx )

      const service = new OrderService( order, trx )

      if( item.length > 0 ) {
        await service.syncItems( items )
      }

      await trx.commit()
      order = await Order.find( order.id )
      order = await transform
        .include( 'items' )
        .item( order, OrderTransformer )

      // Emite um broadcast no websocket
      const topic = Ws
        .getChannel( 'notifications' )
        .topic( 'notifications' )

      if( topic ) {
        topic.broadcast( 'new:order', order )
      }

      return response.status( 201 ).send( order )

    } catch (error) {

      await trx.rollback()
      return response.status( 400 ).send( {
        error: 'Não foi possível fazer seu pedido'
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
   * @param {View} ctx.view
   */
  async show ({ params: { id }, request, response, transform, auth }) {

    try {

      const client = await auth.getUser()
      const result = await Order
        .query()
        .where( 'user_id', client.id )
        .where( 'id', id )
        .firstOrFail()

      const order = await transform.item( result, OrderTransformer )

      return response.status( 200 ).send( order )
    } catch (error) {

      return response.status( 400 ).send( {
        error: 'Erro ao listar pedido'
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
  async update ({ params: { id }, request, response, transform, auth }) {

    const { items, status } = request.all()

    try {

      const trx = await Database.beginTransaction()
      const client = await auth.getUser()
      let order = await Order
        .query()
        .where( 'user_id', client.id )
        .where( 'id', id )
        .firstOrFail()

      order.merge( { user_id: client.id, status } )

      const service = new Service( order, trx )
      await service.updateItems( items )
      await order.save( trx )
      await trx.commit()

      order = await transform
        .include( 'items,coupons,discounts' )
        .item( order, OrderTransformer )

      return response.status( 201 ).send( order )
    } catch (error) {

      await trx.rollback()
      return response.status( 400 ).send( {
        error: 'Não foi possível atualizar o seu pedido'
      } )
    }
  }

  async applyDiscount( { params: { id }, request, response, transform, auth } ) {

    const { code } = request.all()
    let discount = {}
    let info = {}

    try {

      const client = auth.getUser()
      const coupon = await Coupon.findByOrFail( 'code', code.toUpperCase() )
      const order = await Order
        .query()
        .where( 'user_id', client.id )
        .where( 'id', id )
        .firstOrFail()

      const service = new Service( order )
      const canAddDiscount = await service.canApplyDiscount( coupon )
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

        info.message = 'Não foi possível aplicar o cupom'
        info.success = false
      }

      order = await transform
        .include( 'coupons,items,discounts' )
        .item( order, OrderTransformer )

      return response.status( 201 ).send( { order, info } )

    } catch (error) {

      return response.status( 400 ).send( {
        error: 'Erro ao aplicar desconto'
      } )
    }
  }

  async removeDiscount( { request, response } ) {

    const { discount_id } = request.all()

    try {

      const discount = await Discount.findOrFail( discount_id )
      await discount.delete()

      return response.status( 204 ).send()
    } catch (error) {

      return response.status( 400 ).send( {
        error: 'Erro ao remover desconto'
      } )
    }
  }

}

module.exports = OrderController
