'use strict'

/** @typedef {import('@adonisjs/framework/src/Request')} Request */
/** @typedef {import('@adonisjs/framework/src/Response')} Response */
/** @typedef {import('@adonisjs/framework/src/View')} View */

const Image = use( 'App/Models/Image' )
const Helpers = use( 'Helpers' )
const fs = use( 'fs' )

const { manageSingleUpload, manageMultipleUploads } = use( 'App/Helpers' )

/**
 * Resourceful controller for interacting with images
 */
class ImageController {
  /**
   * Show a list of all images.
   * GET images
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async index ({ request, response, pagination }) {

    try {

      const images = await Image
        .query()
        .orderBy( 'id', 'DESC' )
        .paginate( pagination.page, pagination.limit )

      return response.status( 200 ).send( images )
    } catch (error) {

      return response.status( 400 ).send( {
        message: 'Erro ao listar as imagens'
      } )
    }
  }

  /**
   * Create/save a new image.
   * POST images
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async store ({ request, response }) {

    try {

      const fileJar = request.file( 'images', {
        types: [ 'image' ],
        size: '2mb'
      } )

      let images = [] // retorna pro usuário

      // caso seja um unico arquivo
      if( !fileJar.files ) {
        const file = await manageSingleUpload( fileJar )

        if( file.moded() ) {

          const image = await Image.create( {
            path: file.fileName,
            size: file.size,
            original_name: file.clientName,
            extension: file.subtype
          } )

          images.push( image )

          return response.status( 201 ).send( {
            successes: images,
            errors: {}
          } )
        }

        return response.status( 400 ).send( {
          message: 'Não foi possível processar está imagem no momento'
        } )
      }

      // caso sejam vários uploads de arquivos
      let files = await manageMultipleUploads( fileJar )

      await Prime.all( files.successes.map( async file => {
        const image = await Image.create( {
          path: file.fileName,
          size: file.size,
          original_name: file.clientName,
          extension: filesubtype
        } )

        images.push( image )
      } ) )

      return response.status( 201 ).send( {
        successes: images,
        errors: files.errors
      } )

    } catch (error) {

      return response.status( 400 ).send( {
        message: 'Não foi possível cadastrar a Imagem'
      } )
    }
  }

  /**
   * Display a single image.
   * GET images/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async show ({ params: { id }, request, response }) {

    try {

      const image = await Image.findOrFail( id )

      return response.status( 201 ).send( image )
    } catch (error) {

      return response.status( 400 ).send( {
        message: 'Erro ao listar imagem'
      } )
    }
  }

  /**
   * Update image details.
   * PUT or PATCH images/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async update ({ params: { id }, request, response }) {

    const original_name = request.only( [ 'original_name' ] )
    try {

      const image = await Image.findOrFail( id )
      image.merge( original_name )
      await image.save()

      return response.status( 201 ).send( image )
    } catch (error) {

      return response.status( 400 ).send( {
        message: 'Erro ao atualizar nome da imagem'
      } )
    }
  }

  /**
   * Delete a image with id.
   * DELETE images/:id
   *
   * @param {object} ctx
   * @param {Request} ctx.request
   * @param {Response} ctx.response
   */
  async destroy ({ params: { id }, request, response }) {

    try {

      const image = await Image.findOrFail( id )

      let filepath = Helpers.publicPath( `uploads/${image.path}` )
      await fs.unlink( filepath, err => {
        if( !err ) {
          await image.delete()
        }
      } )

      return response.status( 204 ).send()

    } catch (error) {

      return response.status( 400 ).send( {
        message: 'Erro ao deletar imagem'
      } )
    }
  }
}

module.exports = ImageController
