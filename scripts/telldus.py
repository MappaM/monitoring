#!/usr/bin/python
import sys
from tellcore.telldus import TelldusCore
import tellcore

def main():
    core = TelldusCore()
    d = core.devices()[int(sys.argv[1])]
    if d.last_sent_command(tellcore.constants.TELLSTICK_TURNON | tellcore.constants.TELLSTICK_TURNOFF)==tellcore.constants.TELLSTICK_TURNON:
        print 1
    else:
        print 0

if __name__ == "__main__":
    main()
