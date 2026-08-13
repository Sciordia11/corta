// Selecciona el backend de storage: Postgres si hay DATABASE_URL en el
// entorno (así se comporta Railway al enlazar el servicio de la app con
// el de la base de datos), JSON en caso contrario (local y tests).
module.exports = process.env.DATABASE_URL ? require('./postgres') : require('./json');
