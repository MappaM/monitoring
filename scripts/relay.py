#!/bin/python

import serial
import sys
from lockfile import LockFile

def relay_command(command,rid):
    lock = LockFile("/tmp/relay", timeout=5)
    try:
        with lock:
            ser = serial.Serial('/dev/ttyUSB0',9600,timeout=1)
            ser.flush()
            ser.write(command)
            if (rid >= 0):
    	        #print (rid >> 8) & 0xff
                #print (rid     ) & 0xff
                ser.write(chr((rid >> 8) & 0xff))
                ser.write(chr((rid     ) & 0xff))
            else:
                print ser.readline()
    except lockfile.LockTimeout:
        lockfile.break_lock()
        relay_command(command,rid)

def main():
    if (len(sys.argv) > 2):
        relay_command(sys.argv[1][0],int(sys.argv[2]));
    else:
        relay_command(sys.argv[1][0],-1);

if __name__ == "__main__":
    main()
