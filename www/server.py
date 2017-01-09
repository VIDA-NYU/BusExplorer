
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
import numpy
import datetime

class StackMirror():

    def __init__(self, hostName, user, password, dbName, collectionName):
        self.db = MongoClient(host=[hostName])
        if user != None and password != None:
            self.db.the_database.authenticate(user, password, source=dbName)

        self.db = self.db[dbName]
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
            filters.append({"hour": {"$gte":startHour,"$lte":endHour}})
        elif(startHour == -1 and endHour != -1):
            filters.append({"hour": {"$lte":endHour}})
        elif(startHour != -1 and endHour == -1):
            filters.append({"hour": {"$gte":startHour}})

        startMinute = json['startMinute']
        endMinute   = json['endMinute']
        if(startMinute != -1 and endMinute != -1):
            filters.append({"minute": {"$gte":startMinute,"$lte":endMinute}})
        elif(startMinute == -1 and endMinute != -1):
            filters.append({"minute": {"$lte":endMinute}})
        elif(startMinute != -1 and endMinute == -1):
            filters.append({"minute": {"$gte":startMinute}})

        dayOfWeek = json['dayOfWeek']
        if(dayOfWeek != -1):
            filters.append({"dayOfWeek": {'$in' : dayOfWeek}})

        month = json['month']
        if(month != -1):
            filters.append({"month": {'$in' : month}})

        year = json['year']
        if(year != -1):
            filters.append({"year": {'$in' : year}})

        direction = json['direction']
        if(direction != -1):
            filters.append({"DirectionRef": {'$in' : direction}})

        lines = json['lines'].split(',')
        if(len(lines) > 0 and lines[0] != ''):
            filters.append({"PublishedLineName" : {'$in' : lines }})

        date = json['date']
        if(date != -1):
            print date
            startDate = datetime.datetime.strptime(date[0][0:-1], "%m/%d/%y %H:%M")
            endDate = datetime.datetime.strptime(date[1][0:-1], "%m/%d/%y %H:%M")
            filters.append({"RecordedAtTime": {"$gte": startDate}})
            filters.append({"RecordedAtTime": {"$lte": endDate}})

        # quarter = json['quarter']
        # if(quarter != -1):
            # filters.append({"quarter": {'$in' : quarter}})

        print filters

        return filters

##################################################################################
#### Compute avg speed by bus
##################################################################################
    def computeSpeedsByBus(self, records):

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
        linesByBus = {}
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

                # ignore low speeds
                if speedMh > 1.0:
                    speedsPerBus[b].append(speedMh)
                    linesByBus[b] = buses[b][i]['PublishedLineName']
                # print b, lines[b], buses[b][i]['DatedVehicleJourneyRef']

        return {'speeds': speedsPerBus, 'lines': linesByBus}

    def aggregateByLine(self, byBus, name = "speeds"):
        speedsByLine = {}
        speedsByLine["all"] = []
        for b in byBus[name]:
            if len(byBus[name][b]) > 0:
                line = byBus["lines"][b]

                if line in speedsByLine:
                    speedsByLine[line].extend(byBus[name][b])
                else:
                    speedsByLine[line] = []
                    speedsByLine[line].extend(byBus[name][b])

                speedsByLine["all"].extend(byBus[name][b])

        return speedsByLine

##################################################################################
#### Return records
##################################################################################
    def getRecords(self, geoJson, filters, selectionMode):

        geoJson = geoJson.copy()
        filters = filters[:]

        # modify geoJson so that it suits pymongo
        geoJson.pop("type")
        geoJson.pop("properties")
        if selectionMode == "segment":
            geoJson["$geometry"] = geoJson.pop("geometry")
            geoJson.pop("filterSize")

            query = {"VehicleLocation" : {"$geoWithin": geoJson}}
            filters.insert(0,query)

            print {'$and': filters}
            
            cursor = self.collection.find({'$and': filters})

            return cursor

        elif selectionMode == "node":
            geoJson["$centerSphere"] = [[geoJson["geometry"]["coordinates"][0],geoJson["geometry"]["coordinates"][1]], geoJson["filterSize"] / 6378100.0] #radius given in radians
            geoJson.pop("geometry")
            geoJson.pop("filterSize")

            query = {"VehicleLocation" : {"$geoWithin": geoJson}}
            filters.insert(0,query)

            print {'$and': filters}
            
            cursor = self.collection.find({'$and': filters})

            return cursor


