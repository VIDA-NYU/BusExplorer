
# DOT Time Tool

from os import path, curdir
from pymongo import MongoClient
from geopy import distance
import cherrypy
import os
import csv
import math
import copy
import random
import json
import argparse

class StackMirror():

    def __init__(self, dbName, collectionName):
        self.db = MongoClient()[dbName]
        self.collection = self.db[collectionName]

    @cherrypy.expose
    def index(self):
        return file("index.html")


##################################################################################
#### Return filters in pymongodb format
##################################################################################
    def getFilters(self, json):
        filters = []

        startHour = json['startHour']
        endHour   = json['endHour']
        if(startHour != -1 and endHour != -1):
            filters.append({"hour": {"$gte":startHour,"$lte":startHour}})
        elif(startHour == -1 and endHour != -1):
            filters.append({"hour": {"$lte":startHour}})
        elif(startHour != -1 and endHour == -1):
            filters.append({"hour": {"$gte":startHour}})

        dayOfWeek = json['dayOfWeek']
        if(dayOfWeek != -1):
            filters.append({"dayOfWeek": dayOfWeek})

        month = json['month']
        if(month != -1):
            filters.append({"month": month})

        year = json['year']
        if(year != -1):
            filters.append({"year": year})

        lines = json['lines'].split(',')
        if(len(lines) > 0 and lines[0] != ''):
            filters.append({"PublishedLineName" : {'$in' : lines }})

        return filters

##################################################################################
#### Compute avg speed per line
##################################################################################
    def computeAvgSpeedPerLine(self, records):

        buses = {}
        for r in records:
            b = r["DatedVehicleJourneyRef"]
            if b in buses:
                buses[b].append(r)
            else:
                buses[b] = []
                buses[b].append(r)

        for b in buses:
            buses[b].sort(key = lambda r : r['RecordedAtTime'])

        # Compute speed between successive pings
        speeds = {}
        avgSpeeds = {}
        for b in buses:
            speeds[b] = []
            for i in range(1,len(buses[b])):
                p0 = [buses[b][i-1]['VehicleLocation'][1],buses[b][i-1]['VehicleLocation'][0]] #lat,lon format
                p1 = [buses[b][i]['VehicleLocation'][1],buses[b][i]['VehicleLocation'][0]]

                dist = distance.distance(p0,p1).meters

                t0 = buses[b][i-1]['RecordedAtTime']
                t1 = buses[b][i]['RecordedAtTime']

                if (t1-t0).seconds > 0:
                    speedMs = (dist / (t1-t0).seconds) # in meters / seconds
                else:
                    speedMs = 0
                speedKh = speedMs * 3.6

                print p0,p1,dist,(t1-t0).seconds,speedKh

                speeds[b].append(speedKh)

            if len(speeds[b]) > 0:
                avgSpeeds[b] = sum(speeds[b]) / float(len(speeds[b]))
            else:
                avgSpeeds[b] = 0

        return avgSpeeds

##################################################################################
#### Format records to csv
##################################################################################
    def getFormattedLine(self, record):
        return ("%s,%f,%f,%f,%s,%s,%s,%s,%s,%s,%s,%s")%\
                (record["OriginRef"],record["Bearing"],record["VehicleLocation"][1],record["VehicleLocation"][0],\
                 record["VehicleRef"],record["DestinationName"],record["JourneyPatternRef"],record["RecordedAtTime"],\
                 record["LineRef"],record["PublishedLineName"],record["DatedVehicleJourneyRef"],record["DirectionRef"])

##################################################################################
#### Return records
##################################################################################
    def getRecords(self, geoJson, filters):

        # modify geoJson so that it suits pymongo
        geoJson.pop("type")
        geoJson.pop("properties")
        geoJson["$geometry"] = geoJson.pop("geometry")

        query = {"VehicleLocation" : {"$geoWithin": geoJson}}
        filters.insert(0,query)
        
        cursor = self.collection.find({'$and': filters})
        return cursor

