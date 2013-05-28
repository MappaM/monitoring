#!/bin/python

#dependency  pywapi psi pysensors 
#program dependency hdparm nvidia-smi if nvidia

import pywapi
import sys
import datetime
import random
import os, platform, subprocess, re
import urllib2
import multiprocessing
import psi
import numpy

from math import log
if (len(sys.argv) != 1):
	print 'Usage : python.py computer.py'
	sys.exit(-1)

verbose = False
energy = []

def get_processor_name():
    command = "cat /proc/cpuinfo"
    all_info = subprocess.check_output(command, shell=True).strip()
    for line in all_info.split("\n"):
        if "model name" in line:
            return re.sub( ".*model name.*:", "", line,1)
    return ""


#Laptop or desktop? If laptop, there's a lid...
mobile =  os.path.exists("/proc/acpi/button/lid/")
if (mobile):
	if verbose:
		print "You appear to be on a laptop"

#Processor
model = get_processor_name()
processor_energy = -1
while (processor_energy == -1): #Intel sometimes return a 500 error. We just have to retry 5 to 10 times...
	try:
		if (re.search( "intel", model, re.I)):		
			modelstripped = re.sub( "\(r\)|\(tm\)|intel|[@][ ]?[0-9]+.[0-9]+[kmghz]+|cpu|celeron|\t", " ", model,0,re.I).strip()
			if verbose:
				print "Intel processor detected : " + modelstripped
			url = "http://ark.intel.com/search?q="+re.sub("[ ]+","+",modelstripped)
		
			content = urllib2.urlopen(url).read()
			
			tdp = re.search("([0-9]+) W",content,re.I | re.M)
			if tdp:
				processor_energy = float(tdp.group(1))
				if verbose:
					print "Processor MAX TDP found on intel.com : %f" % processor_energy
			else:
				regex = "href=\"/products/([0-9]+)/.*?" + re.sub("[ ]+",".*?",modelstripped)

#				print regex
				m2 = re.search(regex,content,re.I | re.M | re.S)
				if m2:
					pid =  m2.group(1)
					content3 = urllib2.urlopen("http://ark.intel.com/products/"+pid+"/").read()
					m3 = re.search("([0-9]+) W",content3,re.I | re.M)
					if m3:
						processor_energy = float(m3.group(1))
						if verbose:
							print "Processor MAX TDP found on intel.com : %f" % processor_energy
				else:
					if verbose:
						print "Processor model could not be find on intel.com, assuming MAX TDP 65Watt"
					processor_energy = 65

		else:
			if verbose:
				print "Processor manufacturer unknow, assuming MAX TDP 65Watt"
			processor_energy = 65
	except urllib2.HTTPError:
		processor_energy = -1;

#Hard drives
all_info = subprocess.check_output("ls /dev/sd[a-z]", shell=True).strip()
for drive in all_info.split("\n"):
	try:
		dev_info = subprocess.check_output("hdparm -I " + drive, shell=True).strip()
		ssd = False
		for hi in dev_info.split("\n"):
			if "Solid State Device" in hi:
				ssd = True
		if ssd:
			if verbose:
				print "SSD Detected. Assuming 0.8Watt"
			energy.append(0.8)
		else:
			if mobile:	
				if verbose:		
					print "HDD Detected. Assuming 2Watt"
				energy.append(2)
			else:
				if verbose:
					print "HDD Detected. Assuming 7Watt"
				energy.append(7)
	except subprocess.CalledProcessError:
		#An error could appear if it's not really a disk, like a usb stick or cdrom, we count 0.5W for these
		energy.append(0.5)

#---Processor load
load = (os.getloadavg()[2])/multiprocessing.cpu_count()
if verbose:
	print "Your system load is %.2f" % load
energy.append(processor_energy * (load/2 + 0.5))

#Motherboard
if (mobile):
	energy.append(8)
else:
	energy.append(20)

#Graphic card
card = subprocess.check_output("lspci | grep -i vga", shell=True).strip()

if "nvidia" in card.lower():
	card = re.search( ".*:([a-z0-9 \[\]]+)", card, re.I ).group(1)

	newcard = re.search("([0-9]{3,4})(M)?",card,re.I)
	mobilegpu = newcard.group(2)

	if mobilegpu:
		gpumin = 10
		gpumax = 100
	else:
		gpumin = 25
		gpumax = 250

	model = int(newcard.group(1))
	#The old series are 4 number
	if (model>1000):
		gpumax = gpumax * 0.7
		model = model/10
	rangeingamme = (model % 100) / 10.0
	if verbose:
		print "Your gpu is %d / 10 of its gamme, its gamme starts from %d W to %d W" % (rangeingamme,gpumin,gpumax)

	#Load is exponential with gamme
	gpu = gpumin + ((1-(log(11-rangeingamme)/log(11))) * (gpumax-gpumin))

	#For now we assume cpu load for gpu
	gc = gpu * load
	if verbose:
		print "Your gpu has a load of %f, assuming %d Watts " % (load,gc)

	all_info = subprocess.check_output("glxinfo", shell=True).strip()
	vendor = ""
	card = ""
	for line in all_info.split("\n"):
		if "vendor string" in line:
		        vendor = re.sub( ".*vendor string.*: ", "", line,1)
		elif "renderer string" in line:
		        card = re.sub( ".*renderer string.*: ", "", line,1)

else:
	#Vendor could not be found or internal chipset, assuming internal chipset (not much consumption)
	gc = 2 if (mobile) else 5
	if verbose:
		print "Vendor of graphic card could not be found or internal chipset, assuming %d Watt"
	
energy.append(gc)

#Fans
nfan = 0
command = "cat /sys/class/thermal/cooling_device*/cur_state"
all_info = subprocess.check_output(command, shell=True).strip()
for line in all_info.split("\n"):
    if (float(line) >= 1):
	 nfan += 1;

if (mobile and nfan==0):
	nfan = 1

#---The power fan of desktop is nearly never monitored
if (not mobile):
	nfan += 1
if verbose:
	print "You appear to have %d fan." % nfan


#Calculating sum
somme = numpy.array(energy).sum()

#Average power conversion efficiency: 80%, and 1 watt base
somme = somme / 0.8 + 1

print somme / 1000
