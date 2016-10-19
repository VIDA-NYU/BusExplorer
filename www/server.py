
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

        direction = json['direction']
        if(direction != -1):
            filters.append({"DirectionRef": direction})

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
        speedsPerBus = {}
        lines = {}
        avgSpeedsPerBus = {}
        for b in buses:
            speedsPerBus[b] = []
            for i in range(1,len(buses[b])):
                p0 = [buses[b][i-1]['VehicleLocation'][1],buses[b][i-1]['VehicleLocation'][0]] #lat,lon format
                p1 = [buses[b][i]['VehicleLocation'][1],buses[b][i]['VehicleLocation'][0]]

                if buses[b][i-1]['PublishedLineName'] != buses[b][i]['PublishedLineName']:
                    print 'Different line names!!'

                dist = distance.distance(p0,p1).meters

                t0 = buses[b][i-1]['RecordedAtTime']
                t1 = buses[b][i]['RecordedAtTime']

                if (t1-t0).seconds > 0:
                    speedMs = (dist / (t1-t0).seconds) # in meters / seconds
                else:
                    speedMs = 0
                speedKh = speedMs * 3.6
                speedMh = speedKh * 0.621371192

                # print buses[b][i]['PublishedLineName'],p0,p1,dist,(t1-t0).seconds,speedKh

                speedsPerBus[b].append(speedMh)
                lines[b] = buses[b][i]['PublishedLineName']
                # print b, lines[b], buses[b][i]['DatedVehicleJourneyRef']

        speedsPerLine = {}
        for b in lines:
            line = lines[b]

            if line in speedsPerLine:
                speedsPerLine[line].extend(speedsPerBus[b])
            else:
                speedsPerLine[line] = []
                speedsPerLine[line].extend(speedsPerBus[b])

        avgSpeedsPerLine = {}
        for l in speedsPerLine:
            if len(speedsPerLine[l]) > 0:
                avgSpeedsPerLine[l] = sum(speedsPerLine[l]) / float(len(speedsPerLine[l]))
            else:
                speedsPerLine[b] = 0
        # print speedsPerLine
        # print avgSpeedsPerLine
        return avgSpeedsPerLine

##################################################################################
#### Return records
##################################################################################
    def getRecords(self, geoJson, filters, selectionMode):

        print selectionMode, geoJson

        # modify geoJson so that it suits pymongo
        geoJson.pop("type")
        geoJson.pop("properties")
        if selectionMode == "segment":
            geoJson["$geometry"] = geoJson.pop("geometry")
            geoJson.pop("filterSize")

            query = {"VehicleLocation" : {"$geoWithin": geoJson}}
            filters.insert(0,query)
            
            cursor = self.collection.find({'$and': filters})
            return cursor

        elif selectionMode == "node":
            geoJson["$centerSphere"] = [[geoJson["geometry"]["coordinates"][0],geoJson["geometry"]["coordinates"][1]], geoJson["filterSize"] / 6378.1] #radius given in radians
            geoJson.pop("geometry")
            geoJson.pop("filterSize")
            print geoJson

            query = {"VehicleLocation" : {"$geoWithin": geoJson}}
            filters.insert(0,query)
            print query
            
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

        formatted = 'BusID,PublishedLineName,DirectionRef,FirstPing,LastPing\n'
        formatted += ''.join("%s,%s,%d,%s,%s\n"%(b,buses[b][0]['PublishedLineName'],buses[b][0]['DirectionRef'],firstPing[b],lastPing[b]) for b in buses)

        cherrypy.response.headers['Content-Type']        = 'text/csv'
        cherrypy.response.headers['Content-Disposition'] = 'attachment; filename=export.csv'

        return formatted

##################################################################################
#### Format records to csv
##################################################################################
    def getFormattedLine(self, record):
        return ("%s,%f,%f,%f,%s,%s,%s,%s,%s,%s,%s,%s")%\
                (record["OriginRef"],record["Bearing"],record["VehicleLocation"][1],record["VehicleLocation"][0],\
                 record["VehicleRef"],record["DestinationName"],record["JourneyPatternRef"],record["RecordedAtTime"],\
                 record["LineRef"],record["PublishedLineName"],record["DatedVehicleJourneyRef"],record["DirectionRef"])

##################################################################################
#### Server: return requested pings
##################################################################################
    @cherrypy.expose
    @cherrypy.tools.json_in()
    def getPingsCSV(self):
        inputJson = cherrypy.request.json
        filters  = self.getFilters(inputJson)
        features = inputJson['path']['features']
        selectionMode = inputJson['selectionMode']

        formatted = 'OriginRef,Bearing,Latitude,Longitude,VehicleRef,DestinationName,JourneyPatternRef,RecordedAtTime,LineRef,PublishedLineName,DatedVehicleJourneyRef,DirectionRef\n'
        for f in features:
            cursor = self.getRecords(f, filters[:], selectionMode)
            records = list(cursor)
            print len(records)
            formatted += ''.join(self.getFormattedLine(records[n])+'\n' for n in xrange(len(records)))

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

        formatted = 'segment,line,avgspeed\n'
        count = 0
        for f in features:
            cursor = self.getRecords(f, filters[:])
            records = list(cursor)
            avgSpeedPerLine = self.computeAvgSpeedPerLine(records)
            # print "============"+str(count)+"============="
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
            avgSpeedPerLine = self.computeAvgSpeedPerLine(records)
            outputJson[count] = {}
            for l in avgSpeedPerLine:
                if avgSpeedPerLine[l] >= 1.0:
                    outputJson[count][l] = avgSpeedPerLine[l]
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