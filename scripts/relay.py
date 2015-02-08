#!/usr/bin/python
import datetime
import serial
import sys
from lockfile import LockFile
from lockfile import LockTimeout
import urllib2
import math
import os,time

#Url to call when a value is updated, a 0 or the consumption value is added at the end of the URL depending of the state of the relay
http_url = {2:("http://monitor.tombarbette.be/data/ZoD4Opi5N0xK/",2.0)}


#We keep a cache of the last status of the relays
last_status_file = '/home/tom/status/relay'
log_file = '/home/tom/status/log'
def set_last_status(status):
    f = open( last_status_file, 'w+' )
    f.write(status)
    f.close()

def get_last_status():
    #If status file is 5seconds  old, we re-read the status
    if (datetime.datetime.now() - datetime.datetime.fromtimestamp(os.path.getmtime(last_status_file)) > datetime.timedelta(0,5)):
        return get_current_status()
    else:
        try:
            f = open ( last_status_file, 'r' )
            v = f.read()
            f.close()
        except IOError:
            return -1
    return v

def get_current_status():
    r = relay_command("G",-1)
    return r

def update_status(rid,command):
    r = get_last_status()
    if (not r):
        return False;
    if (command == 'A' or command=='E'):
        ix = len(r) - int(math.log(int(rid),2)) - 2
        rs = list(r)
        rs[ix] = '1' if (command=='A') else '0'
        r = ''.join(rs)
    elif (command == 'S' or command=='D'):
        r = get_current_status()
    else:
        return
    set_last_status(r)

def relay_status(device_id):
    #if len(r) < 16: #An error occured

    r = get_last_status()

    if (r == -1 or r == False):
        print "Unable to get relay status !"
        return -1

    set_last_status(r)

    ix = len(r) - int(math.log(int(device_id),2)) - 2
    if (ix < 0 or ix >= len(r)):
        return -1
    return (int(r[ix]) == 1)

def relay_command(command,rid):
    if (rid and rid != -1):
        state = relay_status(rid)
    else:
        state = -1

    if (command == 'g'):
        return '1' if state else '0'

    lock = LockFile("/tmp/relay", timeout=5)
    try:
        with lock:
            log = open(log_file,"a")
            log.write(str(command) + " " + str(rid) + "\n")
            log.close()
            ser = serial.Serial('/dev/ttyUSB0',19200,timeout=1)
            ser.flush()
            ser.write(command)
            if (rid >= 0):
                ser.write(chr((int(rid) >> 8) & 0xff))
                ser.write(chr((int(rid)     ) & 0xff))
            else:
                return ser.readline()
    except LockTimeout:
        lock.break_lock()
    if state != -1 and (int(rid) in http_url):
        url, consumption = http_url[int(rid)]
    else:
        url = False

    if (url != False):
        if (command == 'A' and not state):
            urllib2.urlopen(url + str(float(0)))
            urllib2.urlopen(url + str(float(consumption)))
        elif (command == 'E' and state):
            urllib2.urlopen(url + str(float(consumption)))
            urllib2.urlopen(url + str(float(0)))

    update_status(rid,command)
    return ''

def main():
    if (len(sys.argv) > 2):
        resp = relay_command(sys.argv[1][0],int(sys.argv[2]));
    else:
        resp = relay_command(sys.argv[1][0],-1);
    if (resp):
        print resp

if __name__ == "__main__":
    main()
