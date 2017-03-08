# BusExplorer
DOT Time Tool

## Steps:
0) Download a sample of the bus pings at: https://www.dropbox.com/s/oqaqcjynjmxdn24/sample2M.csv.zip?dl=0

1) Initialize MongoDB with a sample of bus pings by running export_csv_to_mongo.py ./sample2M.csv -e

2) Initialize the webserver by running server.py


## Useful commands:
python export_csv_to_mongo.py ./sample.csv -e

DB name: mta

use mta

Collection name: bus

db.createCollection("bus")

db.bus.createIndex({"VehicleLocation": "2dsphere"})

db.bus.find({"VehicleLocation" : {$within:{$polygon:[[0,0],[1,1],[1,1],[0,0]]}}}).limit(2)

db.bus.find({$where : 'return this.hour == 4' }).limit(1)

db.bus.find({$where : 'return this.dayOfWeek == 4' }).limit(1)

db.bus.find({$and: [{$where : 'return this.dayOfWeek == 5' },{$where : 'return this.hour == 15'}]}).limit(1)

