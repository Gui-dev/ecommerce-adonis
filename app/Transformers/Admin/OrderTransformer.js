'use strict'

const BumblebeeTransformer = use('Bumblebee/Transformer')

const UserTransformer = use( 'App/Transformers/Admin/UserTransformer' )
const OrderItemTransformer = use( 'App/Transformers/Admin/OrderItemTransformer' )
const CouponTransformer = use( 'App/Transformers/Admin/CouponTransformer' )
const DiscountTransformer = use( 'App/Transformers/Admin/DiscountTransformer' )

/**
 * OrderTransformer class
 *
 * @class OrderTransformer
 * @constructor
 */
class OrderTransformer extends BumblebeeTransformer {

  availableInclude() {

    return [ 'user', 'coupons', 'items', 'discounts' ]
  }

  /**
   * This method is used to transform the data.
   */
  transform ( order ) {

    order = order.toJSON()

    return {

      id: order.id,
      status: order.status,
      total: order.total ? parseFloat( order.total.toFixed( 2 ) ) : 0,
      qty_items: order.__meta__ && order.__meta__.qty_items ? order.qty_items : 0,
      date: order.created_at,
      discount: order.__meta__ && order.__meta__.discount ? order.__meta__.discount: 0,
      subtotal: order.__meta__ && order.__meta__.subtotal ? order.subtotal : 0,

    }
  }

  includeUser( model ) {
    return this.item( model.getRelated( 'user' ), UserTransformer )
  }

  includeItems( model ) {
    return this.collection( model.getRelated( 'items' ), OrderItemTransformer )
  }

  includeCoupons( model ) {
    return this.collection( model.getRelated( 'coupons' ), CouponTransformer )
  }

  includeDiscounts( model ) {
    return this.collection( model.getRelated( 'discounts' ), DiscountTransformer )
  }

}

module.exports = OrderTransformer
