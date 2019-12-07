'use strict'
const crypto = use( 'crypto' )
const Helpers = use( 'Helpers' )

/**
 * Generate random string
 * @param { int } length - O tamanho da String que você quer
 * @return { string } - Uma String randomica do tamanho de length
 */

const str_random = async ( length = 40 ) => {

  let string = ''
  let len = string.length

  if( len < length ) {
    let size = length - len
    let bytes = await crypto.randomBytes( size )
    let buffer = Buffer.from( bytes )

    string += buffer.toString( 'base64' )
      .replace(/[^a-zA-Z0-9]/g, '')
      .substr( 0, size )
  }

  return string

}

/**
 * Move um arquivo para um caminho especificado, se nenhum for especificado
 * então 'public/uploads' será utilizado
 * @param { FileJar } file o arquivo a ser gerenciado
 * @param { string } path o caminho para onde o arquivo deve ser movido
 * @return { Object }
 */

const manageSingleUpload = async ( file, path = null ) => {

  path = path ? path : Helpers.publicPath( 'uploads' )
  const randomName = await str_random( 30 ) // gera um nome aleatorio
  let filename = `${new Date().getTime()}-${randomName}.${file.subtype}`

  // renomeia o arquivo e move ele para o path
  await file.move( path, {
    name: filename
  } )

  return file
}

/**
 * Move multiplos arquivos para um caminho especificado, se nenhum for especificado
 * então 'public/uploads' será utilizado
 * @param { FileJar } fileJar o arquivo a ser gerenciado
 * @param { string } path o caminho para onde o arquivo deve ser movido
 * @return { Object }
 */

const manageMultipleUploads = async ( fileJar, path = null ) => {

  path = path ? path : Helpers.publicPath( 'uploads' )
  let successes = []
  let errors = []

  await Promise.all( fileJar.files.map( async file => {

    let randomName = await str_random( 30 )
    let filename = `${new Date().getTime()}-${randomName}.${file.subtype}`

    await file.move( path, {
      name: filename
    } )

    if( file.moved() ) {

      successes.push( file )
    } else {
      errors.push( file.error() )
    }

  } ) )

  return { successes, errors }
}

 module.exports = {
  str_random
 }