##################################################################################
#### Return median ping time
##################################################################################
    def getMedianPingTimeByBus(self, records):
        times = {}
        buses = {}
        for e in records:
            b = e['DatedVehicleJourneyRef']
            if b in times:
                times[b].append(numpy.datetime64(e['RecordedAtTime']))
                buses[b].append(e)
            else:
                times[b] = []
                times[b].append(numpy.datetime64(e['RecordedAtTime']))
                buses[b] = []
                buses[b].append(e)

        medianTime = {}
        minTime = {}
        for b in times:
            minTime[b] = min(times[b])

            for i in range(0,len(times[b])):
                times[b][i] = times[b][i] - minTime[b]

            medianTime[b] = {}
            medianTime[b]['median'] = numpy.median(times[b]) + minTime[b]
            medianTime[b]['PublishedLineName'] = buses[b][0]['PublishedLineName']

        return medianTime

        

##################################################################################
#### Server: return requested trip info
##################################################################################
    @cherrypy.expose
    @cherrypy.tools.json_in()
    def getTripsCSV(self):
        inputJson = cherrypy.request.json
        filters  = self.getFilters(inputJson)
        features = inputJson['path']['features']
        selectionMode = inputJson['selectionMode']
        aggregateByLine = inputJson['aggregateByLine']

        if selectionMode == "segment":
            buses = {}
            firstPing = {}
            lastPing  = {}
            for f in features:
                cursor = self.getRecords(f, filters, selectionMode)
                records = list(cursor)
                
                for e in records:
                    b = e['DatedVehicleJourneyRef']
                    if b in buses:
                        buses[b].append(e)
                        if numpy.datetime64(e['RecordedAtTime']) < firstPing[b]:
                            firstPing[b] = numpy.datetime64(e['RecordedAtTime'])
                        if numpy.datetime64(e['RecordedAtTime']) > lastPing[b]:
                            lastPing[b] = numpy.datetime64(e['RecordedAtTime'])
                    else:
                        buses[b] = []
                        buses[b].append(e)
                        lastPing[b] = numpy.datetime64(e['RecordedAtTime'])
                        firstPing[b] = numpy.datetime64(e['RecordedAtTime'])

            if aggregateByLine:
                tripTimes = {}
                lines = {}
                for b in buses:
                    tripTimes[b] = [(firstPing[b] - lastPing[b]).item().total_seconds()]
                    lines[b] = buses[b][0]['PublishedLineName']

                byLine = self.aggregateByLine({"times": tripTimes, "lines": lines}, "times")
                formatted = 'segment,line,count,mean,median,min,max,percentile25th,percentile75th\n'
                for l in byLine:
                    formatted += "%d,%s,%d,%d,%d,%d,%d,%d,%d\n"%(0,l,len(byLine[l]),abs(numpy.mean(byLine[l])),abs(numpy.median(byLine[l])),\
                        abs(min(byLine[l])),abs(max(byLine[l])),\
                        abs(numpy.percentile(byLine[l],25)),abs(numpy.percentile(byLine[l],75)))


            else:
                formatted = 'BusID,PublishedLineName,DirectionRef,FirstPing,LastPing,TripTime\n'
                formatted += ''.join("%s,%s,%d,%s,%s,%f\n"%(b,buses[b][0]['PublishedLineName'],buses[b][0]['DirectionRef'],firstPing[b],lastPing[b],(lastPing[b]-firstPing[b]).item().total_seconds()/60.0) for b in buses)

        elif selectionMode == "node":
            numFeatures = len(features)

            buses = {}

            # first feature
            cursor = self.getRecords(features[0], filters, selectionMode)
            records = list(cursor)

            for e in records:
                b = e['DatedVehicleJourneyRef']
                if b in buses:
                    buses[b].append(e)
                else:
                    buses[b] = []
                    buses[b].append(e)

            medianFirstFeature = self.getMedianPingTimeByBus(records)

            # last feature
            cursor = self.getRecords(features[numFeatures-1], filters, selectionMode)
            records = list(cursor)
            medianSecondFeature = self.getMedianPingTimeByBus(records)


            if aggregateByLine:
                tripTimes = {}
                lines = {}
                for b in buses:
                    if (b in medianFirstFeature) and (b in medianSecondFeature):
                        tripTimes[b] = [(medianFirstFeature[b]['median'] - medianSecondFeature[b]['median']).item().total_seconds()]
                        lines[b] = buses[b][0]['PublishedLineName']

                byLine = self.aggregateByLine({"times": tripTimes, "lines": lines}, "times")
                formatted = 'segment,line,count,mean,median,min,max,percentile25th,percentile75th\n'
                for l in byLine:
                        print byLine[l]
                        formatted += "%d,%s,%d,%d,%d,%d,%d,%d,%d\n"%(0,l,len(byLine[l]),abs(numpy.mean(byLine[l])),abs(numpy.median(byLine[l])),\
                            abs(min(byLine[l])),abs(max(byLine[l])),\
                            abs(numpy.percentile(byLine[l],25)),abs(numpy.percentile(byLine[l],75)))

            else:
                formatted = 'BusID,PublishedLineName,DirectionRef,FirstPing,LastPing\n'
                for b in buses:
                    if (b in medianFirstFeature) and (b in medianSecondFeature):
                        formatted += "%s,%s,%d,%s,%s\n"%(b,buses[b][0]['PublishedLineName'],buses[b][0]['DirectionRef'],medianFirstFeature[b]['median'],medianSecondFeature[b]['median'])

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
            cursor = self.getRecords(f, filters, selectionMode)
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
        selectionMode = inputJson['selectionMode']
        aggregateByLine = inputJson['aggregateByLine']

        if aggregateByLine:
            formatted = 'segment,line,count,mean,median,min,max,percentile25th,percentile75th\n'
        else:
            formatted = 'segment,BusId,PublishedLineName,speed\n'

        if selectionMode == "segment":
            count = 0
            for f in features:
                cursor = self.getRecords(f, filters, selectionMode)
                records = list(cursor)

                if aggregateByLine:
                    byBus = self.computeSpeedsByBus(records)
                    speedByLine = self.aggregateByLine(byBus)
                    for l in speedByLine:
                        if len(speedByLine[l]) >= 1.0:
                            formatted += "%d,%s,%d,%f,%f,%f,%f,%f,%f\n"%(count,l,len(speedByLine[l]),numpy.mean(speedByLine[l]),numpy.median(speedByLine[l]),\
                                min(speedByLine[l]),max(speedByLine[l]),numpy.percentile(speedByLine[l],25),numpy.percentile(speedByLine[l],75))
                    count+=1
                else:
                    byBus = self.computeSpeedsByBus(records)
                    for b in byBus["speeds"]:
                        if len(byBus["speeds"][b]) > 0:
                            formatted += "%d,%s,%s,%f\n"%(count,b,byBus["lines"][b],numpy.mean(byBus["speeds"][b]))
                    count+=1

        elif selectionMode == "node":
            
            for i in range(1, len(features)):

                # speed between i-1 and i
                cursor = self.getRecords(features[i-1], filters, selectionMode)
                records = list(cursor)
                medianFirstFeature = self.getMedianPingTimeByBus(records)

                cursor = self.getRecords(features[i], filters, selectionMode)
                records = list(cursor)
                medianSecondFeature = self.getMedianPingTimeByBus(records)

                # using center of both features to compute distance
                p0 = [features[i-1]["geometry"]["coordinates"][1],features[i-1]["geometry"]["coordinates"][0]] #lat,lon format
                p1 = [features[i]["geometry"]["coordinates"][1],features[i]["geometry"]["coordinates"][0]]

                speedsByBus = {}
                linesByBus = {}
                for b in medianFirstFeature:
                    if (b in medianSecondFeature):
                        dist = distance.distance(p0,p1).meters
                        timeDelta = abs((medianSecondFeature[b]['median'] - medianFirstFeature[b]['median']).item().total_seconds())

                        if timeDelta > 0:
                            speedMs = (dist / timeDelta) # in meters / seconds
                        else:
                            speedMs = 0
                        speedKh = speedMs * 3.6
                        speedMh = speedKh * 0.621371192

                        line = medianFirstFeature[b]['PublishedLineName']
                        if b in speedsByBus:
                            speedsByBus[b].append(speedMh)
                        else:
                            speedsByBus[b] = []
                            speedsByBus[b].append(speedMh)
                            linesByBus[b] = line


                if aggregateByLine:
                    speedByLine = self.aggregateByLine({'speeds': speedsByBus, 'lines': linesByBus})

                    for l in speedByLine:
                        if len(speedByLine[l]) > 0:
                            formatted += "%d,%s,%d,%f,%f,%f,%f,%f,%f\n"%(i-1,l,len(speedByLine[l]),numpy.mean(speedByLine[l]),numpy.median(speedByLine[l]),\
                                min(speedByLine[l]),max(speedByLine[l]),numpy.percentile(speedByLine[l],25),numpy.percentile(speedByLine[l],75))

                else:
                    for b in speedsByBus:
                        if len(speedsByBus[b]) > 0:
                            formatted += "%d,%s,%s,%f\n"%(i-1,b,linesByBus[b],numpy.mean(speedsByBus[b]))

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
        selectionMode = inputJson['selectionMode']

        outputJson = {}
        count = 0
        for f in features:
            cursor = self.getRecords(f, filters, selectionMode)
            records = list(cursor)
            byBus = self.computeSpeedsByBus(records)
            speedByLine = self.aggregateByLine(byBus)
            outputJson[count] = {}
            for l in speedByLine:
                if len(speedByLine) > 0:
                    if len(speedByLine[l]) >= 1.0 and numpy.mean(speedByLine[l]) > 1.0:
                        outputJson[count][l] = {}
                        outputJson[count][l]['count'] = len(speedByLine[l])
                        outputJson[count][l]['mean'] = numpy.mean(speedByLine[l])
                        outputJson[count][l]['median'] = numpy.median(speedByLine[l])
                        outputJson[count][l]['std'] = numpy.std(speedByLine[l])
                        outputJson[count][l]['min'] = min(speedByLine[l])
                        outputJson[count][l]['max'] = max(speedByLine[l])
                        outputJson[count][l]['percentile25th'] = numpy.percentile(speedByLine[l],25)
                        outputJson[count][l]['percentile75th'] = numpy.percentile(speedByLine[l],75)
            count+=1

        return outputJson


