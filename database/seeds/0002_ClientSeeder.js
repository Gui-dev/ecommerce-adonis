'use strict'

/*
|--------------------------------------------------------------------------
| ClientSeeder
|--------------------------------------------------------------------------
|
| Make use of the Factory instance to seed database with dummy data or
| make use of Lucid models directly.
|
*/

/** @type {import('@adonisjs/lucid/src/Factory')} */
const Factory = use( 'Factory' )
const Role = use( 'Role' )
const User = use( 'App/Models/User' )

class ClientSeeder {
  async run () {

    const role = await Role.findBy( 'slug', 'client' )
    const Clients = await Factory.
  }
}

module.exports = ClientSeeder
