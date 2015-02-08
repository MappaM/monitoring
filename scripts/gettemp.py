#!/usr/bin/python

import serial
import multiprocessing
from lockfile import LockFile

def main():
    lock = LockFile("/tmp/relay")
    with lock:
        ser = serial.Serial('/dev/ttyUSB0',19200,timeout=1)
        ser.flushInput()
        ser.write('T')
        s = ser.readline()
    print s

if __name__ == "__main__":
    main()
