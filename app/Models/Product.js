'use strict'

/** @type {typeof import('@adonisjs/lucid/src/Lucid/Model')} */
const Model = use('Model')

class Product extends Model {

  /**
   * Relacionamento entre Produto e Imagem
   */
  image() {

    return this.belongsTo( 'App/Models/Image' )
  }

  /**
   * Relacionamento entre Produto e Imagens
   * Galeria de imagem do produto
   */
  images() {

    return this.belongsToMany( 'App/Models/Image' )
  }

  /**
   * Relacionamento entre produtos e categorias
   */
  categories() {

    return this.belongsToMany( 'App/Models/Category' )
  }

  /**
   * Relacionamento entre produtos e cupoms de desconto
   */
  coupons() {

    return this.belongsToMany( 'App/Models/Coupon' )
  }
}

module.exports = Product
