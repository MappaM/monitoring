#!/bin/python

import serial
import sys

def relay_command(command,rid):
    ser = serial.Serial('/dev/ttyUSB0',9600,timeout=1)
    ser.flush()
    ser.write(command)
    ser.write(chr(rid))

def main():
    relay_command(sys.argv[1][0],int(sys.argv[2]));

if __name__ == "__main__":
    main()
