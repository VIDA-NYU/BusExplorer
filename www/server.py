
# DOT Time Tool

from os import path, curdir
from pymongo import MongoClient
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

    def getData(self, geoJson):
        filters = []

        # modify geoJson so that it suits pymongo
        geoJson.pop("type")
        geoJson.pop("properties")
        geoJson["$geometry"] = geoJson.pop("geometry")

        query = {"VehicleLocation" : {"$geoWithin": geoJson}}
        filters.append(query)
        
        records = self.collection.find({'$and': filters})
        print len(list(records))
        return records


    @cherrypy.expose
    @cherrypy.tools.json_out()
    @cherrypy.tools.json_in()
    def getPings(self):
        inputJson = cherrypy.request.json
        features = inputJson['path']['features']
        for f in features:
            data = self.getData(f)

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
                            'engine.autoreload_on': True
                            })
    cherrypy.engine.start()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='CherryPy server.')
    parser.add_argument('-d', action="store", dest="dbName", help='Database name', default='dot')
    parser.add_argument('-c', action="store", dest="collectionName", help='Collection name', default='bus')

    args = parser.parse_args()
    startServer(args.dbName, args.collectionName)