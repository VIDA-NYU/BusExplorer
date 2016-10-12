
/**
#
# DOT Time Tool
#
*/

from os import path, curdir
from pymongo import MongoClient
import cherrypy
import os
import csv
import math
import copy
import random
import json

class StackMirror():
    db = MongoClient()["mta"]
    collection = db.bus

    @cherrypy.expose
    def index(self):
        return file("index.html")

    def getData(self, geoJson):
        query = {"VehicleLocation" : {"$geoWithin": geoJson}}
        records = self.collection.find()
        return records


    @cherrypy.expose
    @cherrypy.tools.json_out()
    @cherrypy.tools.json_in()
    def getPings(self):
        inputJson = cherrypy.request.json
        features = inputJson['path']['features']
        for f in features:
            data = self.getData(f)





# Uncomment below for server functionality
PATH = os.path.abspath(os.path.dirname(__file__))
class Root(object): pass
cherrypy.tree.mount(StackMirror(), '/', config={
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