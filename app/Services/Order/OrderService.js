'use strict'

const Database = use( 'Database' )

class OrderService {

  constructor( model, trx = null ) {

    this.model = model
    this.trx = trx
  }

  async syncItems( items ) {

    if( !Array.isArray( items ) ) {

      return false
    }

    await this.model.items().delete( this.trx )
    await this.model.items().createMany( items, this.trx )
  }

  async updateItems( items ) {

    let currentItems = this.model
      .items()
      .whereIn( 'id', items.map( item => item.id ) )
      .fetch()

    // deletar os items que o User não quer mais
    await this.model
      .items()
      .whereNotIn( 'id', items.map( item => item.id ) )
      .delete( this.trx )

    //Atualiza is valores e quantidades
    await Promise.all( currentItems.rows.map( async item => {

      item.fill( items.find( n => n.id === item.id ) )
      await item.save( this.trx )
    } ) )

  }

  async canApplyDiscount( coupon ) {

    let isAssociateToProducts = false
    let isAssociateToClients = false

    const couponProducts = await Database
      .from( 'coupon_products' )
      .where( 'coupon_id', coupon.id )
      .pluck( 'products_id' )

    const couponClients = await Database
      .from( 'coupon_user' )
      .where( 'coupon_id', coupon.id )
      pluck( 'user_id' )

    // verificar se o cupom NÃO está associado a produtos e clientes especificos
    if( Array.isArray( couponProducts ) && couponProducts.length < 1
      && Array.isArray( couponClients ) && couponClients.length < 1 ) {

      /** Caso não esteja associado a cliente ou produto especifico, é de uso livre */
      return true
    }

    if( Array.isArray( couponProducts ) && couponProducts.length > 0 ) {

      isAssociateToProducts = true
    }

    if( Array.isArray( couponClients ) && couponClients.length > 0 ) {

      isAssociateToClients = true
    }

    const productMatch = await Database
      .from( 'order_items' )
      .where( 'order_id', this.model.id )
      .whereIn( 'product_id', couponProducts )
      .pluck( 'product_id' )

    /**
     * Caso de uso 1: O cupom está associado a clientes e produtos
     */
    if( isAssociateToClients && isAssociateToProducts ) {

      const clientMatch = couponClients
        .find( client => client === this.model.user_id )

        if( clientMatch && Array.isArray( productMatch ) && productMatch.length > 0 ) {

          return true
        }
    }

    /**
     * Caso de uso 2: O cupom está associado apenas a produtos
     */
    if( isAssociateToProducts && Array.isArray( productMatch ) && productMatch.length > 0 ) {

      return true
    }

    /**
     * Caso de uso 3: O cupom está associado a um ou mais clientes ( e nenhum produto )
     */
    if( isAssociateToClients && Array.isArray( couponClients ) && couponClients.length > 0 ) {

      const match = couponClients
        .find( client => client === this.model.user_id )

      if( match ) {
        return true
      }

    }

    /**
     * Caso nenhuma das verificações acima deem positiva
     * então o cupom está associado a clientes ou produtos ou os dois
     * porém nenhum dos produtos deste pedido está elegivel ao desconto
     * e o cliente que fez a compra também não poderá utilizar este cupom
     */
    return false

  }

}

module.exports = OrderService