##################################################################################
#### Server: return requested dwell time
##################################################################################
    @cherrypy.expose
    @cherrypy.tools.json_in()
    @cherrypy.tools.json_out()
    def getDwellTime(self):
        inputJson = cherrypy.request.json
        filters  = self.getFilters(inputJson)
        features = inputJson['path']['features']
        selectionMode = inputJson['selectionMode']

        outputJson = {}
        count = 0
        for f in features:
            cursor = self.getRecords(f, filters, selectionMode)
            records = list(cursor)

            # for now, considering dwell time just as difference between first and last ping. need to improve it
            times = {}
            buses = {}
            for e in records:
                b = e['DatedVehicleJourneyRef']
                if b in times:
                    times[b].append(numpy.datetime64(e['RecordedAtTime']))
                    buses[b].append(e)
                else:
                    times[b] = []
                    times[b].append(numpy.datetime64(e['RecordedAtTime']))
                    buses[b] = []
                    buses[b].append(e)

            sumDwellTime = 0.0
            countValid = 0
            for b in times:
                dwellTime = (max(times[b]) - min(times[b])).astype(int) / 1000000.0
                if(dwellTime > 0):
                    sumDwellTime += dwellTime
                    countValid += 1

            if(countValid > 0):
                outputJson[count] = ((sumDwellTime / countValid))

            count+=1

        return outputJson