##################################################################################
#### Server: return requested trip info
##################################################################################
    @cherrypy.expose
    @cherrypy.tools.json_in()
    def getTripsCSV(self):
        inputJson = cherrypy.request.json
        filters  = self.getFilters(inputJson)
        features = inputJson['path']['features']

        buses = {}
        firstPing = {}
        lastPing  = {}
        for f in features:
            cursor = self.getRecords(f, filters[:])
            records = list(cursor)
            
            for e in records:
                b = e['DatedVehicleJourneyRef']
                if b in buses:
                    buses[b].append(e)
                    if e['RecordedAtTime'] < firstPing[b]:
                        firstPing[b] = e['RecordedAtTime']
                    if e['RecordedAtTime'] > lastPing[b]:
                        lastPing[b] = e['RecordedAtTime']
                else:
                    buses[b] = []
                    buses[b].append(e)
                    lastPing[b] = e['RecordedAtTime']
                    firstPing[b] = e['RecordedAtTime']

        formatted = '\n'.join("%s,%s,%s,%s"%(b,buses[b][0]['PublishedLineName'],firstPing[b],lastPing[b]) for b in buses)

        cherrypy.response.headers['Content-Type']        = 'text/csv'
        cherrypy.response.headers['Content-Disposition'] = 'attachment; filename=export.csv'

        return formatted

##################################################################################
#### Server: return requested pings
##################################################################################
    @cherrypy.expose
    @cherrypy.tools.json_in()
    def getPingsCSV(self):
        inputJson = cherrypy.request.json
        filters  = self.getFilters(inputJson)
        features = inputJson['path']['features']

        formatted = ''
        for f in features:
            cursor = self.getRecords(f, filters[:])
            records = list(cursor)
            formatted += '\n'.join(self.getFormattedLine(records[n]) for n in xrange(len(records)))

        cherrypy.response.headers['Content-Type']        = 'text/csv'
        cherrypy.response.headers['Content-Disposition'] = 'attachment; filename=export.csv'

        return formatted


##################################################################################
#### Server: return requested avg speed as csv
##################################################################################
    @cherrypy.expose
    @cherrypy.tools.json_in()
    def getSpeedCSV(self):
        inputJson = cherrypy.request.json
        filters  = self.getFilters(inputJson)
        features = inputJson['path']['features']

        formatted = ''
        count = 0
        for f in features:
            cursor = self.getRecords(f, filters[:])
            records = list(cursor)
            avgSpeedPerLine = self.computeAvgSpeedPerLine(records)
            for l in avgSpeedPerLine:
                if avgSpeedPerLine[l] >= 1.0:
                    formatted += "%d,%s,%f\n"%(count,l,avgSpeedPerLine[l])
            count+=1

        cherrypy.response.headers['Content-Type']        = 'text/csv'
        cherrypy.response.headers['Content-Disposition'] = 'attachment; filename=export.csv'

        return formatted

##################################################################################
#### Server: return requested avg speed
##################################################################################
    @cherrypy.expose
    @cherrypy.tools.json_in()
    @cherrypy.tools.json_out()
    def getSpeed(self):
        inputJson = cherrypy.request.json
        filters  = self.getFilters(inputJson)
        features = inputJson['path']['features']

        outputJson = {}
        count = 0
        for f in features:
            cursor = self.getRecords(f, filters[:])
            records = list(cursor)
            outputJson[count] = self.computeAvgSpeedPerLine(records)
            count+=1

        return outputJson

def startServer(dbName, collectionName):
    # Uncomment below for server functionality
    PATH = os.path.abspath(os.path.dirname(__file__))
    class Root(object): pass
    cherrypy.tree.mount(StackMirror(dbName, collectionName), '/', config={
            '/': {
                    'tools.staticdir.on': True,
                    'tools.staticdir.dir': PATH,
                    'tools.staticdir.index': 'index.html',
                },
        })

    # sudo iptables -A INPUT -p tcp --dport 8080 -j ACCEPT
    cherrypy.config.update({'server.socket_host': '0.0.0.0',
                            'engine.autoreload.on': True
                            })
    cherrypy.engine.start()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='CherryPy server.')
    parser.add_argument('-d', action="store", dest="dbName", help='Database name', default='dot')
    parser.add_argument('-c', action="store", dest="collectionName", help='Collection name', default='bus')

    args = parser.parse_args()
    startServer(args.dbName, args.collectionName)