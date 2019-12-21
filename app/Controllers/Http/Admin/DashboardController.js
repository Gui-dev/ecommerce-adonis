'use strict'

const Database = use( 'Database' )

class DashboardController {

  async index( { response } ) {

    try {

      const users = await Database.from( 'users' ).getCount()
      const orders = await Database.from( 'orders' ).getCount()
      const products = await Database.from( 'products' ).getCount()
      const subtotal = await Database.from( 'order_items' ).getSum( 'subtotal' )
      const discounts = await Database.from( 'coupon_order' ).getSum( 'discount' )

      const revenues = subtotal - discounts

      return response.status( 201 ).send( {
        users, revenues, orders, products
      } )

    } catch (error) {

      return response.status( 400 ).send( {
        error: 'Erro ao disponibilizar dados para o dashboard'
      } )
    }
  }
}

module.exports = DashboardController