def startServer(hostName, mongoHostName, user, password, dbName, collectionName):
    # Uncomment below for server functionality
    PATH = os.path.abspath(os.path.dirname(__file__))
    class Root(object): pass
    cherrypy.tree.mount(StackMirror(mongoHostName, user, password, dbName, collectionName), '/', config={
            '/': {
                    'tools.staticdir.on': True,
                    'tools.staticdir.dir': PATH,
                    'tools.staticdir.index': 'index.html',
                },
        })

    hostName = hostName.split(":")
    # sudo iptables -A INPUT -p tcp --dport 8080 -j ACCEPT
    cherrypy.config.update({'server.socket_host': hostName[0],
                            'server.socket_port': int(hostName[1]),
                            'engine.autoreload.on': True
                            })
    cherrypy.engine.start()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='CherryPy server.')
    parser.add_argument(action="store", dest="mongoHostName", help='MongoDB hostname')
    parser.add_argument(action="store", dest="hostName", help='Server hostname')
    parser.add_argument('-u', action="store", dest="user", help='MongoDB username', default=None)
    parser.add_argument('-p', action="store", dest="password", help='MongoDB password', default=None)
    parser.add_argument('-d', action="store", dest="dbName", help='Database name', default='dot')
    parser.add_argument('-c', action="store", dest="collectionName", help='Collection name', default='bus')

    args = parser.parse_args()
    startServer(args.hostName, args.mongoHostName, args.user, args.password, args.dbName, args.collectionName)