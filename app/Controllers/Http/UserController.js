'use strict'

const UserTransformer = use( 'App/Transformers/Admin/UserTransformer' )

class UserController {

  async me( { response, transform, auth } ) {

    try {

      const user = await auth.getUser()
      const userData = await transform.item( user, UserTransformer )
      userData.roles = await user.getRoles()

      return response.status( 201 ).send( userData )
    } catch (error) {

      return response.status( 400 ).send( {
        error: 'Erro ao listar usuário'
      } )
    }


  }
}

module.exports = UserController
