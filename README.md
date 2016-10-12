# DOTTimeTool
DOT Time Tool

## Useful commands:
DB name: mta
use mta
Collection name: bus
db.createCollection("bus")
db.bus.createIndex({"VehicleLocation": "2dsphere"})
db.bus.find({"VehicleLocation" : {$within:{$polygon:[[0,0],[1,1],[1,1],[0,0]]}}}).limit(2)
db.bus.find({$where : 'return this.hour == 4' }).limit(1)
db.bus.find({$where : 'return this.dayOfWeek == 4' }).limit(1)
db.bus.find({$and: [{$where : 'return this.dayOfWeek == 5' },{$where : 'return this.hour == 15'}]}).limit(1)
