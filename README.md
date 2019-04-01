# Bus Time Tool 

This web-based tool makes it easy for the end users to access [bus trajectory data](http://bustime.mta.info/wiki/Developers/Index) and to query it without any delay or external help. Moreover, the tool allows the users to conduct a series of data visualization and analysis operations demonstrating the potential of a such web-based tool for future applications.

The tool was first presented in the [paper](https://vgc.poly.edu/~fmiranda/bus/mt-its-2017-bus.pdf):

**Data Visualization Tool for Monitoring Transit Operation and Performance**   
Abdullah Kurkcu, Fabio Miranda, Kaan Ozbay and Cláudio T. Silva  
*2017 5th IEEE International Conference on Models and Technologies for Intelligent Transportation Systems (MT-ITS)*


## Table of contents

   * [Installing prerequisites](#installing-prerequisites)
      * [Linux (Ubuntu, Linux Mint)](#linux-ubuntu-linux-mint)
      * [macOS](#macos)
   * [Running](#running)
      * [Web client](#web-client)

## Installing prerequisites

The following are prerequisites for all systems:

1. MongoDB
3. Python 2.7

### Linux (Ubuntu, Linux Mint)
1. Make sure you have Python 2.7:

	```
	sudo apt-get install python2.7
	```

2. Install MongoDB following the steps at [mongodb.com](https://docs.mongodb.com/manual/tutorial/install-mongodb-on-ubuntu/)

### macOS
1. Make sure you have Python 2.7:

	```
	brew install python
	```

2. Install MongoDB following the steps at [mongodb.com](https://docs.mongodb.com/manual/tutorial/install-mongodb-on-os-x/)

## Running:
1. Unzip the file ```sample2M.csv.zip``` (inside data folder).

2. Initialize MongoDB with a sample of bus pings by running:

	```
	python export_csv_to_mongo.py ./sample2M.csv -e
	```

   This will create a new database and also populate it with the samples provided in the csv file.

   For detailed information of how to use export_csv_to_mongo.py, type:

	```
	python export_csv_to_mongo.py --help
	```

3. Initialize the webserver:

	```
	python server.py
	```

4. A new browser window will open with the tool:

<p align="center">
  <img src="https://raw.githubusercontent.com/ViDA-NYU/BusExplorer/master/interface.png" alt="Bus Time Tool interface"/>
</p>
